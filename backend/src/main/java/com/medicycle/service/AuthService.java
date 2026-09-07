package com.medicycle.service;

import com.medicycle.dto.request.GuestRegisterRequest;
import com.medicycle.dto.request.LoginRequest;
import com.medicycle.dto.request.RegisterRequest;
import com.medicycle.dto.response.AuthResponse;
import com.medicycle.entity.RefreshToken;
import com.medicycle.entity.Role;
import com.medicycle.entity.User;
import com.medicycle.entity.VerificationToken;
import com.medicycle.enums.RoleType;
import com.medicycle.exception.ResourceNotFoundException;
import com.medicycle.entity.PasswordResetToken;
import com.medicycle.repository.PasswordHistoryRepository;
import com.medicycle.repository.PasswordResetTokenRepository;
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
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.LockedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final VerificationTokenRepository verificationTokenRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordHistoryRepository passwordHistoryRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final AuditService auditService;
    private final PincodeLookupService pincodeLookupService;
    private final EmailService emailService;
    private final TwoFactorService twoFactorService;
    private final PasswordValidator passwordValidator;
    private final RateLimiterService rateLimiterService;
    private final LoginAttemptService loginAttemptService;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email already registered");
        }

        if (request.getRole() == RoleType.ADMIN) {
            throw new IllegalArgumentException("Cannot register as ADMIN");
        }

        List<String> passwordErrors = passwordValidator.validate(request.getPassword());
        if (!passwordErrors.isEmpty()) {
            throw new IllegalArgumentException(String.join("; ", passwordErrors));
        }

        Role role = roleRepository.findByRoleName(request.getRole())
                .orElseThrow(() -> new ResourceNotFoundException("Role not found: " + request.getRole()));

        String encodedPassword = passwordEncoder.encode(request.getPassword());

        // Auto-verify donors and recipients; pharmacies require admin document verification
        boolean autoVerify = (request.getRole() == RoleType.DONOR || request.getRole() == RoleType.RECIPIENT);

        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .phone(request.getPhone())
                .password(encodedPassword)
                .role(role)
                .address(request.getAddress())
                .city(request.getCity())
                .state(request.getState())
                .pincode(request.getPincode())
                .isVerified(autoVerify)
                .failedLoginAttempts(0)
                .build();

        user = userRepository.save(user);
        auditService.log(user, "USER_REGISTERED", "User", user.getId());

        savePasswordHistory(user, encodedPassword);

        VerificationToken verificationToken = VerificationToken.builder()
                .token(UUID.randomUUID().toString())
                .user(user)
                .build();
        verificationTokenRepository.save(verificationToken);

        emailService.sendVerificationEmail(user.getEmail(), user.getName(), verificationToken.getToken());

        UserPrincipal principal = new UserPrincipal(user);
        String accessToken = jwtService.generateToken(principal);
        String refreshToken = jwtService.generateRefreshToken(principal);

        saveRefreshToken(user, refreshToken);

        return AuthResponse.builder()
                .token(accessToken)
                .refreshToken(refreshToken)
                .userId(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole().getRoleName())
                .city(user.getCity())
                .state(user.getState())
                .pincode(user.getPincode())
                .latitude(user.getLatitude())
                .longitude(user.getLongitude())
                .verified(user.isVerified())
                .twoFactorRequired(false)
                .build();
    }

    @Transactional
    public AuthResponse login(LoginRequest request, HttpServletRequest httpRequest) {
        String clientIp = getClientIp(httpRequest);

        ConsumptionProbe probe = rateLimiterService.tryConsumeLogin(clientIp);
        if (!probe.isConsumed()) {
            long waitSeconds = probe.getNanosToWaitForRefill() / 1_000_000_000;
            throw new IllegalStateException("Too many login attempts. Please try again in " + waitSeconds + " seconds.");
        }

        User user = userRepository.findByEmail(request.getEmail()).orElse(null);

        if (user != null && user.getLockedUntil() != null) {
            if (LocalDateTime.now().isBefore(user.getLockedUntil())) {
                long minutesRemaining = java.time.Duration.between(LocalDateTime.now(), user.getLockedUntil()).toMinutes();
                throw new LockedException("Account is locked. Try again in " + minutesRemaining + " minutes.");
            } else {
                user.setLockedUntil(null);
                user.setFailedLoginAttempts(0);
                userRepository.save(user);
            }
        }

        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));
        } catch (Exception e) {
            if (user != null) {
                loginAttemptService.handleFailedLogin(user);
            }
            throw new IllegalArgumentException("Invalid email or password");
        }

        if (user == null) {
            user = userRepository.findByEmail(request.getEmail())
                    .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        }

        user.setFailedLoginAttempts(0);
        userRepository.save(user);
        rateLimiterService.resetLoginBucket(clientIp);

        boolean twoFactorRequired = twoFactorService.isTotpEnabled(user);

        if (twoFactorRequired) {
            String twoFactorToken = UUID.randomUUID().toString();
            auditService.log(user, "2FA_REQUIRED", "User", user.getId());
            return AuthResponse.builder()
                    .userId(user.getId())
                    .name(user.getName())
                    .email(user.getEmail())
                    .role(user.getRole().getRoleName())
                    .city(user.getCity())
                    .state(user.getState())
                    .pincode(user.getPincode())
                    .verified(user.isVerified())
                    .twoFactorRequired(true)
                    .build();
        }

        UserPrincipal principal = new UserPrincipal(user);
        long tokenExpiration = request.isRememberMe() ? 30L * 24 * 60 * 60 * 1000 : jwtService.getDefaultExpiration();
        String accessToken = jwtService.generateToken(principal, tokenExpiration);
        String refreshToken = jwtService.generateRefreshToken(principal);

        refreshTokenRepository.revokeAllByUser(user, LocalDateTime.now());
        saveRefreshToken(user, refreshToken);

        auditService.log(user, "USER_LOGIN", "User", user.getId());

        return AuthResponse.builder()
                .token(accessToken)
                .refreshToken(refreshToken)
                .userId(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole().getRoleName())
                .city(user.getCity())
                .state(user.getState())
                .pincode(user.getPincode())
                .latitude(user.getLatitude())
                .longitude(user.getLongitude())
                .verified(user.isVerified())
                .twoFactorRequired(false)
                .build();
    }

    @Transactional
    public AuthResponse verifyTwoFactor(String email, String code) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (!twoFactorService.isTotpEnabled(user)) {
            throw new IllegalArgumentException("2FA is not enabled for this account");
        }

        if (!twoFactorService.verifyCode(user.getTwoFactorSecret(), code)) {
            auditService.log(user, "2FA_FAILED", "User", user.getId());
            throw new IllegalArgumentException("Invalid 2FA code");
        }

        UserPrincipal principal = new UserPrincipal(user);
        String accessToken = jwtService.generateToken(principal);
        String refreshToken = jwtService.generateRefreshToken(principal);

        refreshTokenRepository.revokeAllByUser(user, LocalDateTime.now());
        saveRefreshToken(user, refreshToken);

        auditService.log(user, "2FA_VERIFIED", "User", user.getId());

        return AuthResponse.builder()
                .token(accessToken)
                .refreshToken(refreshToken)
                .userId(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole().getRoleName())
                .city(user.getCity())
                .state(user.getState())
                .pincode(user.getPincode())
                .latitude(user.getLatitude())
                .longitude(user.getLongitude())
                .verified(user.isVerified())
                .twoFactorRequired(false)
                .build();
    }

    @Transactional
    public AuthResponse refreshAccessToken(String refreshTokenValue) {
        RefreshToken storedToken = refreshTokenRepository.findByToken(refreshTokenValue)
                .orElseThrow(() -> new IllegalArgumentException("Invalid refresh token"));

        if (!storedToken.isValid()) {
            throw new IllegalArgumentException("Refresh token has been revoked or expired");
        }

        User user = storedToken.getUser();
        UserPrincipal principal = new UserPrincipal(user);

        String username = jwtService.extractUsername(refreshTokenValue);
        if (!username.equals(user.getEmail())) {
            throw new IllegalArgumentException("Refresh token does not match user");
        }

        storedToken.setRevoked(true);
        storedToken.setRevokedAt(LocalDateTime.now());
        refreshTokenRepository.save(storedToken);

        String newAccessToken = jwtService.generateToken(principal);
        String newRefreshToken = jwtService.generateRefreshToken(principal);
        saveRefreshToken(user, newRefreshToken);

        auditService.log(user, "TOKEN_REFRESHED", "User", user.getId());

        return AuthResponse.builder()
                .token(newAccessToken)
                .refreshToken(newRefreshToken)
                .userId(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole().getRoleName())
                .city(user.getCity())
                .state(user.getState())
                .pincode(user.getPincode())
                .verified(user.isVerified())
                .twoFactorRequired(false)
                .build();
    }

    @Transactional
    public void logout(String authHeader) {
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            try {
                String username = jwtService.extractUsername(token);
                jwtService.invalidateToken(token);

                userRepository.findByEmail(username).ifPresent(user -> {
                    refreshTokenRepository.revokeAllByUser(user, LocalDateTime.now());
                    auditService.log(user, "USER_LOGOUT", "User", user.getId());
                });
            } catch (Exception e) {
                log.warn("Invalid token during logout: {}", e.getMessage());
            }
        }
    }

    @Transactional
    public void verifyEmail(String tokenValue) {
        VerificationToken verificationToken = verificationTokenRepository.findByToken(tokenValue)
                .orElseThrow(() -> new IllegalArgumentException("Invalid verification token"));

        if (!verificationToken.isValid()) {
            throw new IllegalArgumentException("Verification token has expired or already been used");
        }

        User user = verificationToken.getUser();
        user.setVerified(true);
        userRepository.save(user);

        verificationToken.setUsedAt(LocalDateTime.now());
        verificationTokenRepository.save(verificationToken);

        auditService.log(user, "EMAIL_VERIFIED", "User", user.getId());
        log.info("Email verified for user: {} ({})", user.getName(), user.getEmail());
    }

    @Transactional
    public void resendVerification(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));

        if (user.isVerified()) {
            throw new IllegalArgumentException("Email is already verified");
        }

        VerificationToken verificationToken = VerificationToken.builder()
                .token(UUID.randomUUID().toString())
                .user(user)
                .build();
        verificationTokenRepository.save(verificationToken);

        emailService.sendVerificationEmail(user.getEmail(), user.getName(), verificationToken.getToken());
    }

    @Transactional
    public void forgotPassword(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("No account found with email: " + email));

        // Invalidate any existing reset tokens for this user
        passwordResetTokenRepository.deleteByUser(user);

        PasswordResetToken resetToken = PasswordResetToken.builder()
                .token(UUID.randomUUID().toString())
                .user(user)
                .build();
        passwordResetTokenRepository.save(resetToken);

        emailService.sendPasswordResetEmail(user.getEmail(), user.getName(), resetToken.getToken());
        auditService.log(user, "PASSWORD_RESET_REQUESTED", "User", user.getId());
    }

    @Transactional
    public void resetPassword(String tokenValue, String newPassword) {
        PasswordResetToken resetToken = passwordResetTokenRepository.findByToken(tokenValue)
                .orElseThrow(() -> new IllegalArgumentException("Invalid or expired reset token"));

        if (!resetToken.isValid()) {
            throw new IllegalArgumentException("Reset token has expired or already been used");
        }

        List<String> passwordErrors = passwordValidator.validate(newPassword);
        if (!passwordErrors.isEmpty()) {
            throw new IllegalArgumentException(String.join("; ", passwordErrors));
        }

        User user = resetToken.getUser();
        String encodedPassword = passwordEncoder.encode(newPassword);
        user.setPassword(encodedPassword);
        user.setFailedLoginAttempts(0);
        user.setLockedUntil(null);
        userRepository.save(user);

        savePasswordHistory(user, encodedPassword);

        resetToken.setUsedAt(LocalDateTime.now());
        passwordResetTokenRepository.save(resetToken);

        refreshTokenRepository.revokeAllByUser(user, LocalDateTime.now());

        auditService.log(user, "PASSWORD_RESET_COMPLETED", "User", user.getId());
        log.info("Password reset completed for user: {} ({})", user.getName(), user.getEmail());
    }

    @Transactional
    public AuthResponse guestRegister(GuestRegisterRequest request) {
        if (request.getRole() != RoleType.DONOR && request.getRole() != RoleType.RECIPIENT) {
            throw new IllegalArgumentException("Guest registration only available for DONOR or RECIPIENT");
        }

        String guestEmail = request.getRole().name().toLowerCase() + "-" + UUID.randomUUID().toString().substring(0, 8) + "@guest.medicycle";
        String randomPassword = UUID.randomUUID().toString();

        Role role = roleRepository.findByRoleName(request.getRole())
                .orElseThrow(() -> new ResourceNotFoundException("Role not found: " + request.getRole()));

        String city = request.getCity();
        String state = request.getState();

        if (request.getPincode() != null && !request.getPincode().isBlank()) {
            try {
                Map<String, Object> location = pincodeLookupService.lookup(request.getPincode());
                if (location.get("city") != null) city = (String) location.get("city");
                if (location.get("state") != null) state = (String) location.get("state");
            } catch (Exception e) {
                log.warn("Pincode lookup failed for: {}", request.getPincode());
            }
        }

        User user = User.builder()
                .name(request.getName())
                .email(guestEmail)
                .phone(request.getPhone())
                .password(passwordEncoder.encode(randomPassword))
                .role(role)
                .city(city)
                .state(state)
                .pincode(request.getPincode())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .isVerified(true)
                .failedLoginAttempts(0)
                .build();

        user = userRepository.save(user);
        auditService.log(user, "GUEST_REGISTERED", "User", user.getId());

        UserPrincipal principal = new UserPrincipal(user);
        String accessToken = jwtService.generateToken(principal);
        String refreshToken = jwtService.generateRefreshToken(principal);
        saveRefreshToken(user, refreshToken);

        return AuthResponse.builder()
                .token(accessToken)
                .refreshToken(refreshToken)
                .userId(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole().getRoleName())
                .city(user.getCity())
                .state(user.getState())
                .pincode(user.getPincode())
                .latitude(user.getLatitude())
                .longitude(user.getLongitude())
                .verified(user.isVerified())
                .twoFactorRequired(false)
                .build();
    }

    private void savePasswordHistory(User user, String encodedPassword) {
        com.medicycle.entity.PasswordHistory history = com.medicycle.entity.PasswordHistory.builder()
                .user(user)
                .passwordHash(encodedPassword)
                .build();
        passwordHistoryRepository.save(history);
    }

    private void saveRefreshToken(User user, String token) {
        RefreshToken refreshToken = RefreshToken.builder()
                .token(token)
                .user(user)
                .expiresAt(LocalDateTime.now().plusSeconds(jwtService.getRefreshExpiration() / 1000))
                .build();
        refreshTokenRepository.save(refreshToken);
    }

    private String getClientIp(HttpServletRequest request) {
        String xfHeader = request.getHeader("X-Forwarded-For");
        if (xfHeader == null || xfHeader.isBlank()) {
            return request.getRemoteAddr();
        }
        return xfHeader.split(",")[0].trim();
    }
}
