package com.medicycle.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DashboardResponse {
    private long totalUsers;
    private long totalDonors;
    private long totalRecipients;
    private long totalPharmacies;
    private long totalMedicines;
    private long pendingDonations;
    private long approvedDonations;
    private long pendingRequests;
    private long completedRequests;
    private long totalInventoryItems;
    private long unreadNotifications;
    private List<AuditLogResponse> recentAuditLogs;
}
