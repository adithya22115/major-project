package com.medicycle.service;

import com.medicycle.dto.response.AuditLogResponse;
import com.medicycle.dto.response.DashboardResponse;
import com.medicycle.enums.DonationStatus;
import com.medicycle.enums.RequestStatus;
import com.medicycle.enums.RoleType;
import com.medicycle.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;
    private final MedicineRepository medicineRepository;
    private final MedicineDonationRepository donationRepository;
    private final MedicineRequestRepository requestRepository;
    private final InventoryRepository inventoryRepository;
    private final NotificationRepository notificationRepository;
    private final AuditLogRepository auditLogRepository;

    @Transactional(readOnly = true)
    public DashboardResponse getDashboard() {
        long totalUsers = userRepository.count();
        long totalDonors = userRepository.findAll().stream()
                .filter(u -> u.getRole().getRoleName() == RoleType.DONOR).count();
        long totalRecipients = userRepository.findAll().stream()
                .filter(u -> u.getRole().getRoleName() == RoleType.RECIPIENT).count();
        long totalPharmacies = userRepository.findAll().stream()
                .filter(u -> u.getRole().getRoleName() == RoleType.PHARMACY).count();
        long totalMedicines = medicineRepository.count();
        long pendingDonations = donationRepository.findByStatus(DonationStatus.PENDING).size();
        long approvedDonations = donationRepository.findByStatus(DonationStatus.APPROVED).size();
        long pendingRequests = requestRepository.findByStatus(RequestStatus.PENDING).size();
        long completedRequests = requestRepository.findByStatus(RequestStatus.COMPLETED).size();
        long totalInventoryItems = inventoryRepository.count();

        List<AuditLogResponse> recentLogs = auditLogRepository.findTop50ByOrderByTimestampDesc().stream()
                .map(DtoMapper::toAuditLogResponse)
                .toList();

        return DashboardResponse.builder()
                .totalUsers(totalUsers)
                .totalDonors(totalDonors)
                .totalRecipients(totalRecipients)
                .totalPharmacies(totalPharmacies)
                .totalMedicines(totalMedicines)
                .pendingDonations(pendingDonations)
                .approvedDonations(approvedDonations)
                .pendingRequests(pendingRequests)
                .completedRequests(completedRequests)
                .totalInventoryItems(totalInventoryItems)
                .unreadNotifications(notificationRepository.count())
                .recentAuditLogs(recentLogs)
                .build();
    }
}
