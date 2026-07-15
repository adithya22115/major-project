package com.medicycle.repository;

import com.medicycle.entity.MedicineDonation;
import com.medicycle.entity.MedicineImage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MedicineImageRepository extends JpaRepository<MedicineImage, Long> {
    List<MedicineImage> findByDonation(MedicineDonation donation);
    List<MedicineImage> findByDonationId(Long donationId);
}
