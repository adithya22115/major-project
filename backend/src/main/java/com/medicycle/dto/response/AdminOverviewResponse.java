package com.medicycle.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminOverviewResponse {

    private long totalUsers;
    private long totalDonors;
    private long totalRecipients;
    private long totalPharmacies;
    private long totalAdmins;
    private long verifiedPharmacies;
    private long unverifiedPharmacies;

    private long totalMedicines;
    private long totalDonations;
    private long pendingDonations;
    private long approvedDonations;
    private long rejectedDonations;
    private long totalDonationQuantity;

    private long totalRequests;
    private long pendingRequests;
    private long approvedRequests;
    private long completedRequests;
    private long rejectedRequests;

    private long totalPrescriptions;
    private long totalInventoryItems;

    private List<UserResponse> allUsers;
    private List<DonationResponse> allDonations;
    private List<MedicineRequestResponse> allRequests;
    private List<MedicineResponse> allMedicines;

    private List<CityMedicineStat> cityStats;
    private List<AuditLogResponse> recentAuditLogs;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CityMedicineStat {
        private String city;
        private String state;
        private long donationCount;
        private long totalQuantity;
        private long requestCount;
        private long userCount;
        private long pharmacyCount;
        private List<MedicineInCity> medicines;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class MedicineInCity {
        private Long medicineId;
        private String medicineName;
        private String category;
        private long availableQuantity;
        private long donationCount;
    }
}
