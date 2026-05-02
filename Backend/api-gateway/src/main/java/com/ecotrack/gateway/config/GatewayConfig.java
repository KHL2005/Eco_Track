package com.ecotrack.gateway.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.gateway.filter.ratelimit.KeyResolver;
import org.springframework.cloud.gateway.filter.ratelimit.RedisRateLimiter;
import org.springframework.cloud.gateway.route.RouteLocator;
import org.springframework.cloud.gateway.route.builder.GatewayFilterSpec;
import org.springframework.cloud.gateway.route.builder.RouteLocatorBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import reactor.core.publisher.Mono;

import java.net.InetSocketAddress;
import java.time.Duration;
import java.util.Set;

/**
 * Gateway resilience configuration — Routes, Circuit Breaker, Retry, Rate Limiter.
 *
 * Every route in the system passes through the same three-layer resilience stack,
 * applied in this order:
 *
 *   ┌────────────────────────────────────────────────────────────────────────┐
 *   │  Inbound request                                                       │
 *   │       │                                                                │
 *   │       ▼                                                                │
 *   │  [1] RequestRateLimiter  (Redis token-bucket, per user/IP)            │
 *   │       │  quota ok? → continue                                         │
 *   │       │  quota exceeded? → 429 Too Many Requests  (stops here)        │
 *   │       ▼                                                                │
 *   │  [2] CircuitBreaker  (Resilience4j, per-service instance)             │
 *   │       │  CLOSED / HALF_OPEN? → continue                               │
 *   │       │  OPEN? → forward:/fallback/<svc>  → 503  (stops here)        │
 *   │       ▼                                                                │
 *   │  [3] Retry  (GET only, exponential backoff 50 ms → 500 ms, 2 retries) │
 *   │       │  success? → 2xx response returned                             │
 *   │       │  still failing after retries? → CB records failure            │
 *   │       ▼                                                                │
 *   │  Downstream microservice                                               │
 *   └────────────────────────────────────────────────────────────────────────┘
 *
 * Why this order?
 *   • RateLimiter first  — rejects abusive clients before touching any downstream
 *     resource; rate-limited requests are NOT counted as CB failures.
 *   • CircuitBreaker second — short-circuits immediately when a service is known
 *     unhealthy; no retry budget is wasted.
 *   • Retry innermost — retries happen *within* the CB context so every failed
 *     attempt (including retried ones) is counted toward the CB failure rate.
 *
 * HTTP 5xx status codes (500, 502, 503, 504) returned by downstream services are
 * mapped to exceptions by the CB filter so they contribute to the failure rate
 * exactly like network-level errors do.
 *
 * Retry is intentionally restricted to GET (idempotent) requests only.
 * POST / PUT / PATCH / DELETE are never retried to prevent duplicate side-effects.
 *
 * Resilience4j circuit-breaker instance thresholds and TimeLimiter timeouts
 * are configured in application.yml under resilience4j.circuitbreaker / timelimiter.
 */
@Configuration
@Slf4j
public class GatewayConfig {

    // ── Rate-limiter constants ────────────────────────────────────────────────

    /**
     * Tokens added to every client's bucket per second.
     * Sustained throughput per unique user or IP = 20 req/s.
     */
    private static final int RATE_LIMITER_REPLENISH_RATE = 20;

    /**
     * Maximum tokens a bucket can hold (burst capacity).
     * Allows short spikes up to 40 req/s before throttling.
     */
    private static final int RATE_LIMITER_BURST_CAPACITY = 40;

    /** Each request consumes 1 token. */
    private static final int RATE_LIMITER_REQUESTED_TOKENS = 1;

    // ── Retry constants ───────────────────────────────────────────────────────

    /** Total retry attempts after the initial try  (i.e. up to 3 total calls). */
    private static final int RETRY_COUNT = 2;

    private static final Duration RETRY_FIRST_BACKOFF = Duration.ofMillis(50);
    private static final Duration RETRY_MAX_BACKOFF   = Duration.ofMillis(500);
    private static final int      RETRY_FACTOR        = 2;

    // ── Beans ─────────────────────────────────────────────────────────────────

    /**
     * Identifies the "client" for rate-limiting purposes.
     *
     * <ul>
     *   <li>Authenticated requests  → keyed by {@code X-User-Id} header
     *       (injected by {@link com.ecotrack.gateway.security.JwtAuthenticationFilter})</li>
     *   <li>Public / unauthenticated requests (auth, Swagger) → keyed by remote IP</li>
     * </ul>
     *
     * The "user:" / "ip:" prefix prevents accidental key collisions between
     * a userId that happens to look like an IP address.
     */
    @Bean
    public KeyResolver ipKeyResolver() {
        return exchange -> {
            String userId = exchange.getRequest().getHeaders().getFirst("X-User-Id");
            if (userId != null && !userId.isBlank()) {
                return Mono.just("user:" + userId);
            }
            InetSocketAddress remote = exchange.getRequest().getRemoteAddress();
            String ip = (remote != null)
                    ? remote.getAddress().getHostAddress()
                    : "unknown";
            return Mono.just("ip:" + ip);
        };
    }

    /**
     * Redis-backed token-bucket rate limiter.
     * State is stored in Redis so limits are enforced consistently across
     * multiple gateway instances (horizontal scale-out).
     */
    @Bean
    public RedisRateLimiter redisRateLimiter() {
        return new RedisRateLimiter(
                RATE_LIMITER_REPLENISH_RATE,
                RATE_LIMITER_BURST_CAPACITY,
                RATE_LIMITER_REQUESTED_TOKENS);
    }

    // ── Route definitions ─────────────────────────────────────────────────────

    /**
     * All gateway routes. Routes are grouped by downstream service so they share
     * the same named circuit-breaker instance (and thus the same CB state).
     *
     * <p>Multiple routes for the same service share one CB name (e.g. "iamCB").
     * Resilience4j maintains a single state machine per instance name, so
     * degradation of the IAM service opens the circuit for ALL IAM routes at once.
     */
    @Bean
    public RouteLocator routeLocator(RouteLocatorBuilder builder) {
        var b = builder.routes();

        // ── IAM Service  (port 8081) ──────────────────────────────────────────
        b
            .route("iam-auth",
                    r -> r.path("/api/v1/auth/**")
                          .filters(f -> applyFilters(f, "iamCB", "/fallback/iam"))
                          .uri("lb://iam-service"))

            .route("iam-users",
                    r -> r.path("/api/v1/users/**")
                          .filters(f -> applyFilters(f, "iamCB", "/fallback/iam"))
                          .uri("lb://iam-service"))

            .route("iam-notifications",
                    r -> r.path("/api/v1/notifications/**")
                          .filters(f -> applyFilters(f, "iamCB", "/fallback/iam"))
                          .uri("lb://iam-service"));

        // ── Citizen Reporting Service  (port 8083) ────────────────────────────
        b
            .route("citizen-issues",
                    r -> r.path("/api/v1/issues/**")
                          .filters(f -> applyFilters(f, "citizenCB", "/fallback/citizen"))
                          .uri("lb://citizen-reporting-service"));

        // ── Environmental Monitoring Service  (port 8084) ─────────────────────
        b
            .route("monitoring-sensors",
                    r -> r.path("/api/v1/sensors/**")
                          .filters(f -> applyFilters(f, "monitoringCB", "/fallback/monitoring"))
                          .uri("lb://environmental-monitoring-service"))

            .route("monitoring-sensor-data",
                    r -> r.path("/api/v1/sensor-data/**")
                          .filters(f -> applyFilters(f, "monitoringCB", "/fallback/monitoring"))
                          .uri("lb://environmental-monitoring-service"))

            .route("monitoring-analysis",
                    r -> r.path("/api/v1/analysis/**")
                          .filters(f -> applyFilters(f, "monitoringCB", "/fallback/monitoring"))
                          .uri("lb://environmental-monitoring-service"))

            .route("monitoring-csv",
                    r -> r.path("/api/v1/upload-csv/**")
                          .filters(f -> applyFilters(f, "monitoringCB", "/fallback/monitoring"))
                          .uri("lb://environmental-monitoring-service"));

        // ── Industry Compliance Service  (port 8085) ──────────────────────────
        b
            .route("industry-emissions",
                    r -> r.path("/api/v1/emissions/**")
                          .filters(f -> applyFilters(f, "industryCB", "/fallback/industry"))
                          .uri("lb://industry-compliance-service"))

            .route("industry-documents",
                    r -> r.path("/api/v1/industry-documents/**")
                          .filters(f -> applyFilters(f, "industryCB", "/fallback/industry"))
                          .uri("lb://industry-compliance-service"));

        // ── Project Management Service  (port 8086) ───────────────────────────
        b
            .route("project-projects",
                    r -> r.path("/api/v1/projects/**")
                          .filters(f -> applyFilters(f, "projectCB", "/fallback/project"))
                          .uri("lb://project-management-service"))

            .route("project-reports",
                    r -> r.path("/api/v1/reports/**")
                          .filters(f -> applyFilters(f, "projectCB", "/fallback/project"))
                          .uri("lb://project-management-service"));

        // ── Compliance Audit Service  (port 8087) ─────────────────────────────
        b
            .route("compliance-records",
                    r -> r.path("/api/v1/compliance/**")
                          .filters(f -> applyFilters(f, "complianceCB", "/fallback/compliance"))
                          .uri("lb://compliance-audit-service"))

            .route("compliance-audits",
                    r -> r.path("/api/v1/audits/**")
                          .filters(f -> applyFilters(f, "complianceCB", "/fallback/compliance"))
                          .uri("lb://compliance-audit-service"));

        return b.build();
    }

    // ── Shared filter stack ───────────────────────────────────────────────────

    /**
     * Applies the three-layer resilience stack to a route's filter spec.
     *
     * <p>Filter execution order (pre-phase, i.e. left to right):
     * <ol>
     *   <li>RequestRateLimiter — returns 429 if quota exceeded; stops here.</li>
     *   <li>CircuitBreaker     — returns 503 (fallback) if circuit OPEN; stops here.</li>
     *   <li>Retry             — wraps the actual downstream call; retries on failure
     *       using exponential back-off (GET only).</li>
     * </ol>
     *
     * HTTP 4xx from downstream are NOT retried and do NOT count as CB failures.
     * HTTP 5xx (500, 502, 503, 504) are mapped to exceptions by the CB filter
     * so they increment the CB failure counter and trigger retries on GET.
     *
     * @param f           the {@link GatewayFilterSpec} for the route being built
     * @param cbName      Resilience4j circuit-breaker instance name (e.g. "iamCB")
     * @param fallbackUri internal forward path served when the circuit is open
     */
    private GatewayFilterSpec applyFilters(GatewayFilterSpec f,
                                           String cbName,
                                           String fallbackUri) {
        return f
                // ── 1. Rate Limiter ──────────────────────────────────────────
                // Checked before the CB so rate-limited requests never count
                // as circuit-breaker failures.
                .requestRateLimiter(c -> c
                        .setRateLimiter(redisRateLimiter())
                        .setKeyResolver(ipKeyResolver()))

                // ── 2. Circuit Breaker ───────────────────────────────────────
                // statusCodes: treat these HTTP responses as exceptions so they
                // increment the CB failure counter (by default only thrown
                // exceptions increment it, not response codes).
                .circuitBreaker(c -> c
                        .setName(cbName)
                        .setFallbackUri(fallbackUri)
                        .setStatusCodes(Set.of("500", "502", "503", "504")))

                // ── 3. Retry ─────────────────────────────────────────────────
                // GET-only so mutating requests are never replayed.
                // Backoff: 50 ms → 100 ms → 200 ms (capped at 500 ms).
                // Retries happen INSIDE the CB context; every failed attempt
                // (including retried ones) is counted toward the CB failure rate.
                .retry(c -> c
                        .setRetries(RETRY_COUNT)
                        .setStatuses(
                                HttpStatus.BAD_GATEWAY,
                                HttpStatus.SERVICE_UNAVAILABLE,
                                HttpStatus.GATEWAY_TIMEOUT,
                                HttpStatus.INTERNAL_SERVER_ERROR)
                        .setMethods(HttpMethod.GET)
                        .setBackoff(RETRY_FIRST_BACKOFF, RETRY_MAX_BACKOFF,
                                    RETRY_FACTOR, false));
    }
}

