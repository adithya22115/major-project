package com.medicycle.service;

import com.medicycle.dto.request.DonationRequest;
import com.medicycle.dto.response.DonationResponse;
import com.medicycle.dto.response.NearestLocationResponse;
import com.medicycle.entity.Medicine;
import com.medicycle.entity.MedicineDonation;
import com.medicycle.entity.MedicineImage;
import com.medicycle.entity.User;
import com.medicycle.enums.DonationStatus;
import com.medicycle.enums.RoleType;
import com.medicycle.exception.ResourceNotFoundException;
import com.medicycle.repository.MedicineDonationRepository;
import com.medicycle.repository.MedicineImageRepository;
import com.medicycle.repository.MedicineRepository;
import com.medicycle.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class DonationService {

    private final MedicineDonationRepository donationRepository;
    private final MedicineRepository medicineRepository;
    private final UserRepository userRepository;
    private final MedicineImageRepository imageRepository;
    private final NotificationService notificationService;
    private final AuditService auditService;

    @Transactional
    public DonationResponse createDonation(DonationRequest request, Long donorId) {
        User donor = userRepository.findById(donorId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + donorId));

        Medicine medicine;
        if (request.getMedicineId() != null) {
            medicine = medicineRepository.findById(request.getMedicineId())
                    .orElseThrow(() -> new ResourceNotFoundException("Medicine not found: " + request.getMedicineId()));
        } else if (request.getMedicineName() != null && !request.getMedicineName().isBlank()) {
            medicine = medicineRepository.findByMedicineNameContainingIgnoreCase(request.getMedicineName().trim())
                    .stream()
                    .filter(m -> equalIgnoreCase(m.getManufacturer(), request.getManufacturer()))
                    .filter(m -> equalIgnoreCase(m.getCategory(), request.getCategory()))
                    .filter(m -> equalIgnoreCase(m.getDosage(), request.getDosage()))
                    .findFirst()
                    .orElseGet(() -> {
                        Medicine newMed = Medicine.builder()
                                .medicineName(request.getMedicineName().trim())
                                .manufacturer(request.getManufacturer())
                                .category(request.getCategory())
                                .dosage(request.getDosage())
                                .description(request.getDescription())
                                .requiresPrescription(request.isRequiresPrescription())
                                .build();
                        return medicineRepository.save(newMed);
                    });
        } else {
            throw new IllegalArgumentException("Medicine ID or Medicine Name is required");
        }

        MedicineDonation donation = MedicineDonation.builder()
                .donor(donor)
                .medicine(medicine)
                .quantity(request.getQuantity())
                .batchNumber(request.getBatchNumber())
                .manufactureDate(request.getManufactureDate())
                .expiryDate(request.getExpiryDate())
                .condition(request.getCondition())
                .status(DonationStatus.PENDING)
                .remarks(request.getRemarks())
                .city(donor.getCity())
                .state(donor.getState())
                .pincode(donor.getPincode())
                .latitude(donor.getLatitude())
                .longitude(donor.getLongitude())
                .build();

        donation = donationRepository.save(donation);

        List<String> imageUrls = new ArrayList<>();
        if (request.getImageUrls() != null) {
            for (String url : request.getImageUrls()) {
                MedicineImage image = MedicineImage.builder()
                        .donation(donation)
                        .imageUrl(url)
                        .imageType("DONATION")
                        .build();
                imageRepository.save(image);
                imageUrls.add(url);
            }
        }

        notificationService.createNotification(
                donor,
                "Donation Submitted",
                "Your donation of " + medicine.getMedicineName() + " has been submitted and is pending review.",
                "DONATION");

        notifyPharmacies(donation, medicine);

        auditService.log(donor, "DONATION_CREATED", "MedicineDonation", donation.getId());

        return DtoMapper.toDonationResponse(donation, imageUrls);
    }

    private void notifyPharmacies(MedicineDonation donation, Medicine medicine) {
        List<User> pharmacyUsers = new ArrayList<>(userRepository.findByRole_RoleName(RoleType.PHARMACY));
        pharmacyUsers.addAll(userRepository.findByRole_RoleName(RoleType.ADMIN));
        pharmacyUsers.forEach(pharmacy -> notificationService.createNotification(
                pharmacy,
                "New Donation Pending",
                "A new donation of " + medicine.getMedicineName() + " (qty: " + donation.getQuantity() + ") requires verification.",
                "VERIFICATION"));
    }

    @Transactional(readOnly = true)
    public List<DonationResponse> getAllDonations() {
        return donationRepository.findAll().stream()
                .map(d -> DtoMapper.toDonationResponse(d, getImageUrls(d.getId())))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<DonationResponse> getDonationsByDonor(Long donorId) {
        return donationRepository.findByDonorId(donorId).stream()
                .map(d -> DtoMapper.toDonationResponse(d, getImageUrls(d.getId())))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<DonationResponse> getAvailableDonationsByCity(String city) {
        return donationRepository.findByStatusAndCityIgnoreCase(DonationStatus.APPROVED, city).stream()
                .map(d -> DtoMapper.toDonationResponse(d, getImageUrls(d.getId())))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<DonationResponse> getAvailableDonationsByState(String state) {
        return donationRepository.findByStatusAndStateIgnoreCase(DonationStatus.APPROVED, state).stream()
                .map(d -> DtoMapper.toDonationResponse(d, getImageUrls(d.getId())))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<DonationResponse> getAllAvailableDonations() {
        return donationRepository.findByStatus(DonationStatus.APPROVED).stream()
                .map(d -> DtoMapper.toDonationResponse(d, getImageUrls(d.getId())))
                .toList();
    }

    @Transactional(readOnly = true)
    public DonationResponse getDonationById(Long id) {
        MedicineDonation donation = donationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Donation not found: " + id));
        return DtoMapper.toDonationResponse(donation, getImageUrls(id));
    }

    @Transactional(readOnly = true)
    public NearestLocationResponse findNearestLocations(Long medicineId, Double latitude, Double longitude, String city, String state) {
        Medicine medicine = medicineRepository.findById(medicineId)
                .orElseThrow(() -> new ResourceNotFoundException("Medicine not found: " + medicineId));

        boolean availableInCity = false;
        if (city != null && !city.isBlank()) {
            availableInCity = donationRepository.findByStatusAndCityIgnoreCase(DonationStatus.APPROVED, city)
                    .stream().anyMatch(d -> d.getMedicine().getId().equals(medicineId));
        }

        List<MedicineDonation> allApproved = donationRepository.findByStatus(DonationStatus.APPROVED)
                .stream()
                .filter(d -> d.getMedicine().getId().equals(medicineId))
                .filter(d -> d.getLatitude() != null && d.getLongitude() != null)
                .toList();

        Map<String, NearestLocationResponse.LocationAvailability> locationMap = new LinkedHashMap<>();
        for (MedicineDonation d : allApproved) {
            String locCity = d.getCity();
            if (locCity == null || locCity.isBlank()) continue;

            double distance = 0;
            if (latitude != null && longitude != null) {
                distance = haversineDistance(latitude, longitude, d.getLatitude(), d.getLongitude());
            }

            String directionsUrl;
            if (latitude != null && longitude != null) {
                directionsUrl = buildDirectionsUrl(
                        latitude + "," + longitude,
                        d.getLatitude() + "," + d.getLongitude());
            } else {
                directionsUrl = buildDirectionsUrl(
                        (city != null ? city + " " + state : ""),
                        d.getCity() + " " + d.getState() + " " + d.getPincode());
            }

            String key = locCity.toLowerCase() + "|" + (d.getState() != null ? d.getState().toLowerCase() : "");
            locationMap.merge(key, NearestLocationResponse.LocationAvailability.builder()
                    .city(d.getCity())
                    .state(d.getState())
                    .pincode(d.getPincode())
                    .latitude(d.getLatitude())
                    .longitude(d.getLongitude())
                    .distanceKm(Math.round(distance * 10.0) / 10.0)
                    .availableQuantity(d.getQuantity())
                    .donationCount(1)
                    .directionsUrl(directionsUrl)
                    .build(),
                    (existing, incoming) -> {
                        existing.setAvailableQuantity(existing.getAvailableQuantity() + incoming.getAvailableQuantity());
                        existing.setDonationCount(existing.getDonationCount() + 1);
                        return existing;
                    });
        }

        List<NearestLocationResponse.LocationAvailability> sorted = new ArrayList<>(locationMap.values());
        if (latitude != null && longitude != null) {
            sorted.sort((a, b) -> Double.compare(a.getDistanceKm(), b.getDistanceKm()));
        }

        return NearestLocationResponse.builder()
                .medicineId(medicineId)
                .medicineName(medicine.getMedicineName())
                .requestedCity(city)
                .availableInCity(availableInCity)
                .nearestLocations(sorted)
                .build();
    }

    private double haversineDistance(double lat1, double lon1, double lat2, double lon2) {
        final double R = 6371;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    private String buildDirectionsUrl(String origin, String destination) {
        try {
            String encodedOrigin = URLEncoder.encode(origin.trim(), StandardCharsets.UTF_8);
            String encodedDest = URLEncoder.encode(destination.trim(), StandardCharsets.UTF_8);
            return "https://www.google.com/maps/dir/?api=1&origin=" + encodedOrigin + "&destination=" + encodedDest + "&travelmode=driving";
        } catch (Exception e) {
            return "#";
        }
    }

    private List<String> getImageUrls(Long donationId) {
        return imageRepository.findByDonationId(donationId).stream()
                .map(MedicineImage::getImageUrl)
                .toList();
    }

    private boolean equalIgnoreCase(String a, String b) {
        if (a == null && b == null) return true;
        if (a == null || b == null) return false;
        return a.trim().equalsIgnoreCase(b.trim());
    }
}
