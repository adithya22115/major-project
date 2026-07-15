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
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
        userRepository.findAll().stream()
                .filter(u -> u.getRole().getRoleName() == RoleType.PHARMACY || u.getRole().getRoleName() == RoleType.ADMIN)
                .forEach(pharmacy -> notificationService.createNotification(
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
            inventoryService.completeDistribution(medicine, quantity);

            notificationService.createNotification(
                    medicineRequest.getRecipient(),
                    "Request Completed",
                    "Your request for " + medicine.getMedicineName() + " has been approved and completed.",
                    "REQUEST");

            auditService.log(approver, "REQUEST_COMPLETED", "MedicineRequest", medicineRequest.getId());
        } else if (update.getStatus() == RequestStatus.REJECTED) {
            medicineRequest.setStatus(RequestStatus.REJECTED);
            medicineRequest.setApprovedBy(approver);
            inventoryService.releaseReservedQuantity(medicine, quantity);

            notificationService.createNotification(
                    medicineRequest.getRecipient(),
                    "Request Rejected",
                    "Your request for " + medicine.getMedicineName() + " was rejected.",
                    "REQUEST");

            auditService.log(approver, "REQUEST_REJECTED", "MedicineRequest", medicineRequest.getId());
        } else {
            throw new IllegalArgumentException("Invalid status update: " + update.getStatus());
        }

        medicineRequest = requestRepository.save(medicineRequest);
        return DtoMapper.toMedicineRequestResponse(medicineRequest);
    }
}
