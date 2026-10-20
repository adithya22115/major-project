package com.medicycle.controller;

import com.medicycle.dto.response.AdminOverviewResponse;
import com.medicycle.dto.response.DashboardResponse;
import com.medicycle.dto.response.UserResponse;
import com.medicycle.dto.request.AdminQueryRequest;
import com.medicycle.dto.response.AdminQueryResponse;
import com.medicycle.dto.response.DemandForecastResponse;
import com.medicycle.service.AdminService;
import com.medicycle.service.AdminSmartQueryService;
import com.medicycle.service.DemandForecastService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import java.util.List;
import java.util.Map;
import org.springframework.data.domain.PageRequest;
import com.medicycle.dto.response.PagedResponse;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;
    private final AdminSmartQueryService adminSmartQueryService;
    private final DemandForecastService demandForecastService;

    @PostMapping("/query")
    public ResponseEntity<AdminQueryResponse> query(@Valid @RequestBody AdminQueryRequest request) {
        return ResponseEntity.ok(adminSmartQueryService.answer(request));
    }

    @GetMapping("/demand-forecast")
    public ResponseEntity<DemandForecastResponse> demandForecast(
            @RequestParam(defaultValue = "6") int months,
            @RequestParam(required = false) String city) {
        return ResponseEntity.ok(demandForecastService.forecast(months, city));
    }

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

    @GetMapping("/users/page")
    public ResponseEntity<PagedResponse<UserResponse>> getUsersPage(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(adminService.getUsersPage(
                PageRequest.of(Math.max(0, page), Math.min(Math.max(1, size), 100))));
    }

    @PutMapping("/users/{id}/status")
    public ResponseEntity<UserResponse> updateUserStatus(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body) {
        boolean verified = Boolean.TRUE.equals(body.get("isVerified"));
        String remarks = body.get("remarks") instanceof String s ? s : null;
        return ResponseEntity.ok(adminService.updateUserStatus(id, verified, remarks));
    }
}
