package com.ecotrack.gateway.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;

/**
 * Stateless JWT utility used exclusively by the API Gateway.
 * Validates tokens and extracts claims (userId, role, email).
 * No Spring Security dependency — pure JJWT parsing.
 *
 * {@link TokenValidationResult} distinguishes three failure modes so the
 * filter can return precise WWW-Authenticate error messages.
 */
@Component
public class JwtUtil {

    @Value("${jwt.secret}")
    private String secret;

    // ── Typed validation result ───────────────────────────────────────────────

    public enum TokenValidationResult {
        /** Token is well-formed, correctly signed, and not expired. */
        VALID,
        /** Token was well-formed and signed but the expiry time has passed. */
        EXPIRED,
        /** Token is missing, structurally malformed, or has a bad signature. */
        INVALID
    }

    /**
     * Returns a typed result rather than a plain boolean so the filter can
     * emit precise error messages and WWW-Authenticate error codes.
     */
    public TokenValidationResult getValidationResult(String token) {
        if (token == null || token.isBlank()) {
            return TokenValidationResult.INVALID;
        }
        try {
            extractAllClaims(token);
            return TokenValidationResult.VALID;
        } catch (ExpiredJwtException e) {
            return TokenValidationResult.EXPIRED;
        } catch (JwtException | IllegalArgumentException e) {
            return TokenValidationResult.INVALID;
        }
    }

    /**
     * Convenience wrapper kept for backward compatibility.
     * Returns true only when the token is VALID (not expired, not malformed).
     */
    public boolean isTokenValid(String token) {
        return getValidationResult(token) == TokenValidationResult.VALID;
    }

    /** Extract the subject (email / username) from the token. */
    public String extractEmail(String token) {
        return extractAllClaims(token).getSubject();
    }

    /** Extract the role claim (e.g. "CITIZEN", "ADMINISTRATOR"). */
    public String extractRole(String token) {
        return extractAllClaims(token).get("role", String.class);
    }

    /** Extract the userId claim. */
    public String extractUserId(String token) {
        Object userId = extractAllClaims(token).get("userId");
        return userId != null ? userId.toString() : "";
    }

    // ── internals ────────────────────────────────────────────────────────────

    private Claims extractAllClaims(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(hexStringToByteArray(secret));
    }

    private byte[] hexStringToByteArray(String hex) {
        int len = hex.length();
        byte[] data = new byte[len / 2];
        for (int i = 0; i < len; i += 2) {
            data[i / 2] = (byte) ((Character.digit(hex.charAt(i), 16) << 4)
                    + Character.digit(hex.charAt(i + 1), 16));
        }
        return data;
    }
}
