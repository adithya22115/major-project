package com.medicycle.repository;

import com.medicycle.entity.DoctorVerification;
import com.medicycle.enums.VerificationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DoctorVerificationRepository extends JpaRepository<DoctorVerification, Long> {

    @EntityGraph(attributePaths = {"user", "documentUrls"})
    Optional<DoctorVerification> findByUserId(Long userId);

    @EntityGraph(attributePaths = {"user", "documentUrls"})
    List<DoctorVerification> findByStatus(VerificationStatus status);

    boolean existsByUserIdAndStatus(Long userId, VerificationStatus status);
}
