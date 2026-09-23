package com.medicycle.controller;

import com.medicycle.dto.request.DoctorVerificationRequest;
import com.medicycle.dto.response.DoctorVerificationResponse;
import com.medicycle.enums.VerificationStatus;
import com.medicycle.security.UserPrincipal;
import com.medicycle.service.DoctorVerificationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/doctor-verification")
@RequiredArgsConstructor
public class DoctorVerificationController {

    private final DoctorVerificationService verificationService;

    @PostMapping
    public ResponseEntity<DoctorVerificationResponse> submitVerification(
            @Valid @RequestBody DoctorVerificationRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(verificationService.submitVerification(request, principal.getId()));
    }

    @GetMapping("/me")
    public ResponseEntity<DoctorVerificationResponse> getMyVerification(
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(verificationService.getMyVerification(principal.getId()));
    }

    @GetMapping("/admin/pending")
    public ResponseEntity<List<DoctorVerificationResponse>> getPendingVerifications() {
        return ResponseEntity.ok(verificationService.getAllPending());
    }

    @GetMapping("/admin/all")
    public ResponseEntity<List<DoctorVerificationResponse>> getAllByStatus(
            @RequestParam VerificationStatus status) {
        return ResponseEntity.ok(verificationService.getAllByStatus(status));
    }

    @PutMapping("/admin/{id}/approve")
    public ResponseEntity<DoctorVerificationResponse> approveVerification(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> body,
            @AuthenticationPrincipal UserPrincipal principal) {
        String remarks = body != null ? body.get("remarks") : null;
        return ResponseEntity.ok(verificationService.approveVerification(id, remarks, principal.getId()));
    }

    @PutMapping("/admin/{id}/reject")
    public ResponseEntity<DoctorVerificationResponse> rejectVerification(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> body,
            @AuthenticationPrincipal UserPrincipal principal) {
        String remarks = body != null ? body.get("remarks") : null;
        return ResponseEntity.ok(verificationService.rejectVerification(id, remarks, principal.getId()));
    }
}
