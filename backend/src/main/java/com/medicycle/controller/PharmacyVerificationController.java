package com.medicycle.controller;

import com.medicycle.dto.request.PharmacyVerificationRequest;
import com.medicycle.dto.response.PharmacyVerificationResponse;
import com.medicycle.enums.VerificationStatus;
import com.medicycle.security.UserPrincipal;
import com.medicycle.service.PharmacyVerificationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/pharmacy-verification")
@RequiredArgsConstructor
public class PharmacyVerificationController {

    private final PharmacyVerificationService verificationService;

    @PostMapping
    public ResponseEntity<PharmacyVerificationResponse> submitVerification(
            @Valid @RequestBody PharmacyVerificationRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(verificationService.submitVerification(request, principal.getId()));
    }

    @GetMapping("/me")
    public ResponseEntity<PharmacyVerificationResponse> getMyVerification(
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(verificationService.getMyVerification(principal.getId()));
    }

    @GetMapping("/admin/pending")
    public ResponseEntity<List<PharmacyVerificationResponse>> getPendingVerifications() {
        return ResponseEntity.ok(verificationService.getAllPending());
    }

    @GetMapping("/admin/all")
    public ResponseEntity<List<PharmacyVerificationResponse>> getAllByStatus(
            @RequestParam VerificationStatus status) {
        return ResponseEntity.ok(verificationService.getAllByStatus(status));
    }

    @PutMapping("/admin/{id}/approve")
    public ResponseEntity<PharmacyVerificationResponse> approveVerification(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> body,
            @AuthenticationPrincipal UserPrincipal principal) {
        String remarks = body != null ? body.get("remarks") : null;
        return ResponseEntity.ok(verificationService.approveVerification(id, remarks, principal.getId()));
    }

    @PutMapping("/admin/{id}/reject")
    public ResponseEntity<PharmacyVerificationResponse> rejectVerification(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> body,
            @AuthenticationPrincipal UserPrincipal principal) {
        String remarks = body != null ? body.get("remarks") : null;
        return ResponseEntity.ok(verificationService.rejectVerification(id, remarks, principal.getId()));
    }
}
