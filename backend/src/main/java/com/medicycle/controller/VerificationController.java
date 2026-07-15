package com.medicycle.controller;

import com.medicycle.dto.request.VerificationRequest;
import com.medicycle.dto.response.VerificationResponse;
import com.medicycle.security.UserPrincipal;
import com.medicycle.service.VerificationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/verification")
@RequiredArgsConstructor
public class VerificationController {

    private final VerificationService verificationService;

    @PutMapping("/{id}")
    public ResponseEntity<VerificationResponse> verifyDonation(
            @PathVariable Long id,
            @Valid @RequestBody VerificationRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(verificationService.verifyDonation(id, request, principal.getId()));
    }
}
