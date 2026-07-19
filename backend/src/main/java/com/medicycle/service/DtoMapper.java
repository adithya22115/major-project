package com.medicycle.service;

import com.medicycle.entity.*;
import com.medicycle.dto.response.*;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

public final class DtoMapper {

    private DtoMapper() {}

    public static UserResponse toUserResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .role(user.getRole().getRoleName())
                .address(user.getAddress())
                .city(user.getCity())
                .state(user.getState())
                .pincode(user.getPincode())
                .latitude(user.getLatitude())
                .longitude(user.getLongitude())
                .isVerified(user.isVerified())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }

    public static MedicineResponse toMedicineResponse(Medicine medicine) {
        return MedicineResponse.builder()
                .id(medicine.getId())
                .medicineName(medicine.getMedicineName())
                .manufacturer(medicine.getManufacturer())
                .category(medicine.getCategory())
                .dosage(medicine.getDosage())
                .description(medicine.getDescription())
                .requiresPrescription(medicine.isRequiresPrescription())
                .build();
    }

    public static DonationResponse toDonationResponse(MedicineDonation donation, List<String> imageUrls) {
        return DonationResponse.builder()
                .id(donation.getId())
                .donorId(donation.getDonor().getId())
                .donorName(donation.getDonor().getName())
                .medicineId(donation.getMedicine().getId())
                .medicineName(donation.getMedicine().getMedicineName())
                .medicineCategory(donation.getMedicine().getCategory())
                .medicineDosage(donation.getMedicine().getDosage())
                .quantity(donation.getQuantity())
                .batchNumber(donation.getBatchNumber())
                .manufactureDate(donation.getManufactureDate())
                .expiryDate(donation.getExpiryDate())
                .condition(donation.getCondition())
                .status(donation.getStatus())
                .remarks(donation.getRemarks())
                .city(donation.getCity())
                .state(donation.getState())
                .pincode(donation.getPincode())
                .latitude(donation.getLatitude())
                .longitude(donation.getLongitude())
                .createdAt(donation.getCreatedAt())
                .imageUrls(imageUrls != null ? imageUrls : Collections.emptyList())
                .build();
    }

    public static VerificationResponse toVerificationResponse(Verification verification) {
        return VerificationResponse.builder()
                .id(verification.getId())
                .donationId(verification.getDonation().getId())
                .verifiedById(verification.getVerifiedBy().getId())
                .verifiedByName(verification.getVerifiedBy().getName())
                .verificationDate(verification.getVerificationDate())
                .result(verification.getResult())
                .remarks(verification.getRemarks())
                .build();
    }

    public static InventoryResponse toInventoryResponse(Inventory inventory) {
        return InventoryResponse.builder()
                .id(inventory.getId())
                .medicineId(inventory.getMedicine().getId())
                .medicineName(inventory.getMedicine().getMedicineName())
                .availableQuantity(inventory.getAvailableQuantity())
                .reservedQuantity(inventory.getReservedQuantity())
                .distributedQuantity(inventory.getDistributedQuantity())
                .expiredQuantity(inventory.getExpiredQuantity())
                .updatedAt(inventory.getUpdatedAt())
                .build();
    }

    public static MedicineRequestResponse toMedicineRequestResponse(MedicineRequest request) {
        return MedicineRequestResponse.builder()
                .id(request.getId())
                .recipientId(request.getRecipient().getId())
                .recipientName(request.getRecipient().getName())
                .medicineId(request.getMedicine().getId())
                .medicineName(request.getMedicine().getMedicineName())
                .requestedQuantity(request.getRequestedQuantity())
                .prescriptionId(request.getPrescription() != null ? request.getPrescription().getId() : null)
                .status(request.getStatus())
                .approvedById(request.getApprovedBy() != null ? request.getApprovedBy().getId() : null)
                .approvedByName(request.getApprovedBy() != null ? request.getApprovedBy().getName() : null)
                .createdAt(request.getCreatedAt())
                .build();
    }

    public static NotificationResponse toNotificationResponse(Notification notification) {
        return NotificationResponse.builder()
                .id(notification.getId())
                .title(notification.getTitle())
                .message(notification.getMessage())
                .type(notification.getType())
                .isRead(notification.isRead())
                .createdAt(notification.getCreatedAt())
                .build();
    }

    public static AuditLogResponse toAuditLogResponse(AuditLog log) {
        return AuditLogResponse.builder()
                .id(log.getId())
                .userId(log.getUser() != null ? log.getUser().getId() : null)
                .userName(log.getUser() != null ? log.getUser().getName() : null)
                .action(log.getAction())
                .entityName(log.getEntityName())
                .entityId(log.getEntityId())
                .timestamp(log.getTimestamp())
                .build();
    }
}
