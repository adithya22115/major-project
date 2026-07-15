package com.medicycle.repository;

import com.medicycle.entity.MedicineDonation;
import com.medicycle.entity.User;
import com.medicycle.enums.DonationStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MedicineDonationRepository extends JpaRepository<MedicineDonation, Long> {
    List<MedicineDonation> findByDonor(User donor);
    List<MedicineDonation> findByStatus(DonationStatus status);
    List<MedicineDonation> findByDonorId(Long donorId);
}
