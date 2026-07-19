package com.medicycle.controller;

import com.medicycle.security.UserPrincipal;
import com.medicycle.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/profile")
    public ResponseEntity<Map<String, Object>> getProfile(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(userService.getProfileAsMap(principal.getId()));
    }

    @PutMapping("/profile")
    public ResponseEntity<Map<String, Object>> updateProfile(
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(userService.updateProfileFromMap(principal.getId(), body));
    }

    @PutMapping("/profile/pincode")
    public ResponseEntity<Map<String, Object>> updatePincode(
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal UserPrincipal principal) {
        String pincode = body.get("pincode");
        if (pincode == null || pincode.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Pincode is required"));
        }
        return ResponseEntity.ok(userService.updatePincode(principal.getId(), pincode));
    }

    @PutMapping("/location")
    public ResponseEntity<Map<String, Object>> updateLocation(
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal UserPrincipal principal) {
        Number lat = (Number) body.get("latitude");
        Number lng = (Number) body.get("longitude");
        if (lat == null || lng == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "latitude and longitude are required"));
        }
        return ResponseEntity.ok(userService.updateLocation(principal.getId(), lat.doubleValue(), lng.doubleValue()));
    }

    @GetMapping("/pincode/{pincode}/lookup")
    public ResponseEntity<Map<String, Object>> lookupPincode(@PathVariable String pincode) {
        return ResponseEntity.ok(userService.lookupPincode(pincode));
    }
}
