package com.medicycle.service;

import com.medicycle.dto.request.MedicineRequestDto;
import com.medicycle.dto.request.RequestStatusUpdate;
import com.medicycle.dto.response.MedicineRequestResponse;
import com.medicycle.entity.*;
import com.medicycle.enums.RequestStatus;
import com.medicycle.enums.RoleType;
import com.medicycle.exception.ResourceNotFoundException;
import com.medicycle.repository.MedicineRepository;
import com.medicycle.repository.MedicineRequestRepository;
import com.medicycle.repository.PrescriptionRepository;
import com.medicycle.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MedicineRequestServiceTest {

    @Mock private MedicineRequestRepository requestRepository;
    @Mock private MedicineRepository medicineRepository;
    @Mock private UserRepository userRepository;
    @Mock private PrescriptionRepository prescriptionRepository;
    @Mock private InventoryService inventoryService;
    @Mock private NotificationService notificationService;
    @Mock private AuditService auditService;

    @InjectMocks private MedicineRequestService medicineRequestService;

    private User recipient;
    private User approver;
    private Medicine medicine;
    private MedicineRequest testRequest;

    @BeforeEach
    void setUp() {
        Role recipientRole = Role.builder().id(2L).roleName(RoleType.RECIPIENT).build();
        Role pharmacyRole = Role.builder().id(3L).roleName(RoleType.PHARMACY).build();

        recipient = User.builder().id(1L).name("Recipient").email("recipient@test.com")
                .role(recipientRole).build();
        approver = User.builder().id(2L).name("Pharmacy").email("pharmacy@test.com")
                .role(pharmacyRole).build();

        medicine = Medicine.builder().id(1L).medicineName("Paracetamol")
                .requiresPrescription(false).build();

        testRequest = MedicineRequest.builder()
                .id(1L).recipient(recipient).medicine(medicine)
                .requestedQuantity(5).status(RequestStatus.PENDING)
                .build();
    }

    @Test
    void createRequest_shouldSucceed_withoutPrescription() {
        MedicineRequestDto dto = new MedicineRequestDto();
        dto.setMedicineId(1L);
        dto.setRequestedQuantity(5);

        when(userRepository.findById(1L)).thenReturn(Optional.of(recipient));
        when(medicineRepository.findById(1L)).thenReturn(Optional.of(medicine));
        when(requestRepository.save(any(MedicineRequest.class))).thenReturn(testRequest);
        when(userRepository.findByRole_RoleName(any(RoleType.class))).thenReturn(Collections.emptyList());

        MedicineRequestResponse result = medicineRequestService.createRequest(dto, 1L);

        assertNotNull(result);
        assertEquals("Paracetamol", result.getMedicineName());
        assertEquals(5, result.getRequestedQuantity());
        verify(inventoryService).reserveQuantity(medicine, 5);
        verify(notificationService).createNotification(eq(recipient), anyString(), anyString(), eq("REQUEST"));
        verify(auditService).log(eq(recipient), eq("REQUEST_CREATED"), eq("MedicineRequest"), eq(1L));
    }

    @Test
    void createRequest_shouldSucceed_withPrescription() {
        medicine.setRequiresPrescription(true);

        MedicineRequestDto dto = new MedicineRequestDto();
        dto.setMedicineId(1L);
        dto.setRequestedQuantity(5);
        dto.setPrescriptionFileUrl("/uploads/prescription.pdf");
        dto.setDoctorName("Dr. Smith");
        dto.setHospitalName("City Hospital");

        Prescription prescription = Prescription.builder()
                .id(1L).user(recipient).fileUrl("/uploads/prescription.pdf")
                .doctorName("Dr. Smith").hospitalName("City Hospital")
                .build();

        when(userRepository.findById(1L)).thenReturn(Optional.of(recipient));
        when(medicineRepository.findById(1L)).thenReturn(Optional.of(medicine));
        when(prescriptionRepository.save(any(Prescription.class))).thenReturn(prescription);

        MedicineRequest requestWithPrescription = MedicineRequest.builder()
                .id(1L).recipient(recipient).medicine(medicine)
                .requestedQuantity(5).prescription(prescription)
                .status(RequestStatus.PENDING).build();
        when(requestRepository.save(any(MedicineRequest.class))).thenReturn(requestWithPrescription);
        when(userRepository.findByRole_RoleName(any(RoleType.class))).thenReturn(Collections.emptyList());

        MedicineRequestResponse result = medicineRequestService.createRequest(dto, 1L);

        assertNotNull(result);
        assertEquals(1L, result.getPrescriptionId());
        verify(prescriptionRepository, atLeast(1)).save(any(Prescription.class));
    }

    @Test
    void createRequest_shouldThrow_whenPrescriptionRequired_butNotProvided() {
        medicine.setRequiresPrescription(true);

        MedicineRequestDto dto = new MedicineRequestDto();
        dto.setMedicineId(1L);
        dto.setRequestedQuantity(5);

        when(userRepository.findById(1L)).thenReturn(Optional.of(recipient));
        when(medicineRepository.findById(1L)).thenReturn(Optional.of(medicine));

        assertThrows(IllegalArgumentException.class,
                () -> medicineRequestService.createRequest(dto, 1L));
    }

    @Test
    void createRequest_shouldThrow_whenRecipientNotFound() {
        MedicineRequestDto dto = new MedicineRequestDto();
        dto.setMedicineId(1L);
        dto.setRequestedQuantity(5);

        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> medicineRequestService.createRequest(dto, 99L));
    }

    @Test
    void updateRequestStatus_shouldComplete_whenApproved() {
        RequestStatusUpdate update = new RequestStatusUpdate();
        update.setStatus(RequestStatus.APPROVED);

        when(requestRepository.findById(1L)).thenReturn(Optional.of(testRequest));
        when(userRepository.findById(2L)).thenReturn(Optional.of(approver));
        when(requestRepository.save(any(MedicineRequest.class))).thenReturn(testRequest);

        MedicineRequestResponse result = medicineRequestService.updateRequestStatus(1L, update, 2L);

        assertNotNull(result);
        assertEquals(RequestStatus.COMPLETED, testRequest.getStatus());
        assertEquals(approver, testRequest.getApprovedBy());
        verify(inventoryService).completeDistribution(medicine, 5);
        verify(notificationService).createNotification(eq(recipient), eq("Request Completed"),
                anyString(), eq("REQUEST"));
    }

    @Test
    void updateRequestStatus_shouldReject() {
        RequestStatusUpdate update = new RequestStatusUpdate();
        update.setStatus(RequestStatus.REJECTED);

        when(requestRepository.findById(1L)).thenReturn(Optional.of(testRequest));
        when(userRepository.findById(2L)).thenReturn(Optional.of(approver));
        when(requestRepository.save(any(MedicineRequest.class))).thenReturn(testRequest);

        MedicineRequestResponse result = medicineRequestService.updateRequestStatus(1L, update, 2L);

        assertNotNull(result);
        assertEquals(RequestStatus.REJECTED, testRequest.getStatus());
        verify(inventoryService).releaseReservedQuantity(medicine, 5);
        verify(notificationService).createNotification(eq(recipient), eq("Request Rejected"),
                anyString(), eq("REQUEST"));
    }

    @Test
    void updateRequestStatus_shouldThrow_whenNotPending() {
        testRequest.setStatus(RequestStatus.COMPLETED);

        RequestStatusUpdate update = new RequestStatusUpdate();
        update.setStatus(RequestStatus.REJECTED);

        when(requestRepository.findById(1L)).thenReturn(Optional.of(testRequest));

        assertThrows(IllegalStateException.class,
                () -> medicineRequestService.updateRequestStatus(1L, update, 2L));
    }

    @Test
    void updateRequestStatus_shouldThrow_whenRequestNotFound() {
        RequestStatusUpdate update = new RequestStatusUpdate();
        update.setStatus(RequestStatus.APPROVED);

        when(requestRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> medicineRequestService.updateRequestStatus(99L, update, 2L));
    }

    @Test
    void updateRequestStatus_shouldThrow_whenInvalidStatusUpdate() {
        RequestStatusUpdate update = new RequestStatusUpdate();
        update.setStatus(RequestStatus.PENDING);

        when(requestRepository.findById(1L)).thenReturn(Optional.of(testRequest));
        when(userRepository.findById(2L)).thenReturn(Optional.of(approver));

        assertThrows(IllegalArgumentException.class,
                () -> medicineRequestService.updateRequestStatus(1L, update, 2L));
    }

    @Test
    void getAllRequests_shouldReturnList() {
        when(requestRepository.findAll()).thenReturn(List.of(testRequest));

        List<MedicineRequestResponse> result = medicineRequestService.getAllRequests();

        assertEquals(1, result.size());
    }

    @Test
    void getRequestsByRecipient_shouldReturnFilteredList() {
        when(requestRepository.findByRecipientId(1L)).thenReturn(List.of(testRequest));

        List<MedicineRequestResponse> result = medicineRequestService.getRequestsByRecipient(1L);

        assertEquals(1, result.size());
        assertEquals(1L, result.get(0).getRecipientId());
    }
}
