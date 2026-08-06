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
                "test-hf-key",
                "https://api-inference.huggingface.co/models/test-model",
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
    void parseHuggingFaceResponse_shouldExtractConditions() throws Exception {
        // Simulate HF response: array with generated_text containing the structured output
        String fakeResponse = """
                [{
                  "generated_text": "I understand you have a headache.\\n\\nPOSSIBLE_CONDITIONS: [Tension Headache, Migraine, Sinusitis]\\nSEVERITY: LOW\\n\\nPlease rest and stay hydrated."
                }]
                """;

        // Use reflection to call the private parseHuggingFaceResponse method
        SymptomCheckResponse response = (SymptomCheckResponse) ReflectionTestUtils.invokeMethod(
                healthAssistantService, "parseHuggingFaceResponse", fakeResponse);

        assertNotNull(response);
        assertEquals(3, response.getPossibleConditions().size());
        assertTrue(response.getPossibleConditions().contains("Tension Headache"));
        assertTrue(response.getPossibleConditions().contains("Migraine"));
        assertTrue(response.getPossibleConditions().contains("Sinusitis"));
        assertEquals("LOW", response.getSeverity());
        assertFalse(response.isSeekDoctorAdvice());
    }

    @Test
    void parseHuggingFaceResponse_shouldDetectHighSeverityAndSeekDoctor() throws Exception {
        String fakeResponse = """
                [{
                  "generated_text": "This sounds serious.\\n\\nPOSSIBLE_CONDITIONS: [Pneumonia, COVID-19]\\nSEVERITY: HIGH\\nSEEK_DOCTOR: YES\\n\\nPlease see a doctor immediately."
                }]
                """;

        SymptomCheckResponse response = (SymptomCheckResponse) ReflectionTestUtils.invokeMethod(
                healthAssistantService, "parseHuggingFaceResponse", fakeResponse);

        assertNotNull(response);
        assertEquals(2, response.getPossibleConditions().size());
        assertEquals("HIGH", response.getSeverity());
        assertTrue(response.isSeekDoctorAdvice());
    }

    @Test
    void parseHuggingFaceResponse_shouldHandleMediumSeverityWithDoctorMention() throws Exception {
        String fakeResponse = """
                [{
                  "generated_text": "Based on your symptoms, you should consult a doctor if they persist.\\n\\nPOSSIBLE_CONDITIONS: [Gastritis]\\nSEVERITY: MEDIUM"
                }]
                """;

        SymptomCheckResponse response = (SymptomCheckResponse) ReflectionTestUtils.invokeMethod(
                healthAssistantService, "parseHuggingFaceResponse", fakeResponse);

        assertNotNull(response);
        assertEquals("MEDIUM", response.getSeverity());
        // "consult a doctor" text should trigger seekDoctorAdvice
        assertTrue(response.isSeekDoctorAdvice());
    }

    @Test
    void parseHuggingFaceResponse_shouldHandleEmptyArray() throws Exception {
        String fakeResponse = """
                []
                """;

        SymptomCheckResponse response = (SymptomCheckResponse) ReflectionTestUtils.invokeMethod(
                healthAssistantService, "parseHuggingFaceResponse", fakeResponse);

        assertNotNull(response);
        assertNotNull(response.getAiResponse());
        assertEquals("LOW", response.getSeverity());
        assertFalse(response.isSeekDoctorAdvice());
    }

    @Test
    void parseHuggingFaceResponse_shouldHandleNoConditions() throws Exception {
        String fakeResponse = """
                [{
                  "generated_text": "I need more information about your symptoms. Can you describe them in more detail?\\nSEVERITY: LOW"
                }]
                """;

        SymptomCheckResponse response = (SymptomCheckResponse) ReflectionTestUtils.invokeMethod(
                healthAssistantService, "parseHuggingFaceResponse", fakeResponse);

        assertNotNull(response);
        assertTrue(response.getPossibleConditions().isEmpty());
        assertEquals("LOW", response.getSeverity());
    }

    @Test
    void parseHuggingFaceResponse_shouldDefaultToMediumSeverity_whenNotParseable() throws Exception {
        String fakeResponse = """
                [{
                  "generated_text": "You should rest and drink plenty of water."
                }]
                """;

        SymptomCheckResponse response = (SymptomCheckResponse) ReflectionTestUtils.invokeMethod(
                healthAssistantService, "parseHuggingFaceResponse", fakeResponse);

        assertNotNull(response);
        // No SEVERITY marker, should default to MEDIUM
        assertEquals("MEDIUM", response.getSeverity());
    }

    @Test
    void buildPromptForHF_shouldCreateCorrectPrompt() throws Exception {
        SymptomCheckRequest request = SymptomCheckRequest.builder()
                .message("I have a headache")
                .age(30)
                .gender("female")
                .build();

        String result = (String) ReflectionTestUtils.invokeMethod(
                healthAssistantService, "buildPromptForHF", request);

        assertNotNull(result);
        // Should contain the system prompt, user message, age, gender
        assertTrue(result.contains("You are MediCycle Health Assistant"));
        assertTrue(result.contains("I have a headache"));
        assertTrue(result.contains("[Patient age: 30]"));
        assertTrue(result.contains("[Patient gender: female]"));
        // Check that conversation history is not present (null)
        // Ensure there is no extra ": " before user message? Actually our format adds role: message
        // For no history, we expect:
        // SYSTEM_PROMPT + newline + newline + "User: I have a headache\n[Patient age: 30]\n[Patient gender: female]"
        // We'll just check that "User:" appears.
        assertTrue(result.contains("User: I have a headache"));
    }

    @Test
    void buildPromptForHF_shouldIncludeConversationHistory() throws Exception {
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

        String result = (String) ReflectionTestUtils.invokeMethod(
                healthAssistantService, "buildPromptForHF", request);

        assertNotNull(result);
        // Should contain the conversation history lines
        assertTrue(result.contains("User: I have a fever"));
        assertTrue(result.contains("Assistant: How high is your fever?"));
        assertTrue(result.contains("User: It's getting worse"));
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