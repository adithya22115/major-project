package com.medicycle.service;

import com.medicycle.entity.User;
import com.medicycle.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * Records failed login attempts in a SEPARATE transaction. AuthService.login()
 * is @Transactional and rolls back on a failed authentication, so a plain save
 * inside it would never persist — the lockout feature would silently never fire.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class LoginAttemptService {

    private final UserRepository userRepository;
    private final AuditService auditService;

    @Value("${app.login.max-attempts}")
    private int maxLoginAttempts;

    @Value("${app.login.lockout-duration-minutes}")
    private int lockoutDurationMinutes;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void handleFailedLogin(User user) {
        int attempts = (user.getFailedLoginAttempts() != null ? user.getFailedLoginAttempts() : 0) + 1;
        user.setFailedLoginAttempts(attempts);

        if (attempts >= maxLoginAttempts) {
            user.setLockedUntil(LocalDateTime.now().plusMinutes(lockoutDurationMinutes));
            log.warn("Account locked for user: {} ({}) until {}", user.getName(), user.getEmail(), user.getLockedUntil());
            auditService.log(user, "ACCOUNT_LOCKED", "User", user.getId());
        }

        userRepository.save(user);
    }
}