package com.medicycle.service;

import com.medicycle.dto.request.DonationRequest;
import com.medicycle.dto.response.DonationResponse;
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

import java.util.ArrayList;
import java.util.List;

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

        Medicine medicine = medicineRepository.findById(request.getMedicineId())
                .orElseThrow(() -> new ResourceNotFoundException("Medicine not found: " + request.getMedicineId()));

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
        userRepository.findAll().stream()
                .filter(u -> u.getRole().getRoleName() == RoleType.PHARMACY || u.getRole().getRoleName() == RoleType.ADMIN)
                .forEach(pharmacy -> notificationService.createNotification(
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
    public DonationResponse getDonationById(Long id) {
        MedicineDonation donation = donationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Donation not found: " + id));
        return DtoMapper.toDonationResponse(donation, getImageUrls(id));
    }

    private List<String> getImageUrls(Long donationId) {
        return imageRepository.findByDonationId(donationId).stream()
                .map(MedicineImage::getImageUrl)
                .toList();
    }
}
