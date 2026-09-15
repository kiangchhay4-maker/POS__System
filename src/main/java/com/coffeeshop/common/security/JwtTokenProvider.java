package com.coffeeshop.common.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.UUID;

@Component
public class JwtTokenProvider {

    private static final Logger log = LoggerFactory.getLogger(JwtTokenProvider.class);

    private final SecretKey key;
    private final long accessTokenExpirationMs;
    private final long refreshTokenExpirationMs;

    public JwtTokenProvider(
            @Value("${app.jwt.secret}") String secret,
            @Value("${app.jwt.access-token-expiration-ms:86400000}") long accessTokenExpirationMs,
            @Value("${app.jwt.refresh-token-expiration-ms:604800000}") long refreshTokenExpirationMs
    ) {
        byte[] keyBytes = secret.getBytes(StandardCharsets.UTF_8);
        this.key = Keys.hmacShaKeyFor(keyBytes);
        this.accessTokenExpirationMs = accessTokenExpirationMs;
        this.refreshTokenExpirationMs = refreshTokenExpirationMs;
    }

    public String generateAccessToken(UUID userId, String phone, Role role) {
        return buildToken(userId, phone, role, accessTokenExpirationMs, "ACCESS");
    }

    public String generateRefreshToken(UUID userId, String phone, Role role) {
        return buildToken(userId, phone, role, refreshTokenExpirationMs, "REFRESH");
    }

    private String buildToken(UUID userId, String phone, Role role, long expirationMs, String type) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + expirationMs);

        return Jwts.builder()
                .subject(userId.toString())
                .claim("phone", phone)
                .claim("role", role.name())
                .claim("type", type)
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(key)
                .compact();
    }

    public Claims extractClaims(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public boolean validateToken(String token) {
        if (!org.springframework.util.StringUtils.hasText(token) 
                || "undefined".equalsIgnoreCase(token) 
                || "null".equalsIgnoreCase(token)) {
            return false;
        }
        // Valid compact JWS tokens must contain 2 period separators (header.payload.signature)
        if (!token.contains(".")) {
            log.debug("Token does not follow JWT compact format: {}", token);
            return false;
        }
        try {
            extractClaims(token);
            return true;
        } catch (ExpiredJwtException ex) {
            log.warn("Expired JWT token: {}", ex.getMessage());
        } catch (JwtException | IllegalArgumentException ex) {
            log.warn("Invalid JWT token: {}", ex.getMessage());
        }
        return false;
    }

    public UUID getUserIdFromToken(String token) {
        Claims claims = extractClaims(token);
        return UUID.fromString(claims.getSubject());
    }

    public Role getRoleFromToken(String token) {
        Claims claims = extractClaims(token);
        return Role.valueOf(claims.get("role", String.class));
    }

    public String getPhoneFromToken(String token) {
        Claims claims = extractClaims(token);
        return claims.get("phone", String.class);
    }
}
