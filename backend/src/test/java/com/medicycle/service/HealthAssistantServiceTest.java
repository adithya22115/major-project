package com.medicycle.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.medicycle.dto.request.SymptomCheckRequest;
import com.medicycle.dto.response.SymptomCheckResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class HealthAssistantServiceTest {

    private HealthAssistantService healthAssistantService;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        healthAssistantService = new HealthAssistantService(
                "test-api-key",
                "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",
                1024,
                objectMapper
        );
    }

    @Test
    void analyzeSymptoms_shouldReturnErrorResponse_whenApiCallFails() {
        // The real API won't work with a fake key, so we expect error handling to kick in
        SymptomCheckRequest request = SymptomCheckRequest.builder()
                .message("I have a headache and fever")
                .build();

        SymptomCheckResponse response = healthAssistantService.analyzeSymptoms(request);

        assertNotNull(response);
        assertNotNull(response.getAiResponse());
        // Should return an error response since the API key is invalid
        assertFalse(response.getAiResponse().isEmpty());
    }

    @Test
    void analyzeSymptoms_shouldHandleRequestWithAllFields() {
        SymptomCheckRequest request = SymptomCheckRequest.builder()
                .message("I have a sore throat and cough")
                .age(25)
                .gender("male")
                .conversationHistory(List.of(
                        SymptomCheckRequest.ChatMessage.builder()
                                .role("user")
                                .content("I feel unwell")
                                .build(),
                        SymptomCheckRequest.ChatMessage.builder()
                                .role("assistant")
                                .content("Can you describe your symptoms?")
                                .build()
                ))
                .build();

        SymptomCheckResponse response = healthAssistantService.analyzeSymptoms(request);

        assertNotNull(response);
        assertNotNull(response.getAiResponse());
    }

    @Test
    void parseGeminiResponse_shouldExtractConditions() throws Exception {
        String fakeResponse = """
                {
                  "candidates": [{
                    "content": {
                      "parts": [{
                        "text": "I understand you have a headache.\\n\\nPOSSIBLE_CONDITIONS: [Tension Headache, Migraine, Sinusitis]\\nSEVERITY: LOW\\n\\nPlease rest and stay hydrated."
                      }]
                    }
                  }]
                }
                """;

        // Use reflection to call the private parseGeminiResponse method
        SymptomCheckResponse response = (SymptomCheckResponse) ReflectionTestUtils.invokeMethod(
                healthAssistantService, "parseGeminiResponse", fakeResponse);

        assertNotNull(response);
        assertEquals(3, response.getPossibleConditions().size());
        assertTrue(response.getPossibleConditions().contains("Tension Headache"));
        assertTrue(response.getPossibleConditions().contains("Migraine"));
        assertTrue(response.getPossibleConditions().contains("Sinusitis"));
        assertEquals("LOW", response.getSeverity());
        assertFalse(response.isSeekDoctorAdvice());
    }

    @Test
    void parseGeminiResponse_shouldDetectHighSeverityAndSeekDoctor() throws Exception {
        String fakeResponse = """
                {
                  "candidates": [{
                    "content": {
                      "parts": [{
                        "text": "This sounds serious.\\n\\nPOSSIBLE_CONDITIONS: [Pneumonia, COVID-19]\\nSEVERITY: HIGH\\nSEEK_DOCTOR: YES\\n\\nPlease see a doctor immediately."
                      }]
                    }
                  }]
                }
                """;

        SymptomCheckResponse response = (SymptomCheckResponse) ReflectionTestUtils.invokeMethod(
                healthAssistantService, "parseGeminiResponse", fakeResponse);

        assertNotNull(response);
        assertEquals(2, response.getPossibleConditions().size());
        assertEquals("HIGH", response.getSeverity());
        assertTrue(response.isSeekDoctorAdvice());
    }

    @Test
    void parseGeminiResponse_shouldHandleMediumSeverityWithDoctorMention() throws Exception {
        String fakeResponse = """
                {
                  "candidates": [{
                    "content": {
                      "parts": [{
                        "text": "Based on your symptoms, you should consult a doctor if they persist.\\n\\nPOSSIBLE_CONDITIONS: [Gastritis]\\nSEVERITY: MEDIUM"
                      }]
                    }
                  }]
                }
                """;

        SymptomCheckResponse response = (SymptomCheckResponse) ReflectionTestUtils.invokeMethod(
                healthAssistantService, "parseGeminiResponse", fakeResponse);

        assertNotNull(response);
        assertEquals("MEDIUM", response.getSeverity());
        // "consult a doctor" text should trigger seekDoctorAdvice
        assertTrue(response.isSeekDoctorAdvice());
    }

    @Test
    void parseGeminiResponse_shouldHandleEmptyCandidates() throws Exception {
        String fakeResponse = """
                {
                  "candidates": []
                }
                """;

        SymptomCheckResponse response = (SymptomCheckResponse) ReflectionTestUtils.invokeMethod(
                healthAssistantService, "parseGeminiResponse", fakeResponse);

        assertNotNull(response);
        assertNotNull(response.getAiResponse());
        assertEquals("LOW", response.getSeverity());
        assertFalse(response.isSeekDoctorAdvice());
    }

    @Test
    void parseGeminiResponse_shouldHandleNoConditions() throws Exception {
        String fakeResponse = """
                {
                  "candidates": [{
                    "content": {
                      "parts": [{
                        "text": "I need more information about your symptoms. Can you describe them in more detail?\\nSEVERITY: LOW"
                      }]
                    }
                  }]
                }
                """;

        SymptomCheckResponse response = (SymptomCheckResponse) ReflectionTestUtils.invokeMethod(
                healthAssistantService, "parseGeminiResponse", fakeResponse);

        assertNotNull(response);
        assertTrue(response.getPossibleConditions().isEmpty());
        assertEquals("LOW", response.getSeverity());
    }

    @Test
    void parseGeminiResponse_shouldDefaultToMediumSeverity_whenNotParseable() throws Exception {
        String fakeResponse = """
                {
                  "candidates": [{
                    "content": {
                      "parts": [{
                        "text": "You should rest and drink plenty of water."
                      }]
                    }
                  }]
                }
                """;

        SymptomCheckResponse response = (SymptomCheckResponse) ReflectionTestUtils.invokeMethod(
                healthAssistantService, "parseGeminiResponse", fakeResponse);

        assertNotNull(response);
        // No SEVERITY marker, should default to MEDIUM
        assertEquals("MEDIUM", response.getSeverity());
    }

    @Test
    void buildGeminiRequest_shouldCreateValidJson() throws Exception {
        SymptomCheckRequest request = SymptomCheckRequest.builder()
                .message("I have a headache")
                .age(30)
                .gender("female")
                .build();

        String jsonResult = (String) ReflectionTestUtils.invokeMethod(
                healthAssistantService, "buildGeminiRequest", request);

        assertNotNull(jsonResult);
        // Verify it's valid JSON
        var node = objectMapper.readTree(jsonResult);
        assertTrue(node.has("system_instruction"));
        assertTrue(node.has("contents"));
        assertTrue(node.has("generationConfig"));
        assertTrue(node.has("safetySettings"));

        // Check user message includes age and gender
        String userText = node.get("contents")
                .get(0).get("parts").get(0).get("text").asText();
        assertTrue(userText.contains("I have a headache"));
        assertTrue(userText.contains("[Patient age: 30]"));
        assertTrue(userText.contains("[Patient gender: female]"));
    }

    @Test
    void buildGeminiRequest_shouldIncludeConversationHistory() throws Exception {
        SymptomCheckRequest request = SymptomCheckRequest.builder()
                .message("It's getting worse")
                .conversationHistory(List.of(
                        SymptomCheckRequest.ChatMessage.builder()
                                .role("user")
                                .content("I have a fever")
                                .build(),
                        SymptomCheckRequest.ChatMessage.builder()
                                .role("assistant")
                                .content("How high is your fever?")
                                .build()
                ))
                .build();

        String jsonResult = (String) ReflectionTestUtils.invokeMethod(
                healthAssistantService, "buildGeminiRequest", request);

        var node = objectMapper.readTree(jsonResult);
        var contents = node.get("contents");
        // History (2 messages) + current message = 3
        assertEquals(3, contents.size());
        assertEquals("user", contents.get(0).get("role").asText());
        assertEquals("model", contents.get(1).get("role").asText());
        assertEquals("user", contents.get(2).get("role").asText());
    }

    @Test
    void symptomCheckResponse_shouldIncludeDisclaimer() {
        SymptomCheckResponse response = SymptomCheckResponse.builder()
                .aiResponse("Test response")
                .possibleConditions(List.of("Cold"))
                .severity("LOW")
                .seekDoctorAdvice(false)
                .build();

        assertNotNull(response.getDisclaimer());
        assertTrue(response.getDisclaimer().contains("not a medical diagnosis"));
    }
}
