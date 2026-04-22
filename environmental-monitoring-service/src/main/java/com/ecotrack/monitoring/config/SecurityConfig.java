package com.ecotrack.monitoring.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.util.AntPathMatcher;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private static final List<String> PUBLIC_PATHS = List.of(
            "/v3/api-docs/**",
            "/swagger-ui/**",
            "/swagger-ui.html",
            "/actuator/**"
    );

    private final AntPathMatcher pathMatcher = new AntPathMatcher();

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http,
                                           @Qualifier("gatewayRoleFilter") OncePerRequestFilter gatewayRoleFilter) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .formLogin(AbstractHttpConfigurer::disable)
                .httpBasic(AbstractHttpConfigurer::disable)
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint(new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED))
                )
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(PUBLIC_PATHS.toArray(new String[0])).permitAll()
                        .anyRequest().authenticated()
                )
                .addFilterBefore(gatewayRoleFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }

    @Bean("gatewayRoleFilter")
    public OncePerRequestFilter gatewayRoleFilter() {
        return new OncePerRequestFilter() {
            @Override
            protected void doFilterInternal(
                    HttpServletRequest request,
                    HttpServletResponse response,
                    FilterChain chain) throws ServletException, IOException {

                String path = request.getServletPath();

                // ── Allow public paths without any auth check ────────────────
                boolean isPublic = PUBLIC_PATHS.stream()
                        .anyMatch(pattern -> pathMatcher.match(pattern, path));
                if (isPublic) {
                    chain.doFilter(request, response);
                    return;
                }

                String role  = request.getHeader("X-User-Role");
                String email = request.getHeader("X-User-Email");

                // ── Block immediately if no role header present ───────────────
                if (role == null || role.isBlank()) {
                    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                    response.setContentType("application/json");
                    response.getWriter().write(
                            "{\"error\":\"Unauthorized\"," +
                                    "\"message\":\"Missing authentication. Please provide a valid Bearer token.\"," +
                                    "\"status\":401}"
                    );
                    return;
                }

                // ── Build SecurityContext from gateway-forwarded headers ──────
                if (SecurityContextHolder.getContext().getAuthentication() == null) {
                    UsernamePasswordAuthenticationToken auth =
                            new UsernamePasswordAuthenticationToken(
                                    email != null ? email : "unknown",
                                    null,
                                    List.of(new SimpleGrantedAuthority(role))
                            );
                    SecurityContextHolder.getContext().setAuthentication(auth);
                }

                chain.doFilter(request, response);
            }
        };
    }

    /**
     * CRITICAL: Disable Spring Boot's auto-registration of gatewayRoleFilter
     * as a raw servlet filter outside the Spring Security chain.
     */
    @Bean
    public FilterRegistrationBean<OncePerRequestFilter> disableGatewayFilterAutoRegistration(
            @Qualifier("gatewayRoleFilter") OncePerRequestFilter gatewayRoleFilter) {
        FilterRegistrationBean<OncePerRequestFilter> registration =
                new FilterRegistrationBean<>(gatewayRoleFilter);
        registration.setEnabled(false);
        return registration;
    }
}
