package com.medicycle.service;

import com.medicycle.dto.request.VerificationRequest;
import com.medicycle.dto.response.VerificationResponse;
import com.medicycle.entity.MedicineDonation;
import com.medicycle.entity.User;
import com.medicycle.entity.Verification;
import com.medicycle.enums.DonationStatus;
import com.medicycle.enums.VerificationResult;
import com.medicycle.exception.ResourceNotFoundException;
import com.medicycle.repository.MedicineDonationRepository;
import com.medicycle.repository.UserRepository;
import com.medicycle.repository.VerificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class VerificationService {

    private final VerificationRepository verificationRepository;
    private final MedicineDonationRepository donationRepository;
    private final UserRepository userRepository;
    private final InventoryService inventoryService;
    private final NotificationService notificationService;
    private final AuditService auditService;

    @Transactional
    public VerificationResponse verifyDonation(Long donationId, VerificationRequest request, Long verifierId) {
        MedicineDonation donation = donationRepository.findById(donationId)
                .orElseThrow(() -> new ResourceNotFoundException("Donation not found: " + donationId));

        if (donation.getStatus() != DonationStatus.PENDING && donation.getStatus() != DonationStatus.UNDER_REVIEW) {
            throw new IllegalStateException("Donation cannot be verified in status: " + donation.getStatus());
        }

        User verifier = userRepository.findById(verifierId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + verifierId));

        Verification verification = Verification.builder()
                .donation(donation)
                .verifiedBy(verifier)
                .result(request.getResult())
                .remarks(request.getRemarks())
                .build();

        verification = verificationRepository.save(verification);

        if (request.getResult() == VerificationResult.APPROVED) {
            donation.setStatus(DonationStatus.APPROVED);
            inventoryService.addAvailableQuantity(donation.getMedicine(), donation.getQuantity());
            notificationService.createNotification(
                    donation.getDonor(),
                    "Donation Approved",
                    "Your donation of " + donation.getMedicine().getMedicineName() + " has been approved.",
                    "DONATION");
        } else {
            donation.setStatus(DonationStatus.REJECTED);
            notificationService.createNotification(
                    donation.getDonor(),
                    "Donation Rejected",
                    "Your donation of " + donation.getMedicine().getMedicineName() + " was rejected. " +
                            (request.getRemarks() != null ? request.getRemarks() : ""),
                    "DONATION");
        }

        donationRepository.save(donation);
        auditService.log(verifier, "DONATION_VERIFIED", "MedicineDonation", donation.getId());

        return DtoMapper.toVerificationResponse(verification);
    }
}
