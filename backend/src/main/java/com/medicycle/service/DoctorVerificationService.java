package com.medicycle.service;

import com.medicycle.dto.request.DoctorVerificationRequest;
import com.medicycle.dto.response.DoctorVerificationResponse;
import com.medicycle.entity.DoctorVerification;
import com.medicycle.entity.User;
import com.medicycle.enums.RoleType;
import com.medicycle.enums.VerificationStatus;
import com.medicycle.exception.ResourceNotFoundException;
import com.medicycle.repository.DoctorVerificationRepository;
import com.medicycle.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DoctorVerificationService {

    private final DoctorVerificationRepository verificationRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final AuditService auditService;
    private final EmailService emailService;

    @Transactional
    public DoctorVerificationResponse submitVerification(DoctorVerificationRequest request, Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));

        if (user.getRole().getRoleName() != RoleType.DOCTOR) {
            throw new IllegalArgumentException("Only doctor accounts can submit doctor verification");
        }

        if (verificationRepository.existsByUserIdAndStatus(userId, VerificationStatus.APPROVED)) {
            throw new IllegalArgumentException("Your doctor account is already verified");
        }

        DoctorVerification existing = verificationRepository.findByUserId(userId).orElse(null);
        DoctorVerification verification;

        if (existing != null && existing.getStatus() == VerificationStatus.PENDING) {
            existing.setDoctorName(request.getDoctorName());
            existing.setRegistrationNumber(request.getRegistrationNumber());
            existing.setSpecialization(request.getSpecialization());
            existing.setQualification(request.getQualification());
            existing.setClinicHospitalName(request.getClinicHospitalName());
            existing.setClinicAddress(request.getClinicAddress());
            existing.setCity(request.getCity());
            existing.setState(request.getState());
            existing.setPincode(request.getPincode());
            existing.setContactPhone(request.getContactPhone());
            existing.setContactEmail(request.getContactEmail());
            existing.setDocumentUrls(request.getDocumentUrls());
            existing.setSubmittedAt(LocalDateTime.now());
            verification = verificationRepository.save(existing);
        } else if (existing != null && existing.getStatus() == VerificationStatus.REJECTED) {
            existing.setDoctorName(request.getDoctorName());
            existing.setRegistrationNumber(request.getRegistrationNumber());
            existing.setSpecialization(request.getSpecialization());
            existing.setQualification(request.getQualification());
            existing.setClinicHospitalName(request.getClinicHospitalName());
            existing.setClinicAddress(request.getClinicAddress());
            existing.setCity(request.getCity());
            existing.setState(request.getState());
            existing.setPincode(request.getPincode());
            existing.setContactPhone(request.getContactPhone());
            existing.setContactEmail(request.getContactEmail());
            existing.setDocumentUrls(request.getDocumentUrls());
            existing.setStatus(VerificationStatus.PENDING);
            existing.setAdminRemarks(null);
            existing.setReviewedAt(null);
            existing.setSubmittedAt(LocalDateTime.now());
            verification = verificationRepository.save(existing);
        } else {
            verification = DoctorVerification.builder()
                    .user(user)
                    .doctorName(request.getDoctorName())
                    .registrationNumber(request.getRegistrationNumber())
                    .specialization(request.getSpecialization())
                    .qualification(request.getQualification())
                    .clinicHospitalName(request.getClinicHospitalName())
                    .clinicAddress(request.getClinicAddress())
                    .city(request.getCity())
                    .state(request.getState())
                    .pincode(request.getPincode())
                    .contactPhone(request.getContactPhone())
                    .contactEmail(request.getContactEmail())
                    .documentUrls(request.getDocumentUrls())
                    .status(VerificationStatus.PENDING)
                    .submittedAt(LocalDateTime.now())
                    .build();
            verification = verificationRepository.save(verification);
        }

        auditService.log(user, "DOCTOR_VERIFICATION_SUBMITTED", "DoctorVerification", verification.getId());

        // Notify admins
        List<User> admins = userRepository.findByRole_RoleName(RoleType.ADMIN);
        for (User admin : admins) {
            notificationService.createNotification(admin,
                    "Doctor Verification Request",
                    "Dr. " + verification.getDoctorName() + " (Reg No: " + verification.getRegistrationNumber() + ") has submitted verification documents.",
                    "VERIFICATION");
        }

        return toResponse(verification);
    }

    @Transactional(readOnly = true)
    public DoctorVerificationResponse getMyVerification(Long userId) {
        DoctorVerification verification = verificationRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("No doctor verification found for this user"));
        return toResponse(verification);
    }

    @Transactional(readOnly = true)
    public List<DoctorVerificationResponse> getAllPending() {
        return verificationRepository.findByStatus(VerificationStatus.PENDING).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<DoctorVerificationResponse> getAllByStatus(VerificationStatus status) {
        return verificationRepository.findByStatus(status).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public DoctorVerificationResponse approveVerification(Long verificationId, String remarks, Long adminId) {
        DoctorVerification verification = verificationRepository.findById(verificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor verification not found: " + verificationId));

        verification.setStatus(VerificationStatus.APPROVED);
        verification.setAdminRemarks(remarks);
        verification.setReviewedAt(LocalDateTime.now());
        verification = verificationRepository.save(verification);

        User user = verification.getUser();
        user.setVerified(true);
        userRepository.save(user);

        notificationService.createNotification(user,
                "Doctor Verification Approved",
                "Your doctor credentials and medical registration have been approved. You now have full access to the Doctor Workspace.",
                "VERIFICATION");

        emailService.sendAccountVerificationStatusEmail(
                user.getEmail(),
                user.getName(),
                "DOCTOR",
                true,
                remarks);

        auditService.log(userRepository.findById(adminId).orElse(null),
                "DOCTOR_VERIFICATION_APPROVED", "DoctorVerification", verification.getId());

        return toResponse(verification);
    }

    @Transactional
    public DoctorVerificationResponse rejectVerification(Long verificationId, String remarks, Long adminId) {
        DoctorVerification verification = verificationRepository.findById(verificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor verification not found: " + verificationId));

        verification.setStatus(VerificationStatus.REJECTED);
        verification.setAdminRemarks(remarks);
        verification.setReviewedAt(LocalDateTime.now());
        verification = verificationRepository.save(verification);

        User user = verification.getUser();
        user.setVerified(false);
        userRepository.save(user);

        notificationService.createNotification(user,
                "Doctor Verification Rejected",
                "Your doctor application was rejected. Reason: " + (remarks != null ? remarks : "Not specified") + ". Please re-upload valid medical certificates.",
                "VERIFICATION");

        emailService.sendAccountVerificationStatusEmail(
                user.getEmail(),
                user.getName(),
                "DOCTOR",
                false,
                remarks);

        auditService.log(userRepository.findById(adminId).orElse(null),
                "DOCTOR_VERIFICATION_REJECTED", "DoctorVerification", verification.getId());

        return toResponse(verification);
    }

    private DoctorVerificationResponse toResponse(DoctorVerification v) {
        return DoctorVerificationResponse.builder()
                .id(v.getId())
                .userId(v.getUser().getId())
                .userName(v.getUser().getName())
                .userEmail(v.getUser().getEmail())
                .doctorName(v.getDoctorName())
                .registrationNumber(v.getRegistrationNumber())
                .specialization(v.getSpecialization())
                .qualification(v.getQualification())
                .clinicHospitalName(v.getClinicHospitalName())
                .clinicAddress(v.getClinicAddress())
                .city(v.getCity())
                .state(v.getState())
                .pincode(v.getPincode())
                .contactPhone(v.getContactPhone())
                .contactEmail(v.getContactEmail())
                .documentUrls(v.getDocumentUrls())
                .status(v.getStatus())
                .adminRemarks(v.getAdminRemarks())
                .submittedAt(v.getSubmittedAt())
                .reviewedAt(v.getReviewedAt())
                .build();
    }
}
