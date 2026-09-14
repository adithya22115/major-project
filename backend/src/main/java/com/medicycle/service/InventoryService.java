package com.medicycle.service;

import com.medicycle.dto.response.InventoryResponse;
import com.medicycle.dto.response.PagedResponse;
import com.medicycle.entity.Inventory;
import com.medicycle.entity.Medicine;
import com.medicycle.repository.InventoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

@Service
@RequiredArgsConstructor
public class InventoryService {

    private final InventoryRepository inventoryRepository;

    @Transactional(readOnly = true)
    public List<InventoryResponse> getAllInventory() {
        return inventoryRepository.findAll().stream()
                .map(DtoMapper::toInventoryResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public PagedResponse<InventoryResponse> getInventoryPage(Pageable pageable) {
        Page<Inventory> page = inventoryRepository.findAllPage(pageable);
        return PagedResponse.<InventoryResponse>builder()
                .content(page.getContent().stream().map(DtoMapper::toInventoryResponse).toList())
                .page(page.getNumber()).size(page.getSize()).totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages()).last(page.isLast()).build();
    }

    @Transactional
    public Inventory getOrCreateInventory(Medicine medicine) {
        return inventoryRepository.findByMedicine(medicine)
                .orElseGet(() -> inventoryRepository.save(Inventory.builder()
                        .medicine(medicine)
                        .availableQuantity(0)
                        .reservedQuantity(0)
                        .distributedQuantity(0)
                        .expiredQuantity(0)
                        .build()));
    }

    @Transactional
    public void addAvailableQuantity(Medicine medicine, int quantity) {
        Inventory inventory = getOrCreateInventory(medicine);
        inventory.setAvailableQuantity(inventory.getAvailableQuantity() + quantity);
        inventoryRepository.save(inventory);
    }

    @Transactional
    public void reserveQuantity(Medicine medicine, int quantity) {
        Inventory inventory = getOrCreateInventory(medicine);
        if (inventory.getAvailableQuantity() < quantity) {
            throw new IllegalStateException("Insufficient available quantity for " + medicine.getMedicineName());
        }
        inventory.setAvailableQuantity(inventory.getAvailableQuantity() - quantity);
        inventory.setReservedQuantity(inventory.getReservedQuantity() + quantity);
        inventoryRepository.save(inventory);
    }

    @Transactional
    public void releaseReservedQuantity(Medicine medicine, int quantity) {
        Inventory inventory = getOrCreateInventory(medicine);
        inventory.setReservedQuantity(Math.max(0, inventory.getReservedQuantity() - quantity));
        inventory.setAvailableQuantity(inventory.getAvailableQuantity() + quantity);
        inventoryRepository.save(inventory);
    }

    @Transactional
    public void completeDistribution(Medicine medicine, int quantity) {
        Inventory inventory = getOrCreateInventory(medicine);
        if (inventory.getReservedQuantity() < quantity) {
            throw new IllegalStateException("Insufficient reserved quantity for " + medicine.getMedicineName());
        }
        inventory.setReservedQuantity(inventory.getReservedQuantity() - quantity);
        inventory.setDistributedQuantity(inventory.getDistributedQuantity() + quantity);
        inventoryRepository.save(inventory);
    }
}
