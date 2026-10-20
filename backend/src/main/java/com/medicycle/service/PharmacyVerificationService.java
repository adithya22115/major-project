package com.medicycle.service;

import com.medicycle.dto.request.PharmacyVerificationRequest;
import com.medicycle.dto.response.PharmacyVerificationResponse;
import com.medicycle.entity.PharmacyVerification;
import com.medicycle.entity.User;
import com.medicycle.enums.RoleType;
import com.medicycle.enums.VerificationStatus;
import com.medicycle.enums.VerificationType;
import com.medicycle.exception.ResourceNotFoundException;
import com.medicycle.repository.PharmacyVerificationRepository;
import com.medicycle.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PharmacyVerificationService {

    private final PharmacyVerificationRepository verificationRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final AuditService auditService;
    private final EmailService emailService;

    @Transactional
    public PharmacyVerificationResponse submitVerification(PharmacyVerificationRequest request, Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));

        if (user.getRole().getRoleName() != RoleType.PHARMACY) {
            throw new IllegalArgumentException("Only pharmacy accounts can submit pharmacy verification");
        }

        if (verificationRepository.existsByUserIdAndStatus(userId, VerificationStatus.APPROVED)) {
            throw new IllegalArgumentException("Your pharmacy is already verified");
        }

        PharmacyVerification existing = verificationRepository.findByUserId(userId).orElse(null);
        PharmacyVerification verification;
        if (existing != null && existing.getStatus() == VerificationStatus.PENDING) {
            verification = existing;
        } else if (existing != null && existing.getStatus() == VerificationStatus.REJECTED) {
            verification = existing;
            verification.setStatus(VerificationStatus.PENDING);
            verification.setAdminRemarks(null);
            verification.setReviewedAt(null);
        } else {
            verification = PharmacyVerification.builder().user(user).build();
        }

        verification.setPharmacyName(request.getPharmacyName());
        verification.setLicenseNumber(request.getLicenseNumber());
        verification.setPharmacyAddress(request.getPharmacyAddress());
        verification.setCity(request.getCity());
        verification.setState(request.getState());
        verification.setPincode(request.getPincode());
        verification.setContactPhone(request.getContactPhone());
        verification.setContactEmail(request.getContactEmail());
        if (request.getDocumentUrls() != null) {
            verification.setDocumentUrls(request.getDocumentUrls());
        }
        verification.setVerificationType(
                request.getVerificationType() != null ? request.getVerificationType() : VerificationType.PHARMACY);

        verification = verificationRepository.save(verification);

        auditService.log(user, "VERIFICATION_SUBMITTED", "PharmacyVerification", verification.getId());

        User admin = userRepository.findByRole_RoleName(RoleType.ADMIN).stream()
                .findFirst()
                .orElse(null);
        if (admin != null) {
            notificationService.createNotification(admin,
                    "Pharmacy Verification Request",
                    user.getName() + " (" + verification.getPharmacyName() + ") has submitted pharmacy verification documents.",
                    "VERIFICATION");
        }

        return toResponse(verification);
    }

    @Transactional(readOnly = true)
    public PharmacyVerificationResponse getMyVerification(Long userId) {
        PharmacyVerification verification = verificationRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("No verification found for this user"));
        return toResponse(verification);
    }

    @Transactional(readOnly = true)
    public List<PharmacyVerificationResponse> getAllPending() {
        return verificationRepository.findByStatus(VerificationStatus.PENDING).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<PharmacyVerificationResponse> getAllByStatus(VerificationStatus status) {
        return verificationRepository.findByStatus(status).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public PharmacyVerificationResponse getByUserId(Long userId) {
        return verificationRepository.findByUserId(userId)
                .map(this::toResponse)
                .orElse(null);
    }

    @Transactional
    public PharmacyVerificationResponse approveVerification(Long verificationId, String remarks, Long adminId) {
        PharmacyVerification verification = verificationRepository.findById(verificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Verification not found: " + verificationId));

        if (verification.getDocumentUrls() == null || verification.getDocumentUrls().isEmpty()) {
            throw new IllegalArgumentException("Cannot approve pharmacy verification: No verification documents have been uploaded.");
        }

        verification.setStatus(VerificationStatus.APPROVED);
        verification.setAdminRemarks(remarks);
        verification.setReviewedAt(LocalDateTime.now());
        verification = verificationRepository.save(verification);

        User user = verification.getUser();
        user.setVerified(true);
        userRepository.save(user);

        notificationService.createNotification(user,
                "Verification Approved",
                "Your pharmacy verification has been approved. You can now access all pharmacy features.",
                "VERIFICATION");

        emailService.sendAccountVerificationStatusEmail(
                user.getEmail(),
                user.getName(),
                user.getRole().getRoleName().name(),
                true,
                remarks);

        auditService.log(userRepository.findById(adminId).orElse(null),
                "VERIFICATION_APPROVED", "PharmacyVerification", verification.getId());

        return toResponse(verification);
    }

    @Transactional
    public PharmacyVerificationResponse rejectVerification(Long verificationId, String remarks, Long adminId) {
        PharmacyVerification verification = verificationRepository.findById(verificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Verification not found: " + verificationId));

        verification.setStatus(VerificationStatus.REJECTED);
        verification.setAdminRemarks(remarks);
        verification.setReviewedAt(LocalDateTime.now());
        verification = verificationRepository.save(verification);

        User user = verification.getUser();
        user.setVerified(false);
        userRepository.save(user);

        notificationService.createNotification(user,
                "Verification Rejected",
                "Your pharmacy verification was rejected. Reason: " + (remarks != null ? remarks : "Not specified") + ". Please resubmit with correct documents.",
                "VERIFICATION");

        emailService.sendAccountVerificationStatusEmail(
                user.getEmail(),
                user.getName(),
                user.getRole().getRoleName().name(),
                false,
                remarks);

        auditService.log(userRepository.findById(adminId).orElse(null),
                "VERIFICATION_REJECTED", "PharmacyVerification", verification.getId());

        return toResponse(verification);
    }

    private PharmacyVerificationResponse toResponse(PharmacyVerification v) {
        return PharmacyVerificationResponse.builder()
                .id(v.getId())
                .userId(v.getUser().getId())
                .userName(v.getUser().getName())
                .userEmail(v.getUser().getEmail())
                .pharmacyName(v.getPharmacyName())
                .licenseNumber(v.getLicenseNumber())
                .pharmacyAddress(v.getPharmacyAddress())
                .city(v.getCity())
                .state(v.getState())
                .pincode(v.getPincode())
                .contactPhone(v.getContactPhone())
                .contactEmail(v.getContactEmail())
                .documentUrls(v.getDocumentUrls())
                .verificationType(v.getVerificationType())
                .status(v.getStatus())
                .adminRemarks(v.getAdminRemarks())
                .submittedAt(v.getSubmittedAt())
                .reviewedAt(v.getReviewedAt())
                .expiresAt(v.getExpiresAt())
                .build();
    }
}
