package com.medicycle.controller;

import com.medicycle.dto.response.AdminOverviewResponse;
import com.medicycle.dto.response.DashboardResponse;
import com.medicycle.dto.response.UserResponse;
import com.medicycle.service.AdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;

    @GetMapping("/dashboard")
    public ResponseEntity<DashboardResponse> getDashboard() {
        return ResponseEntity.ok(adminService.getDashboard());
    }

    @GetMapping("/overview")
    public ResponseEntity<AdminOverviewResponse> getOverview(
            @RequestParam(value = "city", required = false) String city) {
        return ResponseEntity.ok(adminService.getOverview(city));
    }

    @GetMapping("/users")
    public ResponseEntity<List<UserResponse>> getAllUsers() {
        return ResponseEntity.ok(adminService.getAllUsers());
    }

    @PutMapping("/users/{id}/status")
    public ResponseEntity<UserResponse> updateUserStatus(
            @PathVariable Long id,
            @RequestBody Map<String, Boolean> body) {
        boolean verified = body.getOrDefault("isVerified", false);
        return ResponseEntity.ok(adminService.updateUserStatus(id, verified));
    }
}
