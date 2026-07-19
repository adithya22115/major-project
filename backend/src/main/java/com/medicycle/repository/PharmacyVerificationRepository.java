package com.medicycle.repository;

import com.medicycle.entity.PharmacyVerification;
import com.medicycle.enums.VerificationStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PharmacyVerificationRepository extends JpaRepository<PharmacyVerification, Long> {
    Optional<PharmacyVerification> findByUserId(Long userId);
    List<PharmacyVerification> findByStatus(VerificationStatus status);
    boolean existsByUserIdAndStatus(Long userId, VerificationStatus status);
}
