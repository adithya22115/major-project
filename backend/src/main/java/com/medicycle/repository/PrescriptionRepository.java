package com.medicycle.repository;

import com.medicycle.entity.Prescription;
import com.medicycle.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PrescriptionRepository extends JpaRepository<Prescription, Long> {
    List<Prescription> findByUser(User user);
    List<Prescription> findByUserId(Long userId);
}
