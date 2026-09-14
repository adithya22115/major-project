package com.medicycle.repository;

import com.medicycle.entity.Medicine;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface MedicineRepository extends JpaRepository<Medicine, Long> {
    List<Medicine> findByMedicineNameContainingIgnoreCase(String name);
    Page<Medicine> findAllByOrderByIdDesc(Pageable pageable);
}
