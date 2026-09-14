package com.medicycle.controller;

import com.medicycle.dto.request.DoctorAppointmentRequest;
import com.medicycle.dto.response.DoctorAppointmentResponse;
import com.medicycle.enums.AppointmentStatus;
import com.medicycle.security.UserPrincipal;
import com.medicycle.service.DoctorAppointmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/doctor-appointments")
@RequiredArgsConstructor
public class DoctorAppointmentController {
    private final DoctorAppointmentService appointmentService;

    @PostMapping
    public ResponseEntity<DoctorAppointmentResponse> book(
            @Valid @RequestBody DoctorAppointmentRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.status(HttpStatus.CREATED).body(appointmentService.book(request, principal.getId()));
    }

    @GetMapping
    public ResponseEntity<List<DoctorAppointmentResponse>> list(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(appointmentService.getForUser(principal.getUser()));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<DoctorAppointmentResponse> updateStatus(
            @PathVariable Long id, @RequestParam AppointmentStatus status,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(appointmentService.updateStatus(id, status, principal.getId()));
    }
}
