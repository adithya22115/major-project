package com.medicycle.service;

import com.medicycle.dto.request.DonationRequest;
import com.medicycle.dto.response.DonationResponse;
import com.medicycle.entity.Medicine;
import com.medicycle.entity.MedicineDonation;
import com.medicycle.entity.MedicineImage;
import com.medicycle.entity.Role;
import com.medicycle.entity.User;
import com.medicycle.enums.DonationStatus;
import com.medicycle.enums.RoleType;
import com.medicycle.exception.ResourceNotFoundException;
import com.medicycle.repository.MedicineDonationRepository;
import com.medicycle.repository.MedicineImageRepository;
import com.medicycle.repository.MedicineRepository;
import com.medicycle.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DonationServiceTest {

    @Mock private MedicineDonationRepository donationRepository;
    @Mock private MedicineRepository medicineRepository;
    @Mock private UserRepository userRepository;
    @Mock private MedicineImageRepository imageRepository;
    @Mock private NotificationService notificationService;
    @Mock private AuditService auditService;

    @InjectMocks private DonationService donationService;

    private User donorUser;
    private Medicine testMedicine;
    private MedicineDonation testDonation;

    @BeforeEach
    void setUp() {
        Role donorRole = Role.builder().id(1L).roleName(RoleType.DONOR).build();
        donorUser = User.builder().id(1L).name("Donor").email("donor@test.com")
                .role(donorRole).city("Mumbai").state("Maharashtra").pincode("400001").build();

        testMedicine = Medicine.builder().id(1L).medicineName("Paracetamol")
                .manufacturer("Cipla").category("Analgesic").dosage("500mg")
                .requiresPrescription(false).build();

        testDonation = MedicineDonation.builder()
                .id(1L).donor(donorUser).medicine(testMedicine)
                .quantity(10).batchNumber("BATCH001")
                .expiryDate(LocalDate.now().plusMonths(6))
                .status(DonationStatus.PENDING)
                .city("Mumbai").state("Maharashtra").pincode("400001")
                .build();
    }

    @Test
    void createDonation_shouldSucceed_withExistingMedicineId() {
        DonationRequest request = new DonationRequest();
        request.setMedicineId(1L);
        request.setQuantity(10);
        request.setBatchNumber("BATCH001");
        request.setExpiryDate(LocalDate.now().plusMonths(6));
        request.setCondition("Good");

        when(userRepository.findById(1L)).thenReturn(Optional.of(donorUser));
        when(medicineRepository.findById(1L)).thenReturn(Optional.of(testMedicine));
        when(donationRepository.save(any(MedicineDonation.class))).thenReturn(testDonation);
        when(userRepository.findByRole_RoleName(any(RoleType.class))).thenReturn(Collections.emptyList());

        DonationResponse result = donationService.createDonation(request, 1L);

        assertNotNull(result);
        assertEquals(1L, result.getId());
        assertEquals("Paracetamol", result.getMedicineName());
        assertEquals(10, result.getQuantity());
        verify(notificationService).createNotification(eq(donorUser), anyString(), anyString(), eq("DONATION"));
        verify(auditService).log(eq(donorUser), eq("DONATION_CREATED"), eq("MedicineDonation"), eq(1L));
    }

    @Test
    void createDonation_shouldSucceed_withNewMedicineName() {
        DonationRequest request = new DonationRequest();
        request.setMedicineName("NewMedicine");
        request.setManufacturer("NewManufacturer");
        request.setCategory("NewCategory");
        request.setDosage("100mg");
        request.setQuantity(5);

        Medicine newMedicine = Medicine.builder().id(2L).medicineName("NewMedicine")
                .manufacturer("NewManufacturer").build();

        when(userRepository.findById(1L)).thenReturn(Optional.of(donorUser));
        when(medicineRepository.findByMedicineNameContainingIgnoreCase("NewMedicine"))
                .thenReturn(Collections.emptyList());
        when(medicineRepository.save(any(Medicine.class))).thenReturn(newMedicine);

        MedicineDonation savedDonation = MedicineDonation.builder()
                .id(2L).donor(donorUser).medicine(newMedicine).quantity(5)
                .status(DonationStatus.PENDING).city("Mumbai").state("Maharashtra")
                .build();
        when(donationRepository.save(any(MedicineDonation.class))).thenReturn(savedDonation);
        when(userRepository.findByRole_RoleName(any(RoleType.class))).thenReturn(Collections.emptyList());

        DonationResponse result = donationService.createDonation(request, 1L);

        assertNotNull(result);
        assertEquals("NewMedicine", result.getMedicineName());
        verify(medicineRepository).save(any(Medicine.class));
    }

    @Test
    void createDonation_shouldThrow_whenNoMedicineIdOrName() {
        DonationRequest request = new DonationRequest();
        request.setQuantity(5);

        when(userRepository.findById(1L)).thenReturn(Optional.of(donorUser));

        assertThrows(IllegalArgumentException.class,
                () -> donationService.createDonation(request, 1L));
    }

    @Test
    void createDonation_shouldThrow_whenDonorNotFound() {
        DonationRequest request = new DonationRequest();
        request.setMedicineId(1L);
        request.setQuantity(5);

        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> donationService.createDonation(request, 99L));
    }

    @Test
    void createDonation_shouldSaveImages_whenProvided() {
        DonationRequest request = new DonationRequest();
        request.setMedicineId(1L);
        request.setQuantity(10);
        request.setImageUrls(List.of("/uploads/img1.jpg", "/uploads/img2.jpg"));

        when(userRepository.findById(1L)).thenReturn(Optional.of(donorUser));
        when(medicineRepository.findById(1L)).thenReturn(Optional.of(testMedicine));
        when(donationRepository.save(any(MedicineDonation.class))).thenReturn(testDonation);
        when(imageRepository.save(any(MedicineImage.class))).thenAnswer(inv -> inv.getArgument(0));
        when(userRepository.findByRole_RoleName(any(RoleType.class))).thenReturn(Collections.emptyList());

        DonationResponse result = donationService.createDonation(request, 1L);

        assertNotNull(result);
        verify(imageRepository, times(2)).save(any(MedicineImage.class));
    }

    @Test
    void getAllDonations_shouldReturnList() {
        when(donationRepository.findAll()).thenReturn(List.of(testDonation));
        when(imageRepository.findByDonationId(1L)).thenReturn(Collections.emptyList());

        List<DonationResponse> result = donationService.getAllDonations();

        assertEquals(1, result.size());
        assertEquals("Paracetamol", result.get(0).getMedicineName());
    }

    @Test
    void getDonationsByDonor_shouldReturnFilteredList() {
        when(donationRepository.findByDonorId(1L)).thenReturn(List.of(testDonation));
        when(imageRepository.findByDonationId(1L)).thenReturn(Collections.emptyList());

        List<DonationResponse> result = donationService.getDonationsByDonor(1L);

        assertEquals(1, result.size());
        assertEquals(1L, result.get(0).getDonorId());
    }

    @Test
    void getDonationById_shouldReturnDonation_whenExists() {
        when(donationRepository.findById(1L)).thenReturn(Optional.of(testDonation));
        when(imageRepository.findByDonationId(1L)).thenReturn(Collections.emptyList());

        DonationResponse result = donationService.getDonationById(1L);

        assertNotNull(result);
        assertEquals(1L, result.getId());
    }

    @Test
    void getDonationById_shouldThrow_whenNotFound() {
        when(donationRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> donationService.getDonationById(99L));
    }
}
