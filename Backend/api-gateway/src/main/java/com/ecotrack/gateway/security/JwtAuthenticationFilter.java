package com.ecotrack.gateway.security;

import com.ecotrack.gateway.security.JwtUtil.TokenValidationResult;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Component
@RequiredArgsConstructor
@Slf4j
public class JwtAuthenticationFilter implements GlobalFilter, Ordered {

    private final JwtUtil jwtUtil;

    private static final List<String> OPEN_PATH_PREFIXES = List.of(
            "/api/v1/auth/register",
            "/api/v1/auth/login",

            "/api/v1/internal/",      // service-to-service internal endpoints

            // ── Swagger / OpenAPI ──────────────────────────────────────────
            "/v3/api-docs",
            "/swagger-ui",
            "/swagger-ui.html",
            "/webjars/",
            "/actuator",

            // ── Per-service swagger via gateway prefix routing ──────────────
            "/iam/v3/api-docs",
            "/iam/swagger-ui",
            "/citizen/v3/api-docs",
            "/citizen/swagger-ui",
            "/monitoring/v3/api-docs",
            "/monitoring/swagger-ui",
            "/industry/v3/api-docs",
            "/industry/swagger-ui",
            "/project/v3/api-docs",
            "/project/swagger-ui",
            "/compliance/v3/api-docs",
            "/compliance/swagger-ui"
    );

    private static final List<String> ANY_AUTHENTICATED_PATHS = List.of(
            "/api/v1/users/change-password",  // every role can change their own password,
            "/api/v1/users/update-profile"
    );

    // ── Role → allowed path prefixes ─────────────────────────────────────────

    private static final Map<String, List<String>> ROLE_PERMISSIONS = Map.ofEntries(
            Map.entry("CITIZEN", List.of(
                    "/api/v1/issues",
                    "/api/v1/notifications"
            )),
            Map.entry("AGENCY_OFFICER", List.of(
                    "/api/v1/issues",
                    "/api/v1/sensors",          "/api/v1/sensor-data",
                    "/api/v1/analysis",         "/api/v1/upload-csv",
                    "/api/v1/projects",         "/api/v1/reports",
                    "/api/v1/users",            "/api/v1/notifications"
            )),
            Map.entry("COMPLIANCE_OFFICER", List.of(
                    "/api/v1/compliance",       "/api/v1/audits",
                    "/api/v1/emissions",        "/api/v1/industry-documents",
                    "/api/v1/users",            "/api/v1/notifications"
            )),
            Map.entry("SCIENTIST", List.of(
                    "/api/v1/sensors",          "/api/v1/sensor-data",
                    "/api/v1/analysis",         "/api/v1/upload-csv",
                    "/api/v1/projects",         "/api/v1/reports",
                    "/api/v1/notifications"

            )),
            Map.entry("INDUSTRY", List.of(
                    "/api/v1/emissions",        "/api/v1/industry-documents",
                    "/api/v1/compliance",
                    "/api/v1/projects",         "/api/v1/reports",
                    "/api/v1/notifications"
            )),

            Map.entry("SUPER_ADMIN",   List.of("/api/v1")),
            Map.entry("ADMINISTRATOR", List.of("/api/v1"))
    );

    // ── GlobalFilter entry point ──────────────────────────────────────────────

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {

        ServerHttpRequest request = exchange.getRequest();
        String path      = request.getURI().getPath();
        String requestId = UUID.randomUUID().toString();

        // Always pass CORS preflight through ────────────────────────────
        if (HttpMethod.OPTIONS.equals(request.getMethod())) {
            log.debug("[{}] OPTIONS preflight — pass-through (path={})", requestId, path);
            return chain.filter(exchange);
        }

        //  Skip JWT check for open / public paths ────────────────────────
        if (isOpenPath(path)) {
            log.debug("[{}] Open path — pass-through (path={})", requestId, path);
            return chain.filter(exchange);
        }

        // Extract Authorization header ──────────────────────────────────
        String authHeader = request.getHeaders().getFirst(HttpHeaders.AUTHORIZATION);

        if (authHeader == null || authHeader.isBlank()) {
            log.warn("[{}] 401 — missing Authorization header (path={})", requestId, path);
            return errorResponse(exchange, requestId,
                    HttpStatus.UNAUTHORIZED,
                    "missing_token",
                    "Authorization header is required. Please include 'Bearer <token>'.");
        }

        if (!authHeader.startsWith("Bearer ")) {
            log.warn("[{}] 401 — Authorization header is not a Bearer token (path={})", requestId, path);
            return errorResponse(exchange, requestId,
                    HttpStatus.UNAUTHORIZED,
                    "invalid_token",
                    "Authorization header must use the Bearer scheme.");
        }

        String token = authHeader.substring(7).trim();

        // Validate JWT signature & expiry ───────────────────────────────
        TokenValidationResult result = jwtUtil.getValidationResult(token);

        if (result == TokenValidationResult.EXPIRED) {
            log.warn("[{}] 401 — JWT expired (path={})", requestId, path);
            return errorResponse(exchange, requestId,
                    HttpStatus.UNAUTHORIZED,
                    "token_expired",
                    "Your session has expired. Please log in again.");
        }

        if (result == TokenValidationResult.INVALID) {
            log.warn("[{}] 401 — JWT invalid/malformed (path={})", requestId, path);
            return errorResponse(exchange, requestId,
                    HttpStatus.UNAUTHORIZED,
                    "invalid_token",
                    "The provided token is invalid or has been tampered with.");
        }

        // Extract claims ─────────────────────────────────────────────────
        String email  = jwtUtil.extractEmail(token);
        String role   = jwtUtil.extractRole(token);
        String userId = jwtUtil.extractUserId(token);

        log.debug("[{}] JWT valid — userId={}, role={}, path={}", requestId, userId, role, path);

        // Coarse-grained role-based access check ─────────────────────────
        if (!isPathAllowedForRole(role, path)) {
            log.warn("[{}] 403 — role '{}' not permitted for path '{}'", requestId, role, path);
            return errorResponse(exchange, requestId,
                    HttpStatus.FORBIDDEN,
                    "access_denied",
                    "Role '" + role + "' does not have permission to access this resource.");
        }

        // Forward user context to downstream services ────────────────────
        ServerHttpRequest mutatedRequest = request.mutate()
                .header("X-User-Email",      email  != null ? email  : "")
                .header("X-User-Role",       role   != null ? role   : "")
                .header("X-User-Id",         userId != null ? userId : "")
                .header("X-Request-Id",      requestId)
                // Strip original Authorization to avoid double-processing downstream
                // (Comment this out if downstream services still need raw JWT)
                // .headers(h -> h.remove(HttpHeaders.AUTHORIZATION))
                .build();

        log.debug("[{}] Forwarding to downstream — userId={}, role={}", requestId, userId, role);
        return chain.filter(exchange.mutate().request(mutatedRequest).build());
    }

    // ── Helpers ───────────────────────────────────────────────────────────────


    private boolean isOpenPath(String path) {
        return OPEN_PATH_PREFIXES.stream().anyMatch(path::startsWith);
    }

    private boolean isPathAllowedForRole(String role, String path) {
        // Any authenticated user (regardless of role) may access these paths
        if (ANY_AUTHENTICATED_PATHS.stream().anyMatch(path::startsWith)) return true;

        if (role == null || role.isBlank()) return false;
        List<String> allowed = ROLE_PERMISSIONS.get(role);
        if (allowed == null) return false;
        return allowed.stream().anyMatch(path::startsWith);
    }

    // ── Structured JSON error response ────────────────────────────────────────

    private Mono<Void> errorResponse(ServerWebExchange exchange,
                                     String requestId,
                                     HttpStatus status,
                                     String errorCode,
                                     String message) {

        ServerHttpResponse response = exchange.getResponse();
        response.setStatusCode(status);

        HttpHeaders headers = response.getHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("X-Request-Id", requestId);

        if (status == HttpStatus.UNAUTHORIZED) {
            headers.set(HttpHeaders.WWW_AUTHENTICATE,
                    "Bearer realm=\"EcoTrack\", error=\"" + errorCode + "\", " +
                    "error_description=\"" + message.replace("\"", "'") + "\"");
        }

        String body = buildJsonError(status.value(), errorCode, message, requestId);
        byte[] bytes = body.getBytes(StandardCharsets.UTF_8);
        DataBuffer buffer = response.bufferFactory().wrap(bytes);

        return response.writeWith(Mono.just(buffer));
    }

    private String buildJsonError(int status, String error, String message, String requestId) {
        return "{"
                + "\"status\":"    + status                              + ","
                + "\"error\":\""   + escapeJson(error)                   + "\","
                + "\"message\":\"" + escapeJson(message)                 + "\","
                + "\"requestId\":\"" + requestId                         + "\","
                + "\"timestamp\":\"" + Instant.now()                     + "\""
                + "}";
    }

    private String escapeJson(String value) {
        if (value == null) return "";
        return value.replace("\\", "\\\\").replace("\"", "\\\"");
    }


    @Override
    public int getOrder() {

        return -100;
    }
}
