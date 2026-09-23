package com.medicycle.service;

import com.medicycle.dto.request.DonationQrRequest;
import com.medicycle.dto.request.QrScanRequest;
import com.medicycle.dto.response.DonationQrResponse;
import com.medicycle.dto.response.QrScanResponse;
import com.medicycle.entity.MedicineDonation;
import com.medicycle.entity.MedicineRequest;
import com.medicycle.entity.User;
import com.medicycle.enums.DonationStatus;
import com.medicycle.enums.RequestStatus;
import com.medicycle.enums.RoleType;
import com.medicycle.exception.ResourceNotFoundException;
import com.medicycle.repository.MedicineDonationRepository;
import com.medicycle.repository.MedicineRequestRepository;
import com.medicycle.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class DonationQrService {
    private final MedicineDonationRepository donationRepository;
    private final MedicineRequestRepository requestRepository;
    private final UserRepository userRepository;
    private final MedicineRequestService requestService;
    private final AuditService auditService;

    @Transactional
    public DonationQrResponse createQr(Long donationId, DonationQrRequest request, Long actorId) {
        MedicineDonation donation = donationRepository.findById(donationId)
                .orElseThrow(() -> new ResourceNotFoundException("Donation not found: " + donationId));
        User actor = userRepository.findById(actorId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + actorId));
        requireStaff(actor);
        if (donation.getStatus() != DonationStatus.APPROVED) {
            throw new IllegalStateException("QR can only be created for an approved donation");
        }
        if (!donation.getDonor().getId().equals(request.getDonorId())
                || !donation.getMedicine().getMedicineName().equalsIgnoreCase(request.getMedicineName().trim())
                || !donation.getBatchNumber().equalsIgnoreCase(request.getBatchNumber().trim())
                || !donation.getExpiryDate().equals(LocalDate.parse(request.getExpiryDate()))
                || donation.getQuantity() < request.getQuantity()
                || !"APPROVED".equalsIgnoreCase(request.getVerificationStatus())) {
            throw new IllegalArgumentException("QR details do not match the verified donation");
        }
        donation.setPackagingPhotoUrl(request.getPackagingPhotoUrl());
        if (donation.getQrCodeToken() == null) {
            donation.setQrCodeToken(UUID.randomUUID().toString());
        }
        if (donation.getQrCodeFileName() == null) {
            donation.setQrCodeFileName(buildQrFileName(donation));
        }
        donationRepository.save(donation);
        auditService.log(actor, "DONATION_QR_CREATED", "MedicineDonation", donationId);
        return toResponse(donation);
    }

    @Transactional
    public QrScanResponse validateAndDispense(QrScanRequest request, Long actorId) {
        MedicineDonation donation = donationRepository.findByQrCodeToken(request.getQrCodeToken())
                .orElseThrow(() -> new IllegalArgumentException("Invalid or unknown donation QR code"));
        MedicineRequest medicineRequest = requestRepository.findById(request.getRequestId())
                .orElseThrow(() -> new ResourceNotFoundException("Medicine request not found: " + request.getRequestId()));
        User actor = userRepository.findById(actorId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + actorId));
        requireStaff(actor);
        if (donation.getStatus() != DonationStatus.APPROVED) {
            throw new IllegalStateException("This donation is not approved for distribution");
        }
        if (medicineRequest.getStatus() != RequestStatus.APPROVED) {
            throw new IllegalStateException("The recipient request must be approved before scanning");
        }
        int requested = medicineRequest.getRequestedQuantity();
        int remaining = donation.getQuantity() - (donation.getDistributedQuantity() == null ? 0 : donation.getDistributedQuantity());
        if (!donation.getMedicine().getId().equals(medicineRequest.getMedicine().getId())
                || !donation.getMedicine().getMedicineName().equalsIgnoreCase(medicineRequest.getMedicine().getMedicineName())
                || donation.getExpiryDate() == null
                || donation.getExpiryDate().isBefore(LocalDate.now())
                || remaining < requested) {
            throw new IllegalStateException("QR medicine, expiry date, or quantity does not match this request");
        }
        requestService.completeApprovedRequest(medicineRequest, actorId);
        donation.setDistributedQuantity((donation.getDistributedQuantity() == null ? 0 : donation.getDistributedQuantity()) + requested);
        if (donation.getDistributedQuantity() >= donation.getQuantity()) {
            donation.setStatus(DonationStatus.DISTRIBUTED);
        }
        donationRepository.save(donation);
        return QrScanResponse.builder().valid(true).message("QR verified. Medicine dispensed successfully.")
                .donationId(donation.getId()).requestId(medicineRequest.getId())
                .medicineName(donation.getMedicine().getMedicineName()).batchNumber(donation.getBatchNumber())
                .expiryDate(donation.getExpiryDate().toString()).quantity(requested).build();
    }

    private void requireStaff(User user) {
        if (user.getRole().getRoleName() != RoleType.PHARMACY && user.getRole().getRoleName() != RoleType.ADMIN) {
            throw new IllegalStateException("Only pharmacy staff can create or scan donation QR codes");
        }
    }

    private String buildQrFileName(MedicineDonation donation) {
        String medicineName = donation.getMedicine().getMedicineName()
                .replaceAll("[^a-zA-Z0-9]+", "-")
                .replaceAll("(^-|-$)", "")
                .toLowerCase();
        LocalDate receivedDate = donation.getCreatedAt() != null
                ? donation.getCreatedAt().toLocalDate()
                : LocalDateTime.now().toLocalDate();
        return medicineName + "-" + receivedDate + ".svg";
    }

    private DonationQrResponse toResponse(MedicineDonation donation) {
        int distributed = donation.getDistributedQuantity() == null ? 0 : donation.getDistributedQuantity();
        return DonationQrResponse.builder().donationId(donation.getId()).qrCodeToken(donation.getQrCodeToken())
                .qrCodeFileName(donation.getQrCodeFileName())
                .medicineName(donation.getMedicine().getMedicineName()).batchNumber(donation.getBatchNumber())
                .expiryDate(donation.getExpiryDate()).quantity(donation.getQuantity())
                .remainingQuantity(donation.getQuantity() - distributed)
                .packagingPhotoUrl(donation.getPackagingPhotoUrl()).donorId(donation.getDonor().getId())
                .verificationStatus(donation.getStatus().name()).build();
    }
}
