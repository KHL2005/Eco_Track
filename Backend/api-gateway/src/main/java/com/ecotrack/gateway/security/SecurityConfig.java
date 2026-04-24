package com.ecotrack.gateway.security;

import org.springframework.context.annotation.Configuration;

/**
 * API Gateway Security Architecture (Spring Cloud Gateway / WebFlux).
 *
 * ┌─────────────────────────────────────────────────────────────────────┐
 * │  Security is implemented via the JwtAuthenticationFilter GlobalFilter│
 * │  (order = -1), which intercepts every request BEFORE routing.       │
 * │                                                                     │
 * │  Flow:                                                              │
 * │  Client Request                                                     │
 * │       │                                                             │
 * │       ▼                                                             │
 * │  JwtAuthenticationFilter (GlobalFilter, order=-1)                  │
 * │       │── Open path?  → forward as-is                              │
 * │       │── No token?   → 401 Unauthorized                           │
 * │       │── Bad token?  → 401 Unauthorized                           │
 * │       │── Bad role?   → 403 Forbidden                              │
 * │       └── Valid       → inject X-User-Id, X-User-Role, X-User-Email│
 * │                          then route to downstream service           │
 * │                                                                     │
 * │  Downstream microservices read the forwarded headers and build     │
 * │  their SecurityContext — they do NOT parse JWT themselves.         │
 * └─────────────────────────────────────────────────────────────────────┘
 *
 * Spring Security is intentionally NOT added to the gateway module.
 * Spring Cloud Gateway (WebFlux) security is fully managed by the
 * GlobalFilter chain — no HttpSecurity / ServerHttpSecurity needed.
 */
@Configuration
public class SecurityConfig {
    // No bean definitions required.
    // All security logic lives in JwtAuthenticationFilter (GlobalFilter).
}
