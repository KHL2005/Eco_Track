package com.ecotrack.gateway.security;

import org.springframework.context.annotation.Configuration;

/**
 * API Gateway — Full Resilience Architecture
 *
 * ┌──────────────────────────────────────────────────────────────────────────┐
 * │  LAYER 0 — WebFlux / WebFilter  (runs before gateway routing)           │
 * │                                                                          │
 * │   CorsWebFilter  (Ordered.HIGHEST_PRECEDENCE = Integer.MIN_VALUE)       │
 * │   Handles CORS preflight (OPTIONS) and injects CORS response headers.   │
 * │   All requests pass through, regardless of auth state.                  │
 * │                                                                          │
 * ├──────────────────────────────────────────────────────────────────────────┤
 * │  LAYER 1 — GlobalFilter  (runs for every matched gateway route)         │
 * │                                                                          │
 * │   JwtAuthenticationFilter  (order = -100)                               │
 * │   ┌─────────────────────────────────────────────────────────────────┐   │
 * │   │  OPTIONS?        → pass-through (CORS handled above)           │   │
 * │   │  Open path?      → pass-through (auth, swagger, internal)      │   │
 * │   │  No token?       → 401  error="missing_token"                  │   │
 * │   │  Non-Bearer?     → 401  error="invalid_token"                  │   │
 * │   │  Token expired?  → 401  error="token_expired"                  │   │
 * │   │  Bad signature?  → 401  error="invalid_token"                  │   │
 * │   │  Role denied?    → 403  error="access_denied"                  │   │
 * │   │  Valid + allowed → inject X-User-Id, X-User-Role, X-User-Email │   │
 * │   │                    inject X-Request-Id for tracing              │   │
 * │   │                    forward to route-level filters ↓            │   │
 * │   └─────────────────────────────────────────────────────────────────┘   │
 * │                                                                          │
 * ├──────────────────────────────────────────────────────────────────────────┤
 * │  LAYER 2 — Route GatewayFilters  (defined in GatewayConfig.java)        │
 * │                                                                          │
 * │  Applied in this order for EVERY route:                                  │
 * │                                                                          │
 * │   ① RequestRateLimiter  (Redis token-bucket, per user/IP)               │
 * │      quota ok?      → continue                                           │
 * │      quota exceeded? → 429 Too Many Requests  ◄ stops here              │
 * │                                                                          │
 * │   ② CircuitBreaker  (Resilience4j, per-service instance)                │
 * │      CLOSED / HALF_OPEN? → continue                                      │
 * │      OPEN?               → forward:/fallback/<svc> → 503  ◄ stops here  │
 * │      statusCodes: 500, 502, 503, 504 counted as failures                 │
 * │                                                                          │
 * │   ③ Retry  (GET only, exponential back-off 50 ms→500 ms, 2 retries)     │
 * │      success?          → return 2xx                                       │
 * │      still failing?    → CB records failure → may trip circuit           │
 * │                                                                          │
 * │   ↓ Downstream microservice                                              │
 * │                                                                          │
 * ├──────────────────────────────────────────────────────────────────────────┤
 * │  LAYER 3 — GatewayFallbackController  (handles forward:/fallback/*)     │
 * │                                                                          │
 * │   Called by the CB filter via DispatcherHandler.handle() — this is an   │
 * │   internal server-side dispatch that bypasses GlobalFilters (JWT, etc.) │
 * │   Returns 503 JSON: { status, error, message, service, cause, timestamp}│
 * │                                                                          │
 * ├──────────────────────────────────────────────────────────────────────────┤
 * │  LAYER 4 — Downstream microservices                                      │
 * │                                                                          │
 * │   Trust headers forwarded by the gateway:                                │
 * │     X-User-Id    — authenticated user's ID                               │
 * │     X-User-Role  — authenticated user's role                             │
 * │     X-User-Email — authenticated user's email                            │
 * │     X-Request-Id — UUID for distributed tracing                          │
 * │   Services do NOT re-validate JWT.                                        │
 * └──────────────────────────────────────────────────────────────────────────┘
 *
 * Rate-limiter config   → application.yml  spring.data.redis
 * Circuit-breaker config → application.yml  resilience4j.circuitbreaker / timelimiter
 * Route definitions      → GatewayConfig.java
 * JWT util               → JwtUtil.java
 * Fallback responses     → GatewayFallbackController.java
 */
@Configuration
public class SecurityConfig {
    // All security and resilience logic lives in the classes documented above.
}
