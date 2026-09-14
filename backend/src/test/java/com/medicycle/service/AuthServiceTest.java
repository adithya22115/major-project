package com.medicycle.service;

import com.medicycle.dto.request.LoginRequest;
import com.medicycle.dto.request.RegisterRequest;
import com.medicycle.dto.response.AuthResponse;
import com.medicycle.entity.Role;
import com.medicycle.entity.User;
import com.medicycle.entity.VerificationToken;
import com.medicycle.enums.RoleType;
import com.medicycle.exception.ResourceNotFoundException;
import com.medicycle.repository.PasswordHistoryRepository;
import com.medicycle.repository.RefreshTokenRepository;
import com.medicycle.repository.RoleRepository;
import com.medicycle.repository.UserRepository;
import com.medicycle.repository.VerificationTokenRepository;
import com.medicycle.security.JwtService;
import com.medicycle.security.PasswordValidator;
import com.medicycle.security.RateLimiterService;
import com.medicycle.security.TwoFactorService;
import com.medicycle.security.UserPrincipal;
import io.github.bucket4j.ConsumptionProbe;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private RoleRepository roleRepository;
    @Mock
    private VerificationTokenRepository verificationTokenRepository;
    @Mock
    private RefreshTokenRepository refreshTokenRepository;
    @Mock
    private PasswordHistoryRepository passwordHistoryRepository;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private JwtService jwtService;
    @Mock
    private AuthenticationManager authenticationManager;
    @Mock
    private AuditService auditService;
    @Mock
    private EmailService emailService;
    @Mock
    private TwoFactorService twoFactorService;
    @Mock
    private PasswordValidator passwordValidator;
    @Mock
    private RateLimiterService rateLimiterService;
    @Mock
    private HttpServletRequest httpServletRequest;

    @InjectMocks
    private AuthService authService;

    private Role donorRole;
    private User testUser;

    @BeforeEach
    void setUp() {
        donorRole = Role.builder().id(1L).roleName(RoleType.DONOR).build();
        testUser = User.builder()
                .id(1L)
                .name("Test User")
                .email("test@example.com")
                .password("encoded_password")
                .role(donorRole)
                .city("Mumbai")
                .state("Maharashtra")
                .pincode("400001")
                .isVerified(false)
                .build();
    }

    @Test
    void register_shouldSucceed_whenValidRequest() {
        RegisterRequest request = new RegisterRequest();
        request.setName("Test User");
        request.setEmail("test@example.com");
        request.setPhone("9876543210");
        request.setPassword("password123");
        request.setRole(RoleType.DONOR);
        request.setCity("Mumbai");
        request.setState("Maharashtra");
        request.setPincode("400001");

        when(userRepository.existsByEmail("test@example.com")).thenReturn(false);
        when(roleRepository.findByRoleName(RoleType.DONOR)).thenReturn(Optional.of(donorRole));
        when(passwordEncoder.encode("password123")).thenReturn("encoded_password");
        when(passwordValidator.validate(anyString())).thenReturn(Collections.emptyList());
        when(userRepository.save(any(User.class))).thenReturn(testUser);
        when(verificationTokenRepository.save(any(VerificationToken.class)))
                .thenAnswer(inv -> inv.getArgument(0));
        when(jwtService.generateToken(any(UserPrincipal.class))).thenReturn("jwt_token");
        when(jwtService.generateRefreshToken(any(UserPrincipal.class))).thenReturn("refresh_token");
        when(refreshTokenRepository.save(any())).thenReturn(null);

        AuthResponse response = authService.register(request);

        assertNotNull(response);
        assertEquals("jwt_token", response.getToken());
        assertEquals(1L, response.getUserId());
        assertEquals("Test User", response.getName());
        assertEquals("test@example.com", response.getEmail());
        assertEquals(RoleType.DONOR, response.getRole());
        assertFalse(response.isVerified());

        verify(userRepository).save(any(User.class));
        verify(verificationTokenRepository).save(any(VerificationToken.class));
        verify(auditService).log(eq(testUser), eq("USER_REGISTERED"), eq("User"), eq(1L));
    }

    @Test
    void register_shouldThrow_whenEmailAlreadyExists() {
        RegisterRequest request = new RegisterRequest();
        request.setEmail("existing@example.com");
        request.setRole(RoleType.DONOR);

        when(userRepository.existsByEmail("existing@example.com")).thenReturn(true);

        assertThrows(IllegalArgumentException.class, () -> authService.register(request));
        verify(userRepository, never()).save(any());
    }

    @Test
    void register_shouldThrow_whenAdminRole() {
        RegisterRequest request = new RegisterRequest();
        request.setEmail("admin@example.com");
        request.setRole(RoleType.ADMIN);

        when(userRepository.existsByEmail("admin@example.com")).thenReturn(false);

        assertThrows(IllegalArgumentException.class, () -> authService.register(request));
        verify(userRepository, never()).save(any());
    }

    @Test
    void register_shouldThrow_whenRoleNotFound() {
        RegisterRequest request = new RegisterRequest();
        request.setEmail("test@example.com");
        request.setRole(RoleType.DONOR);

        when(userRepository.existsByEmail("test@example.com")).thenReturn(false);
        when(roleRepository.findByRoleName(RoleType.DONOR)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> authService.register(request));
    }

    @Test
    void login_shouldSucceed_whenValidCredentials() {
        LoginRequest request = new LoginRequest();
        request.setEmail("test@example.com");
        request.setPassword("password123");
        request.setRememberMe(false);

        when(httpServletRequest.getRemoteAddr()).thenReturn("127.0.0.1");

        ConsumptionProbe probe = mock(ConsumptionProbe.class);
        when(probe.isConsumed()).thenReturn(true);
        when(rateLimiterService.tryConsumeLogin(anyString())).thenReturn(probe);

        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));
        when(jwtService.getDefaultExpiration()).thenReturn(86400000L);
        when(jwtService.generateToken(any(UserPrincipal.class), anyLong())).thenReturn("jwt_token");
        when(jwtService.generateRefreshToken(any(UserPrincipal.class))).thenReturn("refresh_token");
        when(refreshTokenRepository.save(any())).thenReturn(null);
        when(twoFactorService.isTotpEnabled(any())).thenReturn(false);
        doNothing().when(rateLimiterService).resetLoginBucket(anyString());

        AuthResponse response = authService.login(request, httpServletRequest);

        assertNotNull(response);
        assertEquals("jwt_token", response.getToken());
        assertEquals(1L, response.getUserId());
        verify(authenticationManager).authenticate(any());
        verify(auditService).log(eq(testUser), eq("USER_LOGIN"), eq("User"), eq(1L));
    }

    @Test
    void login_shouldThrow_whenUserNotFound() {
        LoginRequest request = new LoginRequest();
        request.setEmail("nonexistent@example.com");
        request.setPassword("password123");

        ConsumptionProbe probe = mock(ConsumptionProbe.class);
        when(probe.isConsumed()).thenReturn(true);
        when(rateLimiterService.tryConsumeLogin(anyString())).thenReturn(probe);

        when(userRepository.findByEmail("nonexistent@example.com")).thenReturn(Optional.empty());

        assertThrows(Exception.class, () -> authService.login(request, httpServletRequest));
    }

    @Test
    void verifyEmail_shouldSucceed_whenValidToken() {
        VerificationToken token = VerificationToken.builder()
                .id(1L)
                .token("valid-token")
                .user(testUser)
                .expiresAt(LocalDateTime.now().plusHours(24))
                .build();

        when(verificationTokenRepository.findByToken("valid-token")).thenReturn(Optional.of(token));
        when(userRepository.save(any(User.class))).thenReturn(testUser);
        when(verificationTokenRepository.save(any(VerificationToken.class))).thenReturn(token);

        authService.verifyEmail("valid-token");

        assertTrue(testUser.isVerified());
        verify(userRepository).save(testUser);
        verify(auditService).log(eq(testUser), eq("EMAIL_VERIFIED"), eq("User"), eq(1L));
    }

    @Test
    void verifyEmail_shouldThrow_whenInvalidToken() {
        when(verificationTokenRepository.findByToken("invalid-token")).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class, () -> authService.verifyEmail("invalid-token"));
    }

    @Test
    void verifyEmail_shouldThrow_whenTokenExpired() {
        VerificationToken token = VerificationToken.builder()
                .id(1L)
                .token("expired-token")
                .user(testUser)
                .expiresAt(LocalDateTime.now().minusHours(1))
                .build();

        when(verificationTokenRepository.findByToken("expired-token")).thenReturn(Optional.of(token));

        assertThrows(IllegalArgumentException.class, () -> authService.verifyEmail("expired-token"));
    }

    @Test
    void resendVerification_shouldSucceed_whenUserNotVerified() {
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));
        when(verificationTokenRepository.save(any(VerificationToken.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        authService.resendVerification("test@example.com");

        verify(verificationTokenRepository).save(any(VerificationToken.class));
    }

    @Test
    void resendVerification_shouldThrow_whenAlreadyVerified() {
        testUser.setVerified(true);
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));

        assertThrows(IllegalArgumentException.class,
                () -> authService.resendVerification("test@example.com"));
    }

    @Test
    void resendVerification_shouldThrow_whenUserNotFound() {
        when(userRepository.findByEmail("nonexistent@example.com")).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> authService.resendVerification("nonexistent@example.com"));
    }
}
