package com.medicycle.controller;

import com.medicycle.dto.response.InventoryResponse;
import com.medicycle.service.InventoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.List;
import org.springframework.data.domain.PageRequest;
import com.medicycle.dto.response.PagedResponse;
import com.medicycle.dto.request.InventoryAdjustmentRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;

@RestController
@RequestMapping("/api/inventory")
@RequiredArgsConstructor
public class InventoryController {

    private final InventoryService inventoryService;

    @GetMapping
    @PreAuthorize("@userSecurity.isVerifiedPharmacy(authentication)")
    public ResponseEntity<List<InventoryResponse>> getInventory() {
        return ResponseEntity.ok(inventoryService.getAllInventory());
    }

    @GetMapping("/page")
    @PreAuthorize("@userSecurity.isVerifiedPharmacy(authentication)")
    public ResponseEntity<PagedResponse<InventoryResponse>> getInventoryPage(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(inventoryService.getInventoryPage(
                PageRequest.of(Math.max(0, page), Math.min(Math.max(1, size), 100))));
    }

    @PatchMapping("/adjust")
    @PreAuthorize("@userSecurity.isVerifiedPharmacy(authentication)")
    public ResponseEntity<InventoryResponse> adjustQuantity(
            @Valid @RequestBody InventoryAdjustmentRequest request) {
        return ResponseEntity.status(HttpStatus.OK)
                .body(inventoryService.adjustAvailableQuantity(request));
    }
}
