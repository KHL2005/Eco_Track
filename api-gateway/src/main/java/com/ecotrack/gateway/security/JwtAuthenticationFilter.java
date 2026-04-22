package com.ecotrack.gateway.security;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;

/**
 * Global reactive filter that runs on EVERY request entering the API Gateway.
 *
 * Responsibilities:
 *  1. Skip JWT check for open/public paths.
 *  2. Extract and validate the Bearer token using JwtUtil.
 *  3. Perform coarse-grained role-based access control.
 *  4. Forward user context (X-User-Id, X-User-Role, X-User-Email) to downstream services.
 *
 * This is the ONLY place in the system where JWT is validated.
 * Downstream microservices trust the forwarded headers.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class JwtAuthenticationFilter implements GlobalFilter, Ordered {

    private final JwtUtil jwtUtil;

    // ── Open paths (no JWT required) ─────────────────────────────────────────

    private static final List<String> OPEN_PATHS = List.of(
            "/api/v1/auth/register",
            "/api/v1/auth/login",
            "/api/v1/internal/",
            // Swagger UI HTML + assets
            "/swagger-ui",
            "/swagger-ui.html",
            "/webjars/",
            "/actuator",
            // Per-service swagger UI via gateway  (http://localhost:8090/<svc>/swagger-ui/...)
            "/iam/swagger-ui",
            "/citizen/swagger-ui",
            "/monitoring/swagger-ui",
            "/industry/swagger-ui",
            "/project/swagger-ui",
            "/compliance/swagger-ui",
            // Per-service OpenAPI JSON via gateway (http://localhost:8090/<svc>/v3/api-docs)
            "/v3/api-docs",
            "/iam/v3/api-docs",
            "/citizen/v3/api-docs",
            "/monitoring/v3/api-docs",
            "/industry/v3/api-docs",
            "/project/v3/api-docs",
            "/compliance/v3/api-docs"
    );

    // ── Role → permitted path prefixes ────────────────────────────────────────

    private static final Map<String, List<String>> ROLE_PERMISSIONS = Map.ofEntries(
            Map.entry("CITIZEN",       List.of(
                    "/api/v1/issues",
                    "/api/v1/notifications"
            )),
            Map.entry("OFFICER",       List.of(
                    "/api/v1/issues",
                    "/api/v1/sensors",     "/api/v1/sensor-data",
                    "/api/v1/analysis",    "/api/v1/upload-csv",
                    "/api/v1/compliance",  "/api/v1/audits",
                    "/api/v1/projects",    "/api/v1/reports",
                    "/api/v1/emissions",   "/api/v1/industry-documents",
                    "/api/v1/users",       "/api/v1/notifications"
            )),
            Map.entry("SCIENTIST",     List.of(
                    "/api/v1/sensors",     "/api/v1/sensor-data",
                    "/api/v1/analysis",    "/api/v1/upload-csv",
                    "/api/v1/projects",    "/api/v1/reports",
                    "/api/v1/notifications"
            )),
            Map.entry("INDUSTRY",      List.of(
                    "/api/v1/emissions",   "/api/v1/industry-documents",
                    "/api/v1/compliance",
                    "/api/v1/projects",    "/api/v1/reports",
                    "/api/v1/notifications"
            )),
            Map.entry("SUPER_ADMIN",    List.of("/api/v1")),   // ✅ was "ADMIN"
            Map.entry("ADMINISTRATOR",  List.of("/api/v1"))    // ✅ new entry
    );


    // ── GlobalFilter ─────────────────────────────────────────────────────────

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        String path = exchange.getRequest().getURI().getPath();

        // 1. Skip JWT check for open endpoints
        if (isOpenPath(path)) {
            return chain.filter(exchange);
        }

        // 2. Extract Authorization header
        String authHeader = exchange.getRequest().getHeaders().getFirst(HttpHeaders.AUTHORIZATION);
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return unauthorizedResponse(exchange, "Missing or invalid Authorization header");
        }

        String token = authHeader.substring(7);

        // 3. Validate token
        if (!jwtUtil.isTokenValid(token)) {
            return unauthorizedResponse(exchange, "Invalid or expired JWT token");
        }

        // 4. Extract claims
        String email  = jwtUtil.extractEmail(token);
        String role   = jwtUtil.extractRole(token);
        String userId = jwtUtil.extractUserId(token);

        log.debug("JWT validated — user: {}, role: {}, path: {}", email, role, path);

        // 5. Coarse-grained role-based access check
        if (!isPathAllowedForRole(role, path)) {
            log.warn("Access denied — role: {}, path: {}", role, path);
            return forbiddenResponse(exchange, "Access denied for role: " + role);
        }

        // 6. Forward user context headers to downstream services
        ServerHttpRequest mutatedRequest = exchange.getRequest().mutate()
                .header("X-User-Email", email  != null ? email  : "")
                .header("X-User-Role",  role   != null ? role   : "")
                .header("X-User-Id",    userId != null ? userId : "")
                .build();

        return chain.filter(exchange.mutate().request(mutatedRequest).build());
    }

    @Override
    public int getOrder() {
        return -1; // run before all other filters
    }

    // ── helpers ──────────────────────────────────────────────────────────────

    private boolean isOpenPath(String path) {
        return OPEN_PATHS.stream().anyMatch(path::contains);
    }

    private boolean isPathAllowedForRole(String role, String path) {
        if (role == null) return false;
        List<String> allowed = ROLE_PERMISSIONS.get(role);
        if (allowed == null) return false;
        return allowed.stream().anyMatch(path::startsWith);
    }

    private Mono<Void> unauthorizedResponse(ServerWebExchange exchange, String reason) {
        ServerHttpResponse response = exchange.getResponse();
        response.setStatusCode(HttpStatus.UNAUTHORIZED);
        response.getHeaders().add("X-Auth-Error", reason);
        log.warn("401 Unauthorized — {}", reason);
        return response.setComplete();
    }

    private Mono<Void> forbiddenResponse(ServerWebExchange exchange, String reason) {
        ServerHttpResponse response = exchange.getResponse();
        response.setStatusCode(HttpStatus.FORBIDDEN);
        response.getHeaders().add("X-Auth-Error", reason);
        return response.setComplete();
    }
}

