package com.medicycle.service;

import com.medicycle.repository.JwtBlacklistRepository;
import com.medicycle.repository.RefreshTokenRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * Periodically purges expired/revoked refresh tokens and expired JWT
 * blacklist entries so those tables do not grow without bound.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class TokenCleanupService {

    private final RefreshTokenRepository refreshTokenRepository;
    private final JwtBlacklistRepository jwtBlacklistRepository;

    @Scheduled(cron = "${app.cleanup.token-cron:0 0 3 * * *}")
    @Transactional
    public void cleanExpiredTokens() {
        LocalDateTime now = LocalDateTime.now();
        int refreshTokensDeleted = refreshTokenRepository.deleteExpiredOrRevoked(now);
        int blacklistEntriesDeleted = jwtBlacklistRepository.deleteAllExpired(now);
        log.info("Token cleanup finished: removed {} expired/revoked refresh tokens and {} expired blacklisted JWTs",
                refreshTokensDeleted, blacklistEntriesDeleted);
    }
}