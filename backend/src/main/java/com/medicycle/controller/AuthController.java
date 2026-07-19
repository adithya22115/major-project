package com.medicycle.controller;

import com.medicycle.dto.request.GuestRegisterRequest;
import com.medicycle.dto.request.LoginRequest;
import com.medicycle.dto.request.RegisterRequest;
import com.medicycle.dto.response.AuthResponse;
import com.medicycle.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @GetMapping("/verify")
    public ResponseEntity<Map<String, String>> verifyEmail(@RequestParam String token) {
        authService.verifyEmail(token);
        return ResponseEntity.ok(Map.of("message", "Email verified successfully"));
    }

    @PostMapping("/resend-verification")
    public ResponseEntity<Map<String, String>> resendVerification(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email is required"));
        }
        authService.resendVerification(email);
        return ResponseEntity.ok(Map.of("message", "Verification email sent. Check the server console for the link."));
    }

    @PostMapping("/guest-register")
    public ResponseEntity<AuthResponse> guestRegister(@Valid @RequestBody GuestRegisterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.guestRegister(request));
    }
}
