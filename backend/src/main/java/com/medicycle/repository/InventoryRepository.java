package com.medicycle.repository;

import com.medicycle.entity.Inventory;
import com.medicycle.entity.Medicine;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface InventoryRepository extends JpaRepository<Inventory, Long> {
    Optional<Inventory> findByMedicine(Medicine medicine);
    Optional<Inventory> findByMedicineId(Long medicineId);
}
