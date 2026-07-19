package com.medicycle.repository;

import com.medicycle.entity.MedicineDonation;
import com.medicycle.entity.User;
import com.medicycle.enums.DonationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface MedicineDonationRepository extends JpaRepository<MedicineDonation, Long> {
    List<MedicineDonation> findByDonor(User donor);
    List<MedicineDonation> findByStatus(DonationStatus status);
    List<MedicineDonation> findByDonorId(Long donorId);
    List<MedicineDonation> findByStatusAndCityIgnoreCase(DonationStatus status, String city);
    List<MedicineDonation> findByStatusAndStateIgnoreCase(DonationStatus status, String state);
    List<MedicineDonation> findByCityIgnoreCase(String city);

    @Query("SELECT d FROM MedicineDonation d " +
           "WHERE d.status = 'APPROVED' " +
           "AND d.medicine.id = :medicineId " +
           "AND (LOWER(d.city) <> LOWER(:excludeCity) OR d.city IS NULL) " +
           "ORDER BY CASE WHEN LOWER(d.state) = LOWER(:state) THEN 0 ELSE 1 END, d.city")
    List<MedicineDonation> findNearestAvailableByMedicine(
            @Param("medicineId") Long medicineId,
            @Param("excludeCity") String excludeCity,
            @Param("state") String state);

    @Query("SELECT DISTINCT d.city FROM MedicineDonation d " +
           "WHERE d.status = 'APPROVED' " +
           "AND d.medicine.id = :medicineId " +
           "AND d.city IS NOT NULL " +
           "ORDER BY d.city")
    List<String> findDistinctCitiesByMedicine(@Param("medicineId") Long medicineId);

    @Query("SELECT d FROM MedicineDonation d " +
           "WHERE d.status = 'APPROVED' " +
           "AND LOWER(d.medicine.medicineName) LIKE LOWER(CONCAT('%', :searchTerm, '%')) " +
           "AND (LOWER(d.city) = LOWER(:city)) " +
           "ORDER BY d.createdAt DESC")
    List<MedicineDonation> searchApprovedByCity(
            @Param("searchTerm") String searchTerm,
            @Param("city") String city);

    @Query("SELECT d FROM MedicineDonation d " +
           "WHERE d.status = 'APPROVED' " +
           "AND LOWER(d.medicine.medicineName) LIKE LOWER(CONCAT('%', :searchTerm, '%')) " +
           "ORDER BY d.createdAt DESC")
    List<MedicineDonation> searchApprovedAll(@Param("searchTerm") String searchTerm);
}
