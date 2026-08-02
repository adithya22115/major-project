package com.medicycle.controller;

import com.medicycle.dto.request.SymptomCheckRequest;
import com.medicycle.dto.response.SymptomCheckResponse;
import com.medicycle.service.HealthAssistantService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/health-assistant")
@RequiredArgsConstructor
@Slf4j
public class HealthAssistantController {

    private final HealthAssistantService healthAssistantService;

    /**
     * Analyze symptoms and get AI-powered health suggestions.
     * Supports both initial symptom check and multi-turn conversations
     * via the conversationHistory field.
     */
    @PostMapping("/check")
    public ResponseEntity<SymptomCheckResponse> checkSymptoms(
            @Valid @RequestBody SymptomCheckRequest request) {
        log.info("Symptom check request received");
        SymptomCheckResponse response = healthAssistantService.analyzeSymptoms(request);
        return ResponseEntity.ok(response);
    }
}
