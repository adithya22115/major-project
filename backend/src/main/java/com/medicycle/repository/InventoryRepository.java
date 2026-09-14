package com.medicycle.repository;

import com.medicycle.entity.Inventory;
import com.medicycle.entity.Medicine;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;

public interface InventoryRepository extends JpaRepository<Inventory, Long> {
    Optional<Inventory> findByMedicine(Medicine medicine);
    Optional<Inventory> findByMedicineId(Long medicineId);
    @Query("SELECT i FROM Inventory i JOIN FETCH i.medicine")
    Page<Inventory> findAllPage(Pageable pageable);
}
