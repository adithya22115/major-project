package com.medicycle.security;

import com.medicycle.repository.JwtBlacklistRepository;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;

@Service
public class JwtService {

    private final String secret;
    private final long expiration;
    private final long refreshExpiration;
    private final JwtBlacklistRepository jwtBlacklistRepository;

    public JwtService(
            @Value("${jwt.secret}") String secret,
            @Value("${jwt.expiration}") long expiration,
            @Value("${jwt.refresh-expiration:2592000000}") long refreshExpiration,
            JwtBlacklistRepository jwtBlacklistRepository) {
        this.secret = secret;
        this.expiration = expiration;
        this.refreshExpiration = refreshExpiration;
        this.jwtBlacklistRepository = jwtBlacklistRepository;
    }

    public long getDefaultExpiration() {
        return expiration;
    }

    public long getRefreshExpiration() {
        return refreshExpiration;
    }

    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    public String extractJti(String token) {
        return extractClaim(token, Claims::getId);
    }

    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    public String generateToken(UserDetails userDetails) {
        return generateToken(new HashMap<>(), userDetails, expiration);
    }

    public String generateToken(UserDetails userDetails, long customExpiration) {
        return generateToken(new HashMap<>(), userDetails, customExpiration);
    }

    public String generateToken(Map<String, Object> extraClaims, UserDetails userDetails) {
        return generateToken(extraClaims, userDetails, expiration);
    }

    public String generateRefreshToken(UserDetails userDetails) {
        return generateToken(new HashMap<>(), userDetails, refreshExpiration);
    }

    public String generateToken(Map<String, Object> extraClaims, UserDetails userDetails, long customExpiration) {
        return Jwts.builder()
                .id(UUID.randomUUID().toString())
                .claims(extraClaims)
                .subject(userDetails.getUsername())
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + customExpiration))
                .signWith(getSigningKey())
                .compact();
    }

    public boolean isTokenValid(String token, UserDetails userDetails) {
        try {
            String jti = extractJti(token);
            if (jwtBlacklistRepository.existsByTokenJti(jti)) {
                return false;
            }
            String username = extractUsername(token);
            return username.equals(userDetails.getUsername()) && !isTokenExpired(token);
        } catch (Exception e) {
            return false;
        }
    }

    public boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    public void invalidateToken(String token) {
        try {
            String jti = extractJti(token);
            Date expiration = extractExpiration(token);
            com.medicycle.entity.JwtBlacklist entry = com.medicycle.entity.JwtBlacklist.builder()
                    .tokenJti(jti)
                    .expiresAt(LocalDateTime.ofInstant(expiration.toInstant(), ZoneId.systemDefault()))
                    .build();
            jwtBlacklistRepository.save(entry);
        } catch (Exception e) {
        }
    }

    private Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    private SecretKey getSigningKey() {
        byte[] keyBytes = secret.getBytes(StandardCharsets.UTF_8);
        return Keys.hmacShaKeyFor(keyBytes);
    }
}
