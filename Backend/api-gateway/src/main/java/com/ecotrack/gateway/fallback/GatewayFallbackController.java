package com.ecotrack.gateway.fallback;

import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.gateway.support.ServerWebExchangeUtils;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ServerWebExchange;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Fallback endpoints invoked by the CircuitBreaker GatewayFilter when a
 * downstream service circuit is OPEN (or when a TimeLimiter timeout fires).
 *
 * <p>How the wiring works:
 * <ol>
 *   <li>The CircuitBreaker filter is configured with
 *       {@code fallbackUri = "forward:/fallback/<svc>"}.</li>
 *   <li>When the circuit opens, Spring Cloud Gateway calls
 *       {@code DispatcherHandler.handle(exchange)} with the fallback path.
 *       This dispatch goes directly to Spring's handler-mapping layer —
 *       it does NOT re-run GlobalFilters (JWT filter, etc.), so there is no
 *       auth interference with the internal forward.</li>
 *   <li>The exchange attributes already contain
 *       {@link ServerWebExchangeUtils#CIRCUITBREAKER_EXECUTION_EXCEPTION_ATTR}
 *       set by the CircuitBreaker filter, which we log for diagnostics.</li>
 * </ol>
 *
 * <p>All fallback methods return HTTP 503 with a structured JSON body:
 * <pre>
 * {
 *   "status":    503,
 *   "error":     "service_unavailable",
 *   "message":   "iam-service is temporarily unavailable. Please try again shortly.",
 *   "service":   "iam-service",
 *   "cause":     "ConnectException: Connection refused",
 *   "timestamp": "2026-04-28T10:15:30.123456Z"
 * }
 * </pre>
 */
@RestController
@Slf4j
public class GatewayFallbackController {

    // ── Per-service fallback endpoints ────────────────────────────────────────

    @RequestMapping("/fallback/iam")
    public ResponseEntity<Map<String, Object>> iamFallback(ServerWebExchange exchange) {
        return fallback("iam-service", exchange);
    }

    @RequestMapping("/fallback/citizen")
    public ResponseEntity<Map<String, Object>> citizenFallback(ServerWebExchange exchange) {
        return fallback("citizen-reporting-service", exchange);
    }

    @RequestMapping("/fallback/monitoring")
    public ResponseEntity<Map<String, Object>> monitoringFallback(ServerWebExchange exchange) {
        return fallback("environmental-monitoring-service", exchange);
    }

    @RequestMapping("/fallback/industry")
    public ResponseEntity<Map<String, Object>> industryFallback(ServerWebExchange exchange) {
        return fallback("industry-compliance-service", exchange);
    }

    @RequestMapping("/fallback/project")
    public ResponseEntity<Map<String, Object>> projectFallback(ServerWebExchange exchange) {
        return fallback("project-management-service", exchange);
    }

    @RequestMapping("/fallback/compliance")
    public ResponseEntity<Map<String, Object>> complianceFallback(ServerWebExchange exchange) {
        return fallback("compliance-audit-service", exchange);
    }

    // ── Shared builder ────────────────────────────────────────────────────────

    /**
     * Builds a 503 response and logs the root cause for diagnostics.
     *
     * @param service  human-readable service name used in the response body and logs
     * @param exchange the current server exchange (carries CB exception attribute)
     */
    private ResponseEntity<Map<String, Object>> fallback(String service,
                                                         ServerWebExchange exchange) {
        // The CB filter puts the triggering exception into exchange attributes.
        Throwable cause = exchange.getAttribute(
                ServerWebExchangeUtils.CIRCUITBREAKER_EXECUTION_EXCEPTION_ATTR);

        String causeMessage = (cause != null)
                ? cause.getClass().getSimpleName() + ": " + cause.getMessage()
                : "circuit breaker open or request timed out";

        log.warn("[Fallback] service={} cause={}", service, causeMessage);

        // LinkedHashMap preserves insertion order in the JSON response.
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("status",    503);
        body.put("error",     "service_unavailable");
        body.put("message",   service + " is temporarily unavailable. Please try again shortly.");
        body.put("service",   service);
        body.put("cause",     causeMessage);
        body.put("timestamp", Instant.now().toString());

        return ResponseEntity
                .status(HttpStatus.SERVICE_UNAVAILABLE)
                .body(body);
    }
}

