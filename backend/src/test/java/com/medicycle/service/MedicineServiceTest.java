package com.medicycle.service;

import com.medicycle.dto.request.MedicineCreateRequest;
import com.medicycle.dto.response.MedicineResponse;
import com.medicycle.entity.Medicine;
import com.medicycle.entity.Role;
import com.medicycle.entity.User;
import com.medicycle.enums.RoleType;
import com.medicycle.exception.ResourceNotFoundException;
import com.medicycle.repository.MedicineRepository;
import com.medicycle.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MedicineServiceTest {

    @Mock private MedicineRepository medicineRepository;
    @Mock private UserRepository userRepository;
    @Mock private AuditService auditService;

    @InjectMocks private MedicineService medicineService;

    private Medicine testMedicine;
    private User adminUser;

    @BeforeEach
    void setUp() {
        Role adminRole = Role.builder().id(4L).roleName(RoleType.ADMIN).build();
        adminUser = User.builder().id(1L).name("Admin").email("admin@test.com")
                .role(adminRole).build();

        testMedicine = Medicine.builder()
                .id(1L)
                .medicineName("Paracetamol")
                .manufacturer("Cipla")
                .category("Analgesic")
                .dosage("500mg")
                .description("Pain reliever")
                .requiresPrescription(false)
                .build();
    }

    @Test
    void getAllMedicines_shouldReturnList() {
        Medicine med2 = Medicine.builder().id(2L).medicineName("Amoxicillin")
                .manufacturer("Sun Pharma").category("Antibiotic").dosage("250mg")
                .requiresPrescription(true).build();

        when(medicineRepository.findAll()).thenReturn(List.of(testMedicine, med2));

        List<MedicineResponse> result = medicineService.getAllMedicines();

        assertEquals(2, result.size());
        assertEquals("Paracetamol", result.get(0).getMedicineName());
        assertEquals("Amoxicillin", result.get(1).getMedicineName());
    }

    @Test
    void getMedicineById_shouldReturnMedicine_whenExists() {
        when(medicineRepository.findById(1L)).thenReturn(Optional.of(testMedicine));

        MedicineResponse result = medicineService.getMedicineById(1L);

        assertNotNull(result);
        assertEquals("Paracetamol", result.getMedicineName());
        assertEquals("Cipla", result.getManufacturer());
    }

    @Test
    void getMedicineById_shouldThrow_whenNotFound() {
        when(medicineRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> medicineService.getMedicineById(99L));
    }

    @Test
    void createMedicine_shouldSucceed() {
        MedicineCreateRequest request = new MedicineCreateRequest();
        request.setMedicineName("Ibuprofen");
        request.setManufacturer("Dr. Reddy's");
        request.setCategory("NSAID");
        request.setDosage("400mg");
        request.setDescription("Anti-inflammatory");
        request.setRequiresPrescription(false);

        when(userRepository.findById(1L)).thenReturn(Optional.of(adminUser));
        when(medicineRepository.save(any(Medicine.class))).thenAnswer(inv -> {
            Medicine m = inv.getArgument(0);
            m.setId(2L);
            return m;
        });

        MedicineResponse result = medicineService.createMedicine(request, 1L);

        assertNotNull(result);
        assertEquals("Ibuprofen", result.getMedicineName());
        verify(auditService).log(eq(adminUser), eq("MEDICINE_CREATED"), eq("Medicine"), eq(2L));
    }

    @Test
    void createMedicine_shouldThrow_whenAdminNotFound() {
        MedicineCreateRequest request = new MedicineCreateRequest();
        request.setMedicineName("Test");

        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> medicineService.createMedicine(request, 99L));
    }

    @Test
    void updateMedicine_shouldSucceed() {
        MedicineCreateRequest request = new MedicineCreateRequest();
        request.setMedicineName("Updated Paracetamol");
        request.setDosage("650mg");

        when(userRepository.findById(1L)).thenReturn(Optional.of(adminUser));
        when(medicineRepository.findById(1L)).thenReturn(Optional.of(testMedicine));
        when(medicineRepository.save(any(Medicine.class))).thenReturn(testMedicine);

        MedicineResponse result = medicineService.updateMedicine(1L, request, 1L);

        assertNotNull(result);
        assertEquals("Updated Paracetamol", testMedicine.getMedicineName());
        assertEquals("650mg", testMedicine.getDosage());
        verify(auditService).log(eq(adminUser), eq("MEDICINE_UPDATED"), eq("Medicine"), eq(1L));
    }

    @Test
    void updateMedicine_shouldThrow_whenMedicineNotFound() {
        MedicineCreateRequest request = new MedicineCreateRequest();
        request.setMedicineName("Test");

        when(userRepository.findById(1L)).thenReturn(Optional.of(adminUser));
        when(medicineRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> medicineService.updateMedicine(99L, request, 1L));
    }

    @Test
    void deleteMedicine_shouldSucceed() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(adminUser));
        when(medicineRepository.findById(1L)).thenReturn(Optional.of(testMedicine));

        medicineService.deleteMedicine(1L, 1L);

        verify(medicineRepository).delete(testMedicine);
        verify(auditService).log(eq(adminUser), eq("MEDICINE_DELETED"), eq("Medicine"), eq(1L));
    }

    @Test
    void deleteMedicine_shouldThrow_whenNotFound() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(adminUser));
        when(medicineRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> medicineService.deleteMedicine(99L, 1L));
    }
}
