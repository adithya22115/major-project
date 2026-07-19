package com.medicycle.service;

import com.medicycle.dto.request.LoginRequest;
import com.medicycle.dto.request.RegisterRequest;
import com.medicycle.dto.response.AuthResponse;
import com.medicycle.entity.Role;
import com.medicycle.entity.User;
import com.medicycle.entity.VerificationToken;
import com.medicycle.enums.RoleType;
import com.medicycle.exception.ResourceNotFoundException;
import com.medicycle.repository.RoleRepository;
import com.medicycle.repository.UserRepository;
import com.medicycle.repository.VerificationTokenRepository;
import com.medicycle.security.JwtService;
import com.medicycle.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;
import java.util.UUID;

import com.medicycle.dto.request.GuestRegisterRequest;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final VerificationTokenRepository verificationTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final AuditService auditService;
    private final PincodeLookupService pincodeLookupService;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email already registered");
        }

        if (request.getRole() == RoleType.ADMIN) {
            throw new IllegalArgumentException("Cannot register as ADMIN");
        }

        Role role = roleRepository.findByRoleName(request.getRole())
                .orElseThrow(() -> new ResourceNotFoundException("Role not found: " + request.getRole()));

        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .phone(request.getPhone())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(role)
                .address(request.getAddress())
                .city(request.getCity())
                .state(request.getState())
                .pincode(request.getPincode())
                .isVerified(false)
                .build();

        user = userRepository.save(user);
        auditService.log(user, "USER_REGISTERED", "User", user.getId());

        VerificationToken verificationToken = VerificationToken.builder()
                .token(UUID.randomUUID().toString())
                .user(user)
                .build();
        verificationTokenRepository.save(verificationToken);

        log.info("=== EMAIL VERIFICATION ===");
        log.info("User: {} ({})", user.getName(), user.getEmail());
        log.info("Verification URL: http://localhost:8085/api/auth/verify?token={}", verificationToken.getToken());
        log.info("========================");

        UserPrincipal principal = new UserPrincipal(user);
        String token = jwtService.generateToken(principal);

        return AuthResponse.builder()
                .token(token)
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
                .build();
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        UserPrincipal principal = new UserPrincipal(user);
        long tokenExpiration = request.isRememberMe() ? 30L * 24 * 60 * 60 * 1000 : jwtService.getDefaultExpiration();
        String token = jwtService.generateToken(principal, tokenExpiration);

        auditService.log(user, "USER_LOGIN", "User", user.getId());

        return AuthResponse.builder()
                .token(token)
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
                .build();
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

        verificationToken.setUsedAt(java.time.LocalDateTime.now());
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

        log.info("=== RESEND EMAIL VERIFICATION ===");
        log.info("User: {} ({})", user.getName(), user.getEmail());
        log.info("Verification URL: http://localhost:8085/api/auth/verify?token={}", verificationToken.getToken());
        log.info("===============================");
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
                .isVerified(false)
                .build();

        user = userRepository.save(user);
        auditService.log(user, "GUEST_REGISTERED", "User", user.getId());

        UserPrincipal principal = new UserPrincipal(user);
        String token = jwtService.generateToken(principal);

        return AuthResponse.builder()
                .token(token)
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
                .build();
    }
}
