package com.medicycle.service;

import com.medicycle.dto.response.*;
import com.medicycle.entity.*;
import com.medicycle.enums.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class DtoMapperTest {

        private Role donorRole;
        private Role pharmacyRole;
        private User testUser;
        private Medicine testMedicine;

        @BeforeEach
        void setUp() {
                donorRole = Role.builder().id(1L).roleName(RoleType.DONOR).build();
                pharmacyRole = Role.builder().id(3L).roleName(RoleType.PHARMACY).build();

                testUser = User.builder()
                                .id(1L).name("Test User").email("test@test.com")
                                .phone("9876543210").role(donorRole)
                                .address("123 Street").city("Mumbai")
                                .state("Maharashtra").pincode("400001")
                                .isVerified(true)
                                .createdAt(LocalDateTime.of(2025, 1, 1, 0, 0))
                                .updatedAt(LocalDateTime.of(2025, 6, 1, 0, 0))
                                .build();

                testMedicine = Medicine.builder()
                                .id(1L).medicineName("Paracetamol")
                                .manufacturer("Cipla").category("Analgesic")
                                .dosage("500mg").description("Pain reliever")
                                .requiresPrescription(false)
                                .build();
        }

        @Test
        void toUserResponse_shouldMapAllFields() {
                UserResponse result = DtoMapper.toUserResponse(testUser);

                assertEquals(1L, result.getId());
                assertEquals("Test User", result.getName());
                assertEquals("test@test.com", result.getEmail());
                assertEquals("9876543210", result.getPhone());
                assertEquals(RoleType.DONOR, result.getRole());
                assertEquals("123 Street", result.getAddress());
                assertEquals("Mumbai", result.getCity());
                assertEquals("Maharashtra", result.getState());
                assertEquals("400001", result.getPincode());
                assertTrue(result.isVerified());
                assertEquals(LocalDateTime.of(2025, 1, 1, 0, 0), result.getCreatedAt());
                assertEquals(LocalDateTime.of(2025, 6, 1, 0, 0), result.getUpdatedAt());
        }

        @Test
        void toMedicineResponse_shouldMapAllFields() {
                MedicineResponse result = DtoMapper.toMedicineResponse(testMedicine);

                assertEquals(1L, result.getId());
                assertEquals("Paracetamol", result.getMedicineName());
                assertEquals("Cipla", result.getManufacturer());
                assertEquals("Analgesic", result.getCategory());
                assertEquals("500mg", result.getDosage());
                assertEquals("Pain reliever", result.getDescription());
                assertFalse(result.isRequiresPrescription());
        }

        @Test
        void toDonationResponse_shouldMapAllFields() {
                MedicineDonation donation = MedicineDonation.builder()
                                .id(1L).donor(testUser).medicine(testMedicine)
                                .quantity(10).batchNumber("BATCH001")
                                .manufactureDate(LocalDate.of(2025, 1, 1))
                                .expiryDate(LocalDate.of(2026, 1, 1))
                                .condition("Good").status(DonationStatus.PENDING)
                                .remarks("Test remarks").city("Mumbai")
                                .state("Maharashtra").pincode("400001")
                                .build();

                List<String> imageUrls = List.of("/uploads/img1.jpg", "/uploads/img2.jpg");

                DonationResponse result = DtoMapper.toDonationResponse(donation, imageUrls);

                assertEquals(1L, result.getId());
                assertEquals(1L, result.getDonorId());
                assertEquals("Test User", result.getDonorName());
                assertEquals(1L, result.getMedicineId());
                assertEquals("Paracetamol", result.getMedicineName());
                assertEquals("Analgesic", result.getMedicineCategory());
                assertEquals("500mg", result.getMedicineDosage());
                assertEquals(10, result.getQuantity());
                assertEquals("BATCH001", result.getBatchNumber());
                assertEquals(DonationStatus.PENDING, result.getStatus());
                assertEquals("Test remarks", result.getRemarks());
                assertEquals("Mumbai", result.getCity());
                assertEquals(2, result.getImageUrls().size());
        }

        @Test
        void toDonationResponse_shouldHandleNullImageUrls() {
                MedicineDonation donation = MedicineDonation.builder()
                                .id(1L).donor(testUser).medicine(testMedicine)
                                .quantity(10).status(DonationStatus.PENDING)
                                .build();

                DonationResponse result = DtoMapper.toDonationResponse(donation, null);

                assertNotNull(result.getImageUrls());
                assertTrue(result.getImageUrls().isEmpty());
        }

        @Test
        void toVerificationResponse_shouldMapAllFields() {
                User verifier = User.builder().id(2L).name("Pharmacy User")
                                .role(pharmacyRole).build();

                MedicineDonation donation = MedicineDonation.builder()
                                .id(1L).donor(testUser).medicine(testMedicine)
                                .quantity(10).status(DonationStatus.APPROVED)
                                .build();

                Verification verification = Verification.builder()
                                .id(1L).donation(donation).verifiedBy(verifier)
                                .verificationDate(LocalDateTime.of(2025, 6, 1, 12, 0))
                                .result(VerificationResult.APPROVED)
                                .remarks("Good quality")
                                .build();

                VerificationResponse result = DtoMapper.toVerificationResponse(verification);

                assertEquals(1L, result.getId());
                assertEquals(1L, result.getDonationId());
                assertEquals(2L, result.getVerifiedById());
                assertEquals("Pharmacy User", result.getVerifiedByName());
                assertEquals(VerificationResult.APPROVED, result.getResult());
                assertEquals("Good quality", result.getRemarks());
        }

        @Test
        void toInventoryResponse_shouldMapAllFields() {
                Inventory inventory = Inventory.builder()
                                .id(1L).medicine(testMedicine)
                                .availableQuantity(100).reservedQuantity(20)
                                .distributedQuantity(50).expiredQuantity(5)
                                .updatedAt(LocalDateTime.of(2025, 6, 1, 12, 0))
                                .build();

                InventoryResponse result = DtoMapper.toInventoryResponse(inventory);

                assertEquals(1L, result.getId());
                assertEquals(1L, result.getMedicineId());
                assertEquals("Paracetamol", result.getMedicineName());
                assertEquals(100, result.getAvailableQuantity());
                assertEquals(20, result.getReservedQuantity());
                assertEquals(50, result.getDistributedQuantity());
                assertEquals(5, result.getExpiredQuantity());
        }

        @Test
        void toMedicineRequestResponse_shouldMapAllFields() {
                User approver = User.builder().id(2L).name("Approver")
                                .role(pharmacyRole).build();

                MedicineRequest request = MedicineRequest.builder()
                                .id(1L).recipient(testUser).medicine(testMedicine)
                                .requestedQuantity(5)
                                .status(RequestStatus.COMPLETED)
                                .approvedBy(approver)
                                .createdAt(LocalDateTime.of(2025, 6, 1, 12, 0))
                                .build();

                MedicineRequestResponse result = DtoMapper.toMedicineRequestResponse(request);

                assertEquals(1L, result.getId());
                assertEquals(1L, result.getRecipientId());
                assertEquals("Test User", result.getRecipientName());
                assertEquals(1L, result.getMedicineId());
                assertEquals("Paracetamol", result.getMedicineName());
                assertEquals(5, result.getRequestedQuantity());
                assertEquals(RequestStatus.COMPLETED, result.getStatus());
                assertEquals(2L, result.getApprovedById());
                assertEquals("Approver", result.getApprovedByName());
        }

        @Test
        void toMedicineRequestResponse_shouldHandleNullApprover() {
                MedicineRequest request = MedicineRequest.builder()
                                .id(1L).recipient(testUser).medicine(testMedicine)
                                .requestedQuantity(5).status(RequestStatus.PENDING)
                                .build();

                MedicineRequestResponse result = DtoMapper.toMedicineRequestResponse(request);

                assertNull(result.getApprovedById());
                assertNull(result.getApprovedByName());
        }

        @Test
        void toMedicineRequestResponse_shouldHandleNullPrescription() {
                MedicineRequest request = MedicineRequest.builder()
                                .id(1L).recipient(testUser).medicine(testMedicine)
                                .requestedQuantity(5).status(RequestStatus.PENDING)
                                .build();

                MedicineRequestResponse result = DtoMapper.toMedicineRequestResponse(request);

                assertNull(result.getPrescriptionId());
        }

        @Test
        void toNotificationResponse_shouldMapAllFields() {
                Notification notification = Notification.builder()
                                .id(1L).user(testUser).title("Test")
                                .message("Test message").type("DONATION")
                                .isRead(false)
                                .createdAt(LocalDateTime.of(2025, 6, 1, 12, 0))
                                .build();

                NotificationResponse result = DtoMapper.toNotificationResponse(notification);

                assertEquals(1L, result.getId());
                assertEquals("Test", result.getTitle());
                assertEquals("Test message", result.getMessage());
                assertEquals("DONATION", result.getType());
                assertFalse(result.isRead());
        }

        @Test
        void toAuditLogResponse_shouldMapAllFields() {
                AuditLog log = AuditLog.builder()
                                .id(1L).user(testUser).action("USER_REGISTERED")
                                .entityName("User").entityId(1L)
                                .timestamp(LocalDateTime.of(2025, 6, 1, 12, 0))
                                .build();

                AuditLogResponse result = DtoMapper.toAuditLogResponse(log);

                assertEquals(1L, result.getId());
                assertEquals(1L, result.getUserId());
                assertEquals("Test User", result.getUserName());
                assertEquals("USER_REGISTERED", result.getAction());
                assertEquals("User", result.getEntityName());
                assertEquals(1L, result.getEntityId());
        }

        @Test
        void toAuditLogResponse_shouldHandleNullUser() {
                AuditLog log = AuditLog.builder()
                                .id(1L).user(null).action("SYSTEM_ACTION")
                                .entityName("System").entityId(0L)
                                .build();

                AuditLogResponse result = DtoMapper.toAuditLogResponse(log);

                assertNull(result.getUserId());
                assertNull(result.getUserName());
        }
}
