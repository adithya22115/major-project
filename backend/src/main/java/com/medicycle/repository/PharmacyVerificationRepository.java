package com.medicycle.repository;

import com.medicycle.entity.PharmacyVerification;
import com.medicycle.enums.VerificationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.EntityGraph;

import java.util.List;
import java.util.Optional;

public interface PharmacyVerificationRepository extends JpaRepository<PharmacyVerification, Long> {
    @EntityGraph(attributePaths = {"user", "documentUrls"})
    Optional<PharmacyVerification> findByUserId(Long userId);

    @EntityGraph(attributePaths = {"user", "documentUrls"})
    List<PharmacyVerification> findByStatus(VerificationStatus status);
    boolean existsByUserIdAndStatus(Long userId, VerificationStatus status);
}
