package com.medicycle.repository;

import com.medicycle.entity.MedicineRequest;
import com.medicycle.entity.User;
import com.medicycle.enums.RequestStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MedicineRequestRepository extends JpaRepository<MedicineRequest, Long> {
    List<MedicineRequest> findByRecipient(User recipient);
    List<MedicineRequest> findByRecipientId(Long recipientId);
    List<MedicineRequest> findByStatus(RequestStatus status);
}
