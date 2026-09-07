package com.medicycle.repository;

import com.medicycle.entity.MedicineRequest;
import com.medicycle.entity.User;
import com.medicycle.enums.RequestStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface MedicineRequestRepository extends JpaRepository<MedicineRequest, Long> {
    List<MedicineRequest> findByRecipient(User recipient);

    /**
     * List queries below eagerly fetch the LAZY recipient/approvedBy
     * associations to avoid N+1 selects in the DTO mapper.
     */
    @Override
    @Query("SELECT r FROM MedicineRequest r JOIN FETCH r.recipient JOIN FETCH r.medicine " +
            "LEFT JOIN FETCH r.prescription LEFT JOIN FETCH r.approvedBy")
    List<MedicineRequest> findAll();

    @Query("SELECT r FROM MedicineRequest r JOIN FETCH r.recipient JOIN FETCH r.medicine " +
            "LEFT JOIN FETCH r.prescription LEFT JOIN FETCH r.approvedBy WHERE r.recipient.id = :recipientId")
    List<MedicineRequest> findByRecipientId(@Param("recipientId") Long recipientId);

    @Query("SELECT r FROM MedicineRequest r JOIN FETCH r.recipient JOIN FETCH r.medicine " +
            "LEFT JOIN FETCH r.prescription LEFT JOIN FETCH r.approvedBy WHERE r.status = :status")
    List<MedicineRequest> findByStatus(@Param("status") RequestStatus status);
}
