package com.medicycle.service;

import com.medicycle.dto.request.VerificationRequest;
import com.medicycle.dto.response.VerificationResponse;
import com.medicycle.entity.Medicine;
import com.medicycle.entity.MedicineDonation;
import com.medicycle.entity.Role;
import com.medicycle.entity.User;
import com.medicycle.entity.Verification;
import com.medicycle.enums.DonationStatus;
import com.medicycle.enums.RoleType;
import com.medicycle.enums.VerificationResult;
import com.medicycle.exception.ResourceNotFoundException;
import com.medicycle.repository.MedicineDonationRepository;
import com.medicycle.repository.UserRepository;
import com.medicycle.repository.VerificationRepository;
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
class VerificationServiceTest {

    @Mock private VerificationRepository verificationRepository;
    @Mock private MedicineDonationRepository donationRepository;
    @Mock private UserRepository userRepository;
    @Mock private InventoryService inventoryService;
    @Mock private NotificationService notificationService;
    @Mock private AuditService auditService;

    @InjectMocks private VerificationService verificationService;

    private User verifier;
    private User donor;
    private Medicine medicine;
    private MedicineDonation donation;

    @BeforeEach
    void setUp() {
        Role pharmacyRole = Role.builder().id(3L).roleName(RoleType.PHARMACY).build();
        Role donorRole = Role.builder().id(1L).roleName(RoleType.DONOR).build();

        verifier = User.builder().id(2L).name("Pharmacy").email("pharmacy@test.com")
                .role(pharmacyRole).build();
        donor = User.builder().id(1L).name("Donor").email("donor@test.com")
                .role(donorRole).build();

        medicine = Medicine.builder().id(1L).medicineName("Paracetamol").build();

        donation = MedicineDonation.builder()
                .id(1L).donor(donor).medicine(medicine)
                .quantity(10).status(DonationStatus.PENDING)
                .build();
    }

    @Test
    void verifyDonation_shouldApprove_andAddToInventory() {
        VerificationRequest request = new VerificationRequest();
        request.setResult(VerificationResult.APPROVED);
        request.setRemarks("Good quality");

        Verification savedVerification = Verification.builder()
                .id(1L).donation(donation).verifiedBy(verifier)
                .result(VerificationResult.APPROVED).remarks("Good quality")
                .build();

        when(donationRepository.findById(1L)).thenReturn(Optional.of(donation));
        when(userRepository.findById(2L)).thenReturn(Optional.of(verifier));
        when(verificationRepository.save(any(Verification.class))).thenReturn(savedVerification);
        when(donationRepository.save(any(MedicineDonation.class))).thenReturn(donation);

        VerificationResponse result = verificationService.verifyDonation(1L, request, 2L);

        assertNotNull(result);
        assertEquals(VerificationResult.APPROVED, result.getResult());
        assertEquals(DonationStatus.APPROVED, donation.getStatus());
        verify(inventoryService).addAvailableQuantity(medicine, 10);
        verify(notificationService).createNotification(eq(donor), eq("Donation Approved"),
                anyString(), eq("DONATION"));
        verify(auditService).log(eq(verifier), eq("DONATION_VERIFIED"), eq("MedicineDonation"), eq(1L));
    }

    @Test
    void verifyDonation_shouldReject() {
        VerificationRequest request = new VerificationRequest();
        request.setResult(VerificationResult.REJECTED);
        request.setRemarks("Expired medicine");

        Verification savedVerification = Verification.builder()
                .id(1L).donation(donation).verifiedBy(verifier)
                .result(VerificationResult.REJECTED).remarks("Expired medicine")
                .build();

        when(donationRepository.findById(1L)).thenReturn(Optional.of(donation));
        when(userRepository.findById(2L)).thenReturn(Optional.of(verifier));
        when(verificationRepository.save(any(Verification.class))).thenReturn(savedVerification);
        when(donationRepository.save(any(MedicineDonation.class))).thenReturn(donation);

        VerificationResponse result = verificationService.verifyDonation(1L, request, 2L);

        assertNotNull(result);
        assertEquals(VerificationResult.REJECTED, result.getResult());
        assertEquals(DonationStatus.REJECTED, donation.getStatus());
        verify(inventoryService, never()).addAvailableQuantity(any(), anyInt());
        verify(notificationService).createNotification(eq(donor), eq("Donation Rejected"),
                anyString(), eq("DONATION"));
    }

    @Test
    void verifyDonation_shouldThrow_whenDonationNotFound() {
        VerificationRequest request = new VerificationRequest();
        request.setResult(VerificationResult.APPROVED);

        when(donationRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> verificationService.verifyDonation(99L, request, 2L));
    }

    @Test
    void verifyDonation_shouldThrow_whenDonationAlreadyApproved() {
        donation.setStatus(DonationStatus.APPROVED);

        VerificationRequest request = new VerificationRequest();
        request.setResult(VerificationResult.APPROVED);

        when(donationRepository.findById(1L)).thenReturn(Optional.of(donation));

        assertThrows(IllegalStateException.class,
                () -> verificationService.verifyDonation(1L, request, 2L));
    }

    @Test
    void verifyDonation_shouldAllow_whenUnderReview() {
        donation.setStatus(DonationStatus.UNDER_REVIEW);

        VerificationRequest request = new VerificationRequest();
        request.setResult(VerificationResult.APPROVED);
        request.setRemarks("Checked");

        Verification savedVerification = Verification.builder()
                .id(1L).donation(donation).verifiedBy(verifier)
                .result(VerificationResult.APPROVED).remarks("Checked")
                .build();

        when(donationRepository.findById(1L)).thenReturn(Optional.of(donation));
        when(userRepository.findById(2L)).thenReturn(Optional.of(verifier));
        when(verificationRepository.save(any(Verification.class))).thenReturn(savedVerification);
        when(donationRepository.save(any(MedicineDonation.class))).thenReturn(donation);

        VerificationResponse result = verificationService.verifyDonation(1L, request, 2L);

        assertNotNull(result);
        assertEquals(DonationStatus.APPROVED, donation.getStatus());
    }
}
