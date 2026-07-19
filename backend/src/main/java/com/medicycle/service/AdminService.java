package com.medicycle.service;

import com.medicycle.dto.response.*;
import com.medicycle.entity.User;
import com.medicycle.enums.*;
import com.medicycle.exception.ResourceNotFoundException;
import com.medicycle.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

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
    private final PrescriptionRepository prescriptionRepository;
    private final AuditService auditService;

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

    @Transactional(readOnly = true)
    public AdminOverviewResponse getOverview(String cityFilter) {
        List<User> allUsers = userRepository.findByOrderByIdDesc();

        long totalDonors = allUsers.stream().filter(u -> u.getRole().getRoleName() == RoleType.DONOR).count();
        long totalRecipients = allUsers.stream().filter(u -> u.getRole().getRoleName() == RoleType.RECIPIENT).count();
        long totalPharmacies = allUsers.stream().filter(u -> u.getRole().getRoleName() == RoleType.PHARMACY).count();
        long totalAdmins = allUsers.stream().filter(u -> u.getRole().getRoleName() == RoleType.ADMIN).count();
        long verifiedPharmacies = allUsers.stream()
                .filter(u -> u.getRole().getRoleName() == RoleType.PHARMACY && u.isVerified()).count();
        long unverifiedPharmacies = totalPharmacies - verifiedPharmacies;

        List<com.medicycle.entity.MedicineDonation> allDonations = donationRepository.findAll();
        List<DonationResponse> allDonationResponses = allDonations.stream()
                .map(d -> DtoMapper.toDonationResponse(d, List.of()))
                .toList();

        long pendingDonations = allDonations.stream().filter(d -> d.getStatus() == DonationStatus.PENDING).count();
        long approvedDonations = allDonations.stream().filter(d -> d.getStatus() == DonationStatus.APPROVED).count();
        long rejectedDonations = allDonations.stream().filter(d -> d.getStatus() == DonationStatus.REJECTED).count();
        long totalDonationQuantity = allDonations.stream().mapToInt(d -> d.getQuantity()).sum();

        List<com.medicycle.entity.MedicineRequest> allRequests = requestRepository.findAll();
        List<MedicineRequestResponse> allRequestResponses = allRequests.stream()
                .map(DtoMapper::toMedicineRequestResponse)
                .toList();

        long pendingRequests = allRequests.stream().filter(r -> r.getStatus() == RequestStatus.PENDING).count();
        long approvedRequests = allRequests.stream().filter(r -> r.getStatus() == RequestStatus.APPROVED).count();
        long completedRequests = allRequests.stream().filter(r -> r.getStatus() == RequestStatus.COMPLETED).count();
        long rejectedRequests = allRequests.stream().filter(r -> r.getStatus() == RequestStatus.REJECTED).count();

        long totalPrescriptions = prescriptionRepository.count();
        long totalMedicines = medicineRepository.count();
        long totalInventoryItems = inventoryRepository.count();

        List<UserResponse> userResponses = allUsers.stream()
                .map(DtoMapper::toUserResponse)
                .toList();

        List<MedicineResponse> allMedicineResponses = medicineRepository.findAll().stream()
                .map(DtoMapper::toMedicineResponse)
                .toList();

        List<AdminOverviewResponse.CityMedicineStat> cityStats = buildCityStats(allDonations, allRequests, allUsers, cityFilter);

        List<AuditLogResponse> recentLogs = auditLogRepository.findTop50ByOrderByTimestampDesc().stream()
                .map(DtoMapper::toAuditLogResponse)
                .toList();

        return AdminOverviewResponse.builder()
                .totalUsers(allUsers.size())
                .totalDonors(totalDonors)
                .totalRecipients(totalRecipients)
                .totalPharmacies(totalPharmacies)
                .totalAdmins(totalAdmins)
                .verifiedPharmacies(verifiedPharmacies)
                .unverifiedPharmacies(unverifiedPharmacies)
                .totalMedicines(totalMedicines)
                .totalDonations(allDonations.size())
                .pendingDonations(pendingDonations)
                .approvedDonations(approvedDonations)
                .rejectedDonations(rejectedDonations)
                .totalDonationQuantity(totalDonationQuantity)
                .totalRequests(allRequests.size())
                .pendingRequests(pendingRequests)
                .approvedRequests(approvedRequests)
                .completedRequests(completedRequests)
                .rejectedRequests(rejectedRequests)
                .totalPrescriptions(totalPrescriptions)
                .totalInventoryItems(totalInventoryItems)
                .allUsers(userResponses)
                .allDonations(allDonationResponses)
                .allRequests(allRequestResponses)
                .allMedicines(allMedicineResponses)
                .cityStats(cityStats)
                .recentAuditLogs(recentLogs)
                .build();
    }

    @Transactional(readOnly = true)
    public List<UserResponse> getAllUsers() {
        return userRepository.findByOrderByIdDesc().stream()
                .map(DtoMapper::toUserResponse)
                .toList();
    }

    @Transactional
    public UserResponse updateUserStatus(Long userId, boolean verified) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));
        user.setVerified(verified);
        user = userRepository.save(user);
        auditService.log(user, verified ? "USER_VERIFIED" : "USER_SUSPENDED", "User", user.getId());
        return DtoMapper.toUserResponse(user);
    }

    private List<AdminOverviewResponse.CityMedicineStat> buildCityStats(
            List<com.medicycle.entity.MedicineDonation> allDonations,
            List<com.medicycle.entity.MedicineRequest> allRequests,
            List<User> allUsers, String cityFilter) {

        Map<String, List<com.medicycle.entity.MedicineDonation>> donationsByCity = allDonations.stream()
                .filter(d -> d.getCity() != null && !d.getCity().isBlank())
                .filter(d -> cityFilter == null || cityFilter.isBlank() || d.getCity().equalsIgnoreCase(cityFilter))
                .collect(Collectors.groupingBy(d -> d.getCity().toLowerCase()));

        Map<String, List<com.medicycle.entity.MedicineRequest>> requestsByCity = allRequests.stream()
                .collect(Collectors.groupingBy(r -> {
                    User recip = r.getRecipient();
                    return recip.getCity() != null ? recip.getCity().toLowerCase() : "unknown";
                }));

        Map<String, List<User>> usersByCity = allUsers.stream()
                .filter(u -> u.getCity() != null && !u.getCity().isBlank())
                .filter(u -> cityFilter == null || cityFilter.isBlank() || u.getCity().equalsIgnoreCase(cityFilter))
                .collect(Collectors.groupingBy(u -> u.getCity().toLowerCase()));

        Set<String> allCities = new LinkedHashSet<>();
        allCities.addAll(donationsByCity.keySet());
        allCities.addAll(requestsByCity.keySet());
        allCities.addAll(usersByCity.keySet());

        List<AdminOverviewResponse.CityMedicineStat> stats = new ArrayList<>();

        for (String cityKey : allCities) {
            List<com.medicycle.entity.MedicineDonation> cityDonations = donationsByCity.getOrDefault(cityKey, List.of());
            List<com.medicycle.entity.MedicineRequest> cityRequests = requestsByCity.getOrDefault(cityKey, List.of());
            List<User> cityUsers = usersByCity.getOrDefault(cityKey, List.of());

            long pharmacyCount = cityUsers.stream()
                    .filter(u -> u.getRole().getRoleName() == RoleType.PHARMACY).count();
            long totalQty = cityDonations.stream().mapToInt(d -> d.getQuantity()).sum();

            Map<Long, AdminOverviewResponse.MedicineInCity> medicineMap = new LinkedHashMap<>();
            for (com.medicycle.entity.MedicineDonation d : cityDonations) {
                Long medId = d.getMedicine().getId();
                medicineMap.merge(medId, AdminOverviewResponse.MedicineInCity.builder()
                        .medicineId(medId)
                        .medicineName(d.getMedicine().getMedicineName())
                        .category(d.getMedicine().getCategory())
                        .availableQuantity(d.getQuantity())
                        .donationCount(1)
                        .build(),
                        (existing, incoming) -> {
                            existing.setAvailableQuantity(existing.getAvailableQuantity() + incoming.getAvailableQuantity());
                            existing.setDonationCount(existing.getDonationCount() + 1);
                            return existing;
                        });
            }

            String displayName = cityUsers.stream().map(User::getCity).filter(Objects::nonNull).findFirst()
                    .orElse(cityDonations.stream().map(d -> d.getCity()).filter(Objects::nonNull).findFirst()
                            .orElse(cityKey));
            String stateVal = cityUsers.stream().map(User::getState).filter(Objects::nonNull).findFirst()
                    .orElse(cityDonations.stream().map(d -> d.getState()).filter(Objects::nonNull).findFirst()
                            .orElse(null));

            stats.add(AdminOverviewResponse.CityMedicineStat.builder()
                    .city(displayName)
                    .state(stateVal)
                    .donationCount(cityDonations.size())
                    .totalQuantity(totalQty)
                    .requestCount(cityRequests.size())
                    .userCount(cityUsers.size())
                    .pharmacyCount(pharmacyCount)
                    .medicines(new ArrayList<>(medicineMap.values()))
                    .build());
        }

        stats.sort(Comparator.comparingLong(AdminOverviewResponse.CityMedicineStat::getDonationCount).reversed());

        return stats;
    }
}
