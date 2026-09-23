package com.medicycle.service;

import com.medicycle.dto.request.MedicineRequestDto;
import com.medicycle.dto.request.RequestStatusUpdate;
import com.medicycle.dto.response.MedicineRequestResponse;
import com.medicycle.dto.response.PagedResponse;
import com.medicycle.entity.*;
import com.medicycle.enums.RequestStatus;
import com.medicycle.enums.RoleType;
import com.medicycle.exception.ResourceNotFoundException;
import com.medicycle.repository.MedicineRepository;
import com.medicycle.repository.MedicineRequestRepository;
import com.medicycle.repository.PrescriptionRepository;
import com.medicycle.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

@Service
@RequiredArgsConstructor
public class MedicineRequestService {

    private final MedicineRequestRepository requestRepository;
    private final MedicineRepository medicineRepository;
    private final UserRepository userRepository;
    private final PrescriptionRepository prescriptionRepository;
    private final InventoryService inventoryService;
    private final NotificationService notificationService;
    private final AuditService auditService;
    private final EmailService emailService;

    @Transactional
    public MedicineRequestResponse createRequest(MedicineRequestDto dto, Long recipientId) {
        User recipient = userRepository.findById(recipientId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + recipientId));

        Medicine medicine = medicineRepository.findById(dto.getMedicineId())
                .orElseThrow(() -> new ResourceNotFoundException("Medicine not found: " + dto.getMedicineId()));

        if (medicine.isRequiresPrescription() && dto.getPrescriptionFileUrl() == null) {
            throw new IllegalArgumentException("Prescription is required for this medicine");
        }

        inventoryService.reserveQuantity(medicine, dto.getRequestedQuantity());

        Prescription prescription = null;
        if (dto.getPrescriptionFileUrl() != null) {
            prescription = Prescription.builder()
                    .user(recipient)
                    .doctorName(dto.getDoctorName())
                    .hospitalName(dto.getHospitalName())
                    .fileUrl(dto.getPrescriptionFileUrl())
                    .issuedDate(dto.getIssuedDate())
                    .build();
            prescription = prescriptionRepository.save(prescription);
        }

        MedicineRequest medicineRequest = MedicineRequest.builder()
                .recipient(recipient)
                .medicine(medicine)
                .requestedQuantity(dto.getRequestedQuantity())
                .prescription(prescription)
                .status(RequestStatus.PENDING)
                .build();

        if (prescription != null) {
            prescription.setRequest(medicineRequest);
            prescriptionRepository.save(prescription);
        }

        medicineRequest = requestRepository.save(medicineRequest);

        notificationService.createNotification(
                recipient,
                "Request Submitted",
                "Your request for " + medicine.getMedicineName() + " has been submitted.",
                "REQUEST");

        notifyPharmacies(medicineRequest, medicine);

        auditService.log(recipient, "REQUEST_CREATED", "MedicineRequest", medicineRequest.getId());

        return DtoMapper.toMedicineRequestResponse(medicineRequest);
    }

    private void notifyPharmacies(MedicineRequest request, Medicine medicine) {
        List<User> pharmacyUsers = new java.util.ArrayList<>(userRepository.findByRole_RoleName(RoleType.PHARMACY));
        pharmacyUsers.addAll(userRepository.findByRole_RoleName(RoleType.ADMIN));
        pharmacyUsers.forEach(pharmacy -> notificationService.createNotification(
                pharmacy,
                "New Medicine Request",
                "A request for " + medicine.getMedicineName() + " (qty: " + request.getRequestedQuantity() + ") needs review.",
                "REQUEST"));
    }

    @Transactional(readOnly = true)
    public List<MedicineRequestResponse> getAllRequests() {
        return requestRepository.findAll().stream()
                .map(DtoMapper::toMedicineRequestResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<MedicineRequestResponse> getRequestsByRecipient(Long recipientId) {
        return requestRepository.findByRecipientId(recipientId).stream()
                .map(DtoMapper::toMedicineRequestResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public PagedResponse<MedicineRequestResponse> getRequestsPage(Long recipientId, Pageable pageable) {
        Page<MedicineRequest> page = recipientId == null
                ? requestRepository.findAllPage(pageable)
                : requestRepository.findByRecipientIdPage(recipientId, pageable);
        return PagedResponse.<MedicineRequestResponse>builder()
                .content(page.getContent().stream().map(DtoMapper::toMedicineRequestResponse).toList())
                .page(page.getNumber()).size(page.getSize()).totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages()).last(page.isLast()).build();
    }

    @Transactional
    public MedicineRequestResponse updateRequestStatus(Long requestId, RequestStatusUpdate update, Long approverId) {
        MedicineRequest medicineRequest = requestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Request not found: " + requestId));

        if (medicineRequest.getStatus() != RequestStatus.PENDING) {
            throw new IllegalStateException("Request is not in PENDING status");
        }

        User approver = userRepository.findById(approverId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + approverId));

        Medicine medicine = medicineRequest.getMedicine();
        int quantity = medicineRequest.getRequestedQuantity();

        if (update.getStatus() == RequestStatus.APPROVED || update.getStatus() == RequestStatus.COMPLETED) {
            medicineRequest.setStatus(RequestStatus.COMPLETED);
            medicineRequest.setApprovedBy(approver);
            notificationService.createNotification(
                    medicineRequest.getRecipient(),
                    "Request Completed",
                    "Your request for " + medicine.getMedicineName() + " has been approved and completed.",
                    "REQUEST");
            inventoryService.completeDistribution(medicine, quantity);
            auditService.log(approver, "REQUEST_COMPLETED", "MedicineRequest", medicineRequest.getId());

            String remarks = (update.getRemarks() != null && !update.getRemarks().isBlank())
                    ? update.getRemarks()
                    : "Your request has been approved and completed.";

            emailService.sendMedicineRequestStatusEmail(
                    medicineRequest.getRecipient().getEmail(),
                    medicineRequest.getRecipient().getName(),
                    medicine.getMedicineName(),
                    true,
                    remarks);
        } else if (update.getStatus() == RequestStatus.REJECTED && (medicineRequest.getStatus() == RequestStatus.PENDING || medicineRequest.getStatus() == RequestStatus.APPROVED)) {
            medicineRequest.setStatus(RequestStatus.REJECTED);
            medicineRequest.setApprovedBy(approver);
            inventoryService.releaseReservedQuantity(medicine, quantity);

            String rejectionReason = (update.getRemarks() != null && !update.getRemarks().isBlank())
                    ? update.getRemarks()
                    : "Request was rejected by verification staff.";

            notificationService.createNotification(
                    medicineRequest.getRecipient(),
                    "Request Rejected",
                    "Your request for " + medicine.getMedicineName() + " was rejected. Reason: " + rejectionReason,
                    "REQUEST");

            auditService.log(approver, "REQUEST_REJECTED", "MedicineRequest", medicineRequest.getId());

            emailService.sendMedicineRequestStatusEmail(
                    medicineRequest.getRecipient().getEmail(),
                    medicineRequest.getRecipient().getName(),
                    medicine.getMedicineName(),
                    false,
                    rejectionReason);
        } else {
            throw new IllegalArgumentException("Invalid status update: " + update.getStatus());
        }

        medicineRequest = requestRepository.save(medicineRequest);
        return DtoMapper.toMedicineRequestResponse(medicineRequest);
    }

    @Transactional
    public MedicineRequestResponse approveForQr(Long requestId, Long approverId) {
        MedicineRequest medicineRequest = requestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Request not found: " + requestId));
        if (medicineRequest.getStatus() != RequestStatus.PENDING) {
            throw new IllegalStateException("Request is not in PENDING status");
        }
        User approver = userRepository.findById(approverId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + approverId));
        medicineRequest.setStatus(RequestStatus.APPROVED);
        medicineRequest.setApprovedBy(approver);
        notificationService.createNotification(
                medicineRequest.getRecipient(),
                "Request Approved",
                "Your request for " + medicineRequest.getMedicine().getMedicineName() + " is approved and awaits QR verification at the pharmacy.",
                "REQUEST");
        auditService.log(approver, "REQUEST_APPROVED_FOR_QR", "MedicineRequest", requestId);

        emailService.sendMedicineRequestStatusEmail(
                medicineRequest.getRecipient().getEmail(),
                medicineRequest.getRecipient().getName(),
                medicineRequest.getMedicine().getMedicineName(),
                true,
                "Your request is approved and ready for pickup. Show your QR code at the pharmacy.");

        return DtoMapper.toMedicineRequestResponse(requestRepository.save(medicineRequest));
    }

    @Transactional
    public void completeApprovedRequest(MedicineRequest medicineRequest, Long approverId) {
        if (medicineRequest.getStatus() != RequestStatus.APPROVED) {
            throw new IllegalStateException("Request must be approved before dispensing");
        }
        User approver = userRepository.findById(approverId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + approverId));
        medicineRequest.setStatus(RequestStatus.COMPLETED);
        medicineRequest.setApprovedBy(approver);
        inventoryService.completeDistribution(medicineRequest.getMedicine(), medicineRequest.getRequestedQuantity());
        notificationService.createNotification(
                medicineRequest.getRecipient(),
                "Request Completed",
                "Your request for " + medicineRequest.getMedicine().getMedicineName() + " has been dispensed after QR verification.",
                "REQUEST");
        auditService.log(approver, "REQUEST_COMPLETED", "MedicineRequest", medicineRequest.getId());

        emailService.sendMedicineRequestStatusEmail(
                medicineRequest.getRecipient().getEmail(),
                medicineRequest.getRecipient().getName(),
                medicineRequest.getMedicine().getMedicineName(),
                true,
                "Your requested medicine has been verified and dispensed by the pharmacy partner.");

        requestRepository.save(medicineRequest);
    }
}
