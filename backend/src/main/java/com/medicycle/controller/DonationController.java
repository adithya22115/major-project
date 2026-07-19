package com.medicycle.controller;

import com.medicycle.dto.request.DonationRequest;
import com.medicycle.dto.response.DonationResponse;
import com.medicycle.dto.response.NearestLocationResponse;
import com.medicycle.enums.RoleType;
import com.medicycle.security.UserPrincipal;
import com.medicycle.service.DonationService;
import com.medicycle.service.FileStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/donations")
@RequiredArgsConstructor
public class DonationController {

    private final DonationService donationService;
    private final FileStorageService fileStorageService;

    @PostMapping(consumes = {"multipart/form-data"})
    public ResponseEntity<DonationResponse> createDonation(
            @RequestParam("medicineName") String medicineName,
            @RequestParam(value = "manufacturer", required = false) String manufacturer,
            @RequestParam(value = "category", required = false) String category,
            @RequestParam(value = "dosage", required = false) String dosage,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam(value = "requiresPrescription", defaultValue = "false") boolean requiresPrescription,
            @RequestParam("quantity") Integer quantity,
            @RequestParam("batchNumber") String batchNumber,
            @RequestParam(value = "manufactureDate", required = false) String manufactureDate,
            @RequestParam("expiryDate") String expiryDate,
            @RequestParam(value = "condition", required = false) String condition,
            @RequestParam(value = "remarks", required = false) String remarks,
            @RequestParam(value = "images", required = false) MultipartFile[] images,
            @AuthenticationPrincipal UserPrincipal principal) {

        DonationRequest request = new DonationRequest();
        request.setMedicineName(medicineName);
        request.setManufacturer(manufacturer);
        request.setCategory(category);
        request.setDosage(dosage);
        request.setDescription(description);
        request.setRequiresPrescription(requiresPrescription);
        request.setQuantity(quantity);
        request.setBatchNumber(batchNumber);
        request.setManufactureDate(manufactureDate != null ? LocalDate.parse(manufactureDate) : null);
        request.setExpiryDate(expiryDate != null ? LocalDate.parse(expiryDate) : null);
        request.setCondition(condition);
        request.setRemarks(remarks);

        List<String> imageUrls = new ArrayList<>();
        if (images != null) {
            for (MultipartFile image : images) {
                if (!image.isEmpty()) {
                    imageUrls.add(fileStorageService.storeFile(image, "donations"));
                }
            }
        }
        request.setImageUrls(imageUrls);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(donationService.createDonation(request, principal.getId()));
    }

    @GetMapping
    public ResponseEntity<List<DonationResponse>> getDonations(
            @AuthenticationPrincipal UserPrincipal principal) {
        RoleType role = principal.getUser().getRole().getRoleName();
        if (role == RoleType.DONOR) {
            return ResponseEntity.ok(donationService.getDonationsByDonor(principal.getId()));
        }
        return ResponseEntity.ok(donationService.getAllDonations());
    }

    @GetMapping("/available")
    public ResponseEntity<List<DonationResponse>> getAvailableDonations(
            @RequestParam(value = "city", required = false) String city,
            @RequestParam(value = "state", required = false) String state) {
        if (city != null && !city.isBlank()) {
            return ResponseEntity.ok(donationService.getAvailableDonationsByCity(city));
        }
        if (state != null && !state.isBlank()) {
            return ResponseEntity.ok(donationService.getAvailableDonationsByState(state));
        }
        return ResponseEntity.ok(donationService.getAllAvailableDonations());
    }

    @GetMapping("/{id}")
    public ResponseEntity<DonationResponse> getDonation(@PathVariable Long id) {
        return ResponseEntity.ok(donationService.getDonationById(id));
    }

    @GetMapping("/nearest")
    public ResponseEntity<NearestLocationResponse> findNearestLocations(
            @RequestParam Long medicineId,
            @RequestParam(value = "latitude", required = false) Double latitude,
            @RequestParam(value = "longitude", required = false) Double longitude,
            @RequestParam(value = "city", required = false) String city,
            @RequestParam(value = "state", required = false) String state) {
        return ResponseEntity.ok(donationService.findNearestLocations(medicineId, latitude, longitude, city, state));
    }
}
