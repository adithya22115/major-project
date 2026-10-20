package com.medicycle.service;

import com.medicycle.dto.request.PharmacyVerificationRequest;
import com.medicycle.dto.response.PharmacyVerificationResponse;
import com.medicycle.entity.PharmacyVerification;
import com.medicycle.entity.Role;
import com.medicycle.entity.User;
import com.medicycle.enums.RoleType;
import com.medicycle.enums.VerificationStatus;
import com.medicycle.exception.ResourceNotFoundException;
import com.medicycle.repository.PharmacyVerificationRepository;
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
class PharmacyVerificationServiceTest {

    @Mock private PharmacyVerificationRepository verificationRepository;
    @Mock private UserRepository userRepository;
    @Mock private NotificationService notificationService;
    @Mock private AuditService auditService;
    @Mock private EmailService emailService;

    @InjectMocks private PharmacyVerificationService pharmacyVerificationService;

    private User pharmacyUser;
    private User adminUser;
    private PharmacyVerification verification;

    @BeforeEach
    void setUp() {
        Role pharmacyRole = Role.builder().id(3L).roleName(RoleType.PHARMACY).build();
        Role adminRole = Role.builder().id(4L).roleName(RoleType.ADMIN).build();

        pharmacyUser = User.builder().id(1L).name("Pharmacy").email("pharmacy@test.com")
                .role(pharmacyRole).isVerified(false).build();
        adminUser = User.builder().id(2L).name("Admin").email("admin@test.com")
                .role(adminRole).build();

        verification = PharmacyVerification.builder()
                .id(1L).user(pharmacyUser)
                .pharmacyName("Test Pharmacy").licenseNumber("LIC001")
                .pharmacyAddress("123 Street").city("Mumbai").state("Maharashtra")
                .pincode("400001").contactPhone("9876543210")
                .contactEmail("pharmacy@test.com")
                .documentUrls(List.of("https://example.com/license.pdf"))
                .status(VerificationStatus.PENDING)
                .build();
    }

    @Test
    void submitVerification_shouldSucceed_newSubmission() {
        PharmacyVerificationRequest request = buildRequest();

        when(userRepository.findById(1L)).thenReturn(Optional.of(pharmacyUser));
        when(verificationRepository.existsByUserIdAndStatus(1L, VerificationStatus.APPROVED))
                .thenReturn(false);
        when(verificationRepository.findByUserId(1L)).thenReturn(Optional.empty());
        when(verificationRepository.save(any(PharmacyVerification.class))).thenReturn(verification);
        when(userRepository.findByRole_RoleName(RoleType.ADMIN)).thenReturn(List.of(adminUser));

        PharmacyVerificationResponse result = pharmacyVerificationService.submitVerification(request, 1L);

        assertNotNull(result);
        assertEquals("Test Pharmacy", result.getPharmacyName());
        assertEquals(VerificationStatus.PENDING, result.getStatus());
        verify(notificationService).createNotification(eq(adminUser), anyString(), anyString(), eq("VERIFICATION"));
        verify(auditService).log(eq(pharmacyUser), eq("VERIFICATION_SUBMITTED"),
                eq("PharmacyVerification"), eq(1L));
    }

    @Test
    void submitVerification_shouldThrow_whenNotPharmacyRole() {
        Role donorRole = Role.builder().id(1L).roleName(RoleType.DONOR).build();
        User donorUser = User.builder().id(3L).name("Donor").email("donor@test.com")
                .role(donorRole).build();

        PharmacyVerificationRequest request = buildRequest();

        when(userRepository.findById(3L)).thenReturn(Optional.of(donorUser));

        assertThrows(IllegalArgumentException.class,
                () -> pharmacyVerificationService.submitVerification(request, 3L));
    }

    @Test
    void submitVerification_shouldThrow_whenAlreadyApproved() {
        PharmacyVerificationRequest request = buildRequest();

        when(userRepository.findById(1L)).thenReturn(Optional.of(pharmacyUser));
        when(verificationRepository.existsByUserIdAndStatus(1L, VerificationStatus.APPROVED))
                .thenReturn(true);

        assertThrows(IllegalArgumentException.class,
                () -> pharmacyVerificationService.submitVerification(request, 1L));
    }

    @Test
    void submitVerification_shouldUpdateExisting_whenRejected() {
        verification.setStatus(VerificationStatus.REJECTED);
        PharmacyVerificationRequest request = buildRequest();

        when(userRepository.findById(1L)).thenReturn(Optional.of(pharmacyUser));
        when(verificationRepository.existsByUserIdAndStatus(1L, VerificationStatus.APPROVED))
                .thenReturn(false);
        when(verificationRepository.findByUserId(1L)).thenReturn(Optional.of(verification));
        when(verificationRepository.save(any(PharmacyVerification.class))).thenReturn(verification);
        when(userRepository.findByRole_RoleName(any(RoleType.class))).thenReturn(Collections.emptyList());

        PharmacyVerificationResponse result = pharmacyVerificationService.submitVerification(request, 1L);

        assertNotNull(result);
        assertEquals(VerificationStatus.PENDING, verification.getStatus());
        assertNull(verification.getAdminRemarks());
        assertNull(verification.getReviewedAt());
    }

    @Test
    void getMyVerification_shouldReturn_whenExists() {
        when(verificationRepository.findByUserId(1L)).thenReturn(Optional.of(verification));

        PharmacyVerificationResponse result = pharmacyVerificationService.getMyVerification(1L);

        assertNotNull(result);
        assertEquals("Test Pharmacy", result.getPharmacyName());
    }

    @Test
    void getMyVerification_shouldThrow_whenNotFound() {
        when(verificationRepository.findByUserId(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> pharmacyVerificationService.getMyVerification(99L));
    }

    @Test
    void getAllPending_shouldReturnPendingList() {
        when(verificationRepository.findByStatus(VerificationStatus.PENDING))
                .thenReturn(List.of(verification));

        List<PharmacyVerificationResponse> result = pharmacyVerificationService.getAllPending();

        assertEquals(1, result.size());
        assertEquals(VerificationStatus.PENDING, result.get(0).getStatus());
    }

    @Test
    void approveVerification_shouldSetApprovedAndVerifyUser() {
        when(verificationRepository.findById(1L)).thenReturn(Optional.of(verification));
        when(verificationRepository.save(any(PharmacyVerification.class))).thenReturn(verification);
        when(userRepository.save(any(User.class))).thenReturn(pharmacyUser);
        when(userRepository.findById(2L)).thenReturn(Optional.of(adminUser));

        PharmacyVerificationResponse result = pharmacyVerificationService
                .approveVerification(1L, "All documents verified", 2L);

        assertNotNull(result);
        assertEquals(VerificationStatus.APPROVED, verification.getStatus());
        assertEquals("All documents verified", verification.getAdminRemarks());
        assertNotNull(verification.getReviewedAt());
        assertTrue(pharmacyUser.isVerified());
        verify(notificationService).createNotification(eq(pharmacyUser), eq("Verification Approved"),
                anyString(), eq("VERIFICATION"));
    }

    @Test
    void approveVerification_shouldThrow_whenNoDocuments() {
        verification.setDocumentUrls(Collections.emptyList());
        when(verificationRepository.findById(1L)).thenReturn(Optional.of(verification));

        assertThrows(IllegalArgumentException.class,
                () -> pharmacyVerificationService.approveVerification(1L, "Approved", 2L));
    }

    @Test
    void rejectVerification_shouldSetRejectedAndUnverifyUser() {
        when(verificationRepository.findById(1L)).thenReturn(Optional.of(verification));
        when(verificationRepository.save(any(PharmacyVerification.class))).thenReturn(verification);
        when(userRepository.save(any(User.class))).thenReturn(pharmacyUser);
        when(userRepository.findById(2L)).thenReturn(Optional.of(adminUser));

        PharmacyVerificationResponse result = pharmacyVerificationService
                .rejectVerification(1L, "Invalid license", 2L);

        assertNotNull(result);
        assertEquals(VerificationStatus.REJECTED, verification.getStatus());
        assertEquals("Invalid license", verification.getAdminRemarks());
        assertFalse(pharmacyUser.isVerified());
        verify(notificationService).createNotification(eq(pharmacyUser), eq("Verification Rejected"),
                anyString(), eq("VERIFICATION"));
    }

    @Test
    void approveVerification_shouldThrow_whenNotFound() {
        when(verificationRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> pharmacyVerificationService.approveVerification(99L, "remarks", 2L));
    }

    private PharmacyVerificationRequest buildRequest() {
        PharmacyVerificationRequest request = new PharmacyVerificationRequest();
        request.setPharmacyName("Test Pharmacy");
        request.setLicenseNumber("LIC001");
        request.setPharmacyAddress("123 Street");
        request.setCity("Mumbai");
        request.setState("Maharashtra");
        request.setPincode("400001");
        request.setContactPhone("9876543210");
        request.setContactEmail("pharmacy@test.com");
        return request;
    }
}
