package com.medicycle.service;

import com.medicycle.dto.request.AdminQueryRequest;
import com.medicycle.dto.response.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;

@Service
@RequiredArgsConstructor
public class AdminSmartQueryService {
    private final AdminService adminService;

    @Transactional(readOnly = true)
    public AdminQueryResponse answer(AdminQueryRequest request) {
        String query = request.getQuery().trim();
        String normalized = query.toLowerCase(Locale.ROOT);
        AdminOverviewResponse overview = adminService.getOverview(null);
        var donations = overview.getAllDonations();
        var requests = overview.getAllRequests();
        var medicines = overview.getAllMedicines();

        if (normalized.contains("pending") && normalized.contains("donation")) {
            donations = donations.stream().filter(d -> "PENDING".equals(d.getStatus().name())).toList();
        } else if (normalized.contains("approved") && normalized.contains("donation")) {
            donations = donations.stream().filter(d -> "APPROVED".equals(d.getStatus().name())).toList();
        } else if (normalized.contains("request")) {
            if (normalized.contains("pending")) requests = requests.stream().filter(r -> "PENDING".equals(r.getStatus().name())).toList();
            if (normalized.contains("completed")) requests = requests.stream().filter(r -> "COMPLETED".equals(r.getStatus().name())).toList();
            if (normalized.contains("rejected")) requests = requests.stream().filter(r -> "REJECTED".equals(r.getStatus().name())).toList();
        } else if (normalized.contains("medicine")) {
            String term = normalized.replace("medicine", "").replace("medicines", "").trim();
            if (!term.isBlank()) medicines = medicines.stream()
                    .filter(m -> m.getMedicineName() != null && m.getMedicineName().toLowerCase(Locale.ROOT).contains(term))
                    .toList();
        }
        return AdminQueryResponse.builder()
                .interpretation("Applied supported filters to the current admin overview: " + query)
                .donations(donations)
                .requests(requests)
                .medicines(medicines)
                .build();
    }
}
