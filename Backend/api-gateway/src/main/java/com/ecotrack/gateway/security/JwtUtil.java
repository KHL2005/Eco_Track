package com.ecotrack.gateway.security;

import io.jsonwebtoken.Claims;
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
 */
@Component
public class JwtUtil {

    @Value("${jwt.secret}")
    private String secret;

    /**
     * Validate the token signature and expiry.
     * Returns true if the token is well-formed, signed correctly, and not expired.
     */
    public boolean isTokenValid(String token) {
        try {
            extractAllClaims(token); // throws if invalid / expired
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    /** Extract the subject (email / username) from the token. */
    public String extractEmail(String token) {
        return extractAllClaims(token).getSubject();
    }

    /** Extract the role claim (e.g. "CITIZEN", "ADMIN"). */
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

