package com.medicycle.controller;

import com.medicycle.dto.request.MedicineRequestDto;
import com.medicycle.dto.request.RequestStatusUpdate;
import com.medicycle.dto.response.MedicineRequestResponse;
import com.medicycle.enums.RoleType;
import com.medicycle.security.UserPrincipal;
import com.medicycle.service.FileStorageService;
import com.medicycle.service.MedicineRequestService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import org.springframework.data.domain.PageRequest;
import com.medicycle.dto.response.PagedResponse;

@RestController
@RequestMapping("/api/requests")
@RequiredArgsConstructor
public class MedicineRequestController {

    private final MedicineRequestService medicineRequestService;
    private final FileStorageService fileStorageService;

    @PostMapping(consumes = {"multipart/form-data"})
    public ResponseEntity<MedicineRequestResponse> createRequest(
            @RequestParam("medicineId") Long medicineId,
            @RequestParam("requestedQuantity") Integer requestedQuantity,
            @RequestParam(value = "prescription", required = false) MultipartFile prescription,
            @AuthenticationPrincipal UserPrincipal principal) {

        MedicineRequestDto dto = new MedicineRequestDto();
        dto.setMedicineId(medicineId);
        dto.setRequestedQuantity(requestedQuantity);

        if (prescription != null && !prescription.isEmpty()) {
            String url = fileStorageService.storeFile(prescription, "prescriptions");
            dto.setPrescriptionFileUrl(url);
        }

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(medicineRequestService.createRequest(dto, principal.getId()));
    }

    @GetMapping
    public ResponseEntity<List<MedicineRequestResponse>> getRequests(
            @AuthenticationPrincipal UserPrincipal principal) {
        RoleType role = principal.getUser().getRole().getRoleName();
        if (role == RoleType.RECIPIENT) {
            return ResponseEntity.ok(medicineRequestService.getRequestsByRecipient(principal.getId()));
        }
        return ResponseEntity.ok(medicineRequestService.getAllRequests());
    }

    @GetMapping("/page")
    public ResponseEntity<PagedResponse<MedicineRequestResponse>> getRequestsPage(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @AuthenticationPrincipal UserPrincipal principal) {
        RoleType role = principal.getUser().getRole().getRoleName();
        return ResponseEntity.ok(medicineRequestService.getRequestsPage(
                role == RoleType.RECIPIENT ? principal.getId() : null,
                PageRequest.of(Math.max(0, page), Math.min(Math.max(1, size), 100))));
    }

    @PutMapping("/{id}")
    @PreAuthorize("@userSecurity.isVerifiedPharmacy(authentication)")
    public ResponseEntity<MedicineRequestResponse> updateRequestStatus(
            @PathVariable Long id,
            @Valid @RequestBody RequestStatusUpdate update,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(medicineRequestService.updateRequestStatus(id, update, principal.getId()));
    }
}
