package com.medicycle.repository;

import com.medicycle.entity.JwtBlacklist;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDateTime;
import java.util.Optional;

public interface JwtBlacklistRepository extends JpaRepository<JwtBlacklist, Long> {
    Optional<JwtBlacklist> findByTokenJti(String tokenJti);

    @Modifying
    @Query("DELETE FROM JwtBlacklist j WHERE j.expiresAt < :now")
    int deleteAllExpired(LocalDateTime now);

    boolean existsByTokenJti(String tokenJti);
}
