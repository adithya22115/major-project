package com.medicycle.security;

import com.medicycle.entity.Role;
import com.medicycle.entity.User;
import com.medicycle.enums.RoleType;
import com.medicycle.repository.JwtBlacklistRepository;
import io.jsonwebtoken.Jwts;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class JwtServiceTest {

    private JwtBlacklistRepository jwtBlacklistRepository;
    private JwtService jwtService;
    private UserPrincipal userPrincipal;

    private static final String SECRET = "TestSecretKeyForJWTTokenGenerationMustBeLongEnough2024Testing";
    private static final long EXPIRATION = 86400000L; // 24 hours

    @BeforeEach
    void setUp() {
        jwtBlacklistRepository = mock(JwtBlacklistRepository.class);
        jwtService = new JwtService(SECRET, EXPIRATION, 2592000000L, jwtBlacklistRepository);

        Role donorRole = Role.builder().id(1L).roleName(RoleType.DONOR).build();
        User user = User.builder()
                .id(1L).name("Test User").email("test@example.com")
                .password("encoded").role(donorRole)
                .build();
        userPrincipal = new UserPrincipal(user);
    }

    @Test
    void generateToken_shouldReturnValidToken() {
        String token = jwtService.generateToken(userPrincipal);

        assertNotNull(token);
        assertFalse(token.isEmpty());
    }

    @Test
    void extractUsername_shouldReturnEmail() {
        String token = jwtService.generateToken(userPrincipal);

        String username = jwtService.extractUsername(token);

        assertEquals("test@example.com", username);
    }

    @Test
    void isTokenValid_shouldReturnTrue_forValidToken() {
        String token = jwtService.generateToken(userPrincipal);

        boolean valid = jwtService.isTokenValid(token, userPrincipal);

        assertTrue(valid);
    }

    @Test
    void isTokenValid_shouldReturnFalse_forDifferentUser() {
        String token = jwtService.generateToken(userPrincipal);

        Role otherRole = Role.builder().id(2L).roleName(RoleType.RECIPIENT).build();
        User otherUser = User.builder()
                .id(2L).name("Other").email("other@example.com")
                .password("encoded").role(otherRole).build();
        UserPrincipal otherPrincipal = new UserPrincipal(otherUser);

        boolean valid = jwtService.isTokenValid(token, otherPrincipal);

        assertFalse(valid);
    }

    @Test
    void isTokenValid_shouldReturnFalse_forExpiredToken() {
        // Generate a token with 0ms expiration (instantly expired)
        String token = jwtService.generateToken(userPrincipal, -1L);

        boolean valid = jwtService.isTokenValid(token, userPrincipal);
        assertFalse(valid);
    }

    @Test
    void generateToken_withCustomExpiration_shouldWork() {
        String token = jwtService.generateToken(userPrincipal, 3600000L); // 1 hour

        assertNotNull(token);
        String username = jwtService.extractUsername(token);
        assertEquals("test@example.com", username);
    }

    @Test
    void getDefaultExpiration_shouldReturnConfiguredValue() {
        long defaultExpiration = jwtService.getDefaultExpiration();

        assertEquals(EXPIRATION, defaultExpiration);
    }

    @Test
    void extractClaim_shouldExtractSubject() {
        String token = jwtService.generateToken(userPrincipal);

        String subject = jwtService.extractClaim(token, claims -> claims.getSubject());

        assertEquals("test@example.com", subject);
    }

    @Test
    void extractClaim_shouldExtractIssuedAt() {
        String token = jwtService.generateToken(userPrincipal);

        Date issuedAt = jwtService.extractClaim(token, claims -> claims.getIssuedAt());

        assertNotNull(issuedAt);
        // Issued at should be recent (within last 5 seconds)
        assertTrue(System.currentTimeMillis() - issuedAt.getTime() < 5000);
    }

    @Test
    void generateToken_withExtraClaims_shouldIncludeClaims() {
        java.util.Map<String, Object> claims = new java.util.HashMap<>();
        claims.put("role", "DONOR");
        claims.put("userId", 1L);

        String token = jwtService.generateToken(claims, userPrincipal);

        assertNotNull(token);
        String username = jwtService.extractUsername(token);
        assertEquals("test@example.com", username);
    }
}
