package com.medicycle.service;

import com.medicycle.entity.Inventory;
import com.medicycle.entity.Medicine;
import com.medicycle.repository.InventoryRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class InventoryServiceTest {

    @Mock private InventoryRepository inventoryRepository;

    @InjectMocks private InventoryService inventoryService;

    private Medicine medicine;
    private Inventory inventory;

    @BeforeEach
    void setUp() {
        medicine = Medicine.builder().id(1L).medicineName("Paracetamol").build();
        inventory = Inventory.builder()
                .id(1L).medicine(medicine)
                .availableQuantity(100)
                .reservedQuantity(20)
                .distributedQuantity(50)
                .expiredQuantity(5)
                .build();
    }

    @Test
    void addAvailableQuantity_shouldIncrease() {
        when(inventoryRepository.findByMedicine(medicine)).thenReturn(Optional.of(inventory));
        when(inventoryRepository.save(any(Inventory.class))).thenReturn(inventory);

        inventoryService.addAvailableQuantity(medicine, 30);

        assertEquals(130, inventory.getAvailableQuantity());
        verify(inventoryRepository).save(inventory);
    }

    @Test
    void addAvailableQuantity_shouldCreateInventory_whenNotExists() {
        Inventory newInventory = Inventory.builder()
                .id(2L).medicine(medicine)
                .availableQuantity(0).reservedQuantity(0)
                .distributedQuantity(0).expiredQuantity(0)
                .build();

        when(inventoryRepository.findByMedicine(medicine)).thenReturn(Optional.empty());
        when(inventoryRepository.save(any(Inventory.class))).thenReturn(newInventory);

        inventoryService.addAvailableQuantity(medicine, 25);

        verify(inventoryRepository, atLeast(1)).save(any(Inventory.class));
    }

    @Test
    void reserveQuantity_shouldMoveFromAvailableToReserved() {
        when(inventoryRepository.findByMedicine(medicine)).thenReturn(Optional.of(inventory));
        when(inventoryRepository.save(any(Inventory.class))).thenReturn(inventory);

        inventoryService.reserveQuantity(medicine, 30);

        assertEquals(70, inventory.getAvailableQuantity());
        assertEquals(50, inventory.getReservedQuantity());
        verify(inventoryRepository).save(inventory);
    }

    @Test
    void reserveQuantity_shouldThrow_whenInsufficientQuantity() {
        when(inventoryRepository.findByMedicine(medicine)).thenReturn(Optional.of(inventory));

        assertThrows(IllegalStateException.class,
                () -> inventoryService.reserveQuantity(medicine, 150));
    }

    @Test
    void releaseReservedQuantity_shouldMoveBackToAvailable() {
        when(inventoryRepository.findByMedicine(medicine)).thenReturn(Optional.of(inventory));
        when(inventoryRepository.save(any(Inventory.class))).thenReturn(inventory);

        inventoryService.releaseReservedQuantity(medicine, 10);

        assertEquals(10, inventory.getReservedQuantity());
        assertEquals(110, inventory.getAvailableQuantity());
    }

    @Test
    void releaseReservedQuantity_shouldNotGoBelowZero() {
        when(inventoryRepository.findByMedicine(medicine)).thenReturn(Optional.of(inventory));
        when(inventoryRepository.save(any(Inventory.class))).thenReturn(inventory);

        inventoryService.releaseReservedQuantity(medicine, 50);

        assertEquals(0, inventory.getReservedQuantity());
        assertEquals(150, inventory.getAvailableQuantity());
    }

    @Test
    void completeDistribution_shouldMoveFromReservedToDistributed() {
        when(inventoryRepository.findByMedicine(medicine)).thenReturn(Optional.of(inventory));
        when(inventoryRepository.save(any(Inventory.class))).thenReturn(inventory);

        inventoryService.completeDistribution(medicine, 15);

        assertEquals(5, inventory.getReservedQuantity());
        assertEquals(65, inventory.getDistributedQuantity());
    }

    @Test
    void completeDistribution_shouldThrow_whenInsufficientReserved() {
        when(inventoryRepository.findByMedicine(medicine)).thenReturn(Optional.of(inventory));

        assertThrows(IllegalStateException.class,
                () -> inventoryService.completeDistribution(medicine, 30));
    }
}
