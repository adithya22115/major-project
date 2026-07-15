package com.medicycle.repository;

import com.medicycle.entity.MedicineDonation;
import com.medicycle.entity.Verification;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface VerificationRepository extends JpaRepository<Verification, Long> {
    List<Verification> findByDonation(MedicineDonation donation);
    List<Verification> findByDonationId(Long donationId);
}
