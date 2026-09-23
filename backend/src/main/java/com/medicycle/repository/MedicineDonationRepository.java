package com.medicycle.repository;

import com.medicycle.entity.MedicineDonation;
import com.medicycle.entity.Medicine;
import com.medicycle.entity.User;
import com.medicycle.enums.DonationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.Modifying;

import java.util.List;
import java.util.Optional;

public interface MedicineDonationRepository extends JpaRepository<MedicineDonation, Long> {
    Optional<MedicineDonation> findByQrCodeToken(String qrCodeToken);
    List<MedicineDonation> findByDonor(User donor);

    @Query("SELECT d FROM MedicineDonation d JOIN FETCH d.donor JOIN FETCH d.medicine")
    Page<MedicineDonation> findAllPage(Pageable pageable);

    @Query("SELECT d FROM MedicineDonation d JOIN FETCH d.donor JOIN FETCH d.medicine WHERE d.donor.id = :donorId")
    Page<MedicineDonation> findByDonorIdPage(@Param("donorId") Long donorId, Pageable pageable);

    long countByStatus(DonationStatus status);
    long countByStatusAndMedicine(DonationStatus status, Medicine medicine);

    @Modifying
    @Query("UPDATE MedicineDonation d SET d.status = com.medicycle.enums.DonationStatus.EXPIRED " +
            "WHERE d.status = com.medicycle.enums.DonationStatus.APPROVED AND d.expiryDate < :today")
    int markExpired(@Param("today") java.time.LocalDate today);

    /**
     * List queries below eagerly fetch the LAZY donor association to avoid
     * N+1 selects when the DTO mapper reads donor fields for every row.
     */
    @Override
    @Query("SELECT d FROM MedicineDonation d JOIN FETCH d.donor JOIN FETCH d.medicine")
    List<MedicineDonation> findAll();

    @Query("SELECT d FROM MedicineDonation d JOIN FETCH d.donor JOIN FETCH d.medicine WHERE d.status = :status")
    List<MedicineDonation> findByStatus(@Param("status") DonationStatus status);

    @Query("SELECT d FROM MedicineDonation d JOIN FETCH d.donor JOIN FETCH d.medicine WHERE d.donor.id = :donorId")
    List<MedicineDonation> findByDonorId(@Param("donorId") Long donorId);

    @Query("SELECT d FROM MedicineDonation d JOIN FETCH d.donor JOIN FETCH d.medicine WHERE d.status = :status AND LOWER(d.city) = LOWER(:city)")
    List<MedicineDonation> findByStatusAndCityIgnoreCase(@Param("status") DonationStatus status, @Param("city") String city);

    @Query("SELECT d FROM MedicineDonation d JOIN FETCH d.donor JOIN FETCH d.medicine WHERE d.status = :status AND LOWER(d.state) = LOWER(:state)")
    List<MedicineDonation> findByStatusAndStateIgnoreCase(@Param("status") DonationStatus status, @Param("state") String state);

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
