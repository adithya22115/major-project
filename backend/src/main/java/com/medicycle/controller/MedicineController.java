package com.medicycle.controller;

import com.medicycle.dto.request.MedicineCreateRequest;
import com.medicycle.dto.request.ImageVerificationRequest;
import com.medicycle.dto.response.ImageVerificationResponse;
import com.medicycle.dto.response.MedicineResponse;
import com.medicycle.security.UserPrincipal;
import com.medicycle.service.MedicineImageAnalysisService;
import com.medicycle.service.MedicineService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import org.springframework.data.domain.PageRequest;
import com.medicycle.dto.response.PagedResponse;

@RestController
@RequestMapping("/api/medicines")
@RequiredArgsConstructor
public class MedicineController {

    private final MedicineService medicineService;
    private final MedicineImageAnalysisService medicineImageAnalysisService;

    @PostMapping("/analyze-image")
    public ResponseEntity<ImageVerificationResponse> analyzeImage(
            @RequestPart("image") MultipartFile image,
            @ModelAttribute ImageVerificationRequest request) {
        try {
            return ResponseEntity.ok(medicineImageAnalysisService.analyze(image, request));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping
    public ResponseEntity<List<MedicineResponse>> getAllMedicines() {
        return ResponseEntity.ok(medicineService.getAllMedicines());
    }

    @GetMapping("/page")
    public ResponseEntity<PagedResponse<MedicineResponse>> getMedicinesPage(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(medicineService.getMedicinesPage(
                PageRequest.of(Math.max(0, page), Math.min(Math.max(1, size), 100))));
    }

    @GetMapping("/{id}")
    public ResponseEntity<MedicineResponse> getMedicine(@PathVariable Long id) {
        return ResponseEntity.ok(medicineService.getMedicineById(id));
    }

    @PostMapping
    public ResponseEntity<MedicineResponse> createMedicine(
            @Valid @RequestBody MedicineCreateRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(medicineService.createMedicine(request, principal.getId()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<MedicineResponse> updateMedicine(
            @PathVariable Long id,
            @Valid @RequestBody MedicineCreateRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(medicineService.updateMedicine(id, request, principal.getId()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteMedicine(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        medicineService.deleteMedicine(id, principal.getId());
        return ResponseEntity.noContent().build();
    }
}
