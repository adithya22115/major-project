package com.medicycle.controller;

import com.medicycle.dto.request.MedicineRequestDto;
import com.medicycle.dto.request.RequestStatusUpdate;
import com.medicycle.dto.response.MedicineRequestResponse;
import com.medicycle.enums.RoleType;
import com.medicycle.security.UserPrincipal;
import com.medicycle.service.MedicineRequestService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/requests")
@RequiredArgsConstructor
public class MedicineRequestController {

    private final MedicineRequestService medicineRequestService;

    @PostMapping
    public ResponseEntity<MedicineRequestResponse> createRequest(
            @Valid @RequestBody MedicineRequestDto request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(medicineRequestService.createRequest(request, principal.getId()));
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

    @PutMapping("/{id}")
    public ResponseEntity<MedicineRequestResponse> updateRequestStatus(
            @PathVariable Long id,
            @Valid @RequestBody RequestStatusUpdate update,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(medicineRequestService.updateRequestStatus(id, update, principal.getId()));
    }
}
