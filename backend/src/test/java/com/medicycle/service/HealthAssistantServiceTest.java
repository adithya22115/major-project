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
        // Blank key => analyzeSymptoms skips the network and returns the canned fallback instantly.
        healthAssistantService = new HealthAssistantService(
                "",
                "https://api.openai.com/v1/chat/completions",
                "gpt-4o-mini",
                1024,
                1,
                objectMapper
        );
    }

    @Test
    void analyzeSymptoms_shouldReturnFallback_whenNoApiKeyConfigured() {
        SymptomCheckRequest request = SymptomCheckRequest.builder()
                .message("I have a headache and fever")
                .build();

        SymptomCheckResponse response = healthAssistantService.analyzeSymptoms(request);

        assertNotNull(response);
        assertNotNull(response.getAiResponse());
        assertFalse(response.getAiResponse().isEmpty());
        // The canned fallback recognises "fever" and "headache" keywords.
        assertFalse(response.getPossibleConditions().isEmpty());
    }

    @Test
    void analyzeSymptoms_shouldUseEarlierUserSymptomsInFallbackFollowUp() {
        SymptomCheckRequest request = SymptomCheckRequest.builder()
                .message("It is still happening today")
                .conversationHistory(List.of(
                        SymptomCheckRequest.ChatMessage.builder()
                                .role("user")
                                .content("I have chest pain")
                                .build(),
                        SymptomCheckRequest.ChatMessage.builder()
                                .role("assistant")
                                .content("Please seek urgent medical attention.")
                                .build()
                ))
                .build();

        SymptomCheckResponse response = healthAssistantService.analyzeSymptoms(request);

        assertEquals("HIGH", response.getSeverity());
        assertTrue(response.isSeekDoctorAdvice());
        assertTrue(response.getAiResponse().contains("what you shared earlier"));
    }

    @Test
    void analyzeSymptoms_shouldPrioritizeLatestSymptomOverOldHistory() {
        SymptomCheckRequest request = SymptomCheckRequest.builder()
                .message("Now I have stomach pain and nausea")
                .conversationHistory(List.of(
                        SymptomCheckRequest.ChatMessage.builder()
                                .role("user")
                                .content("I had fever yesterday")
                                .build(),
                        SymptomCheckRequest.ChatMessage.builder()
                                .role("assistant")
                                .content("Keep monitoring your temperature.")
                                .build()
                ))
                .build();

        SymptomCheckResponse response = healthAssistantService.analyzeSymptoms(request);

        assertEquals("MEDIUM", response.getSeverity());
        assertTrue(response.getPossibleConditions().contains("Gastroenteritis"));
        assertTrue(response.getAiResponse().contains("oral rehydration solution"));
    }

    @Test
    void analyzeSymptoms_shouldUseEarlierSymptomsForCareAdviceRequest() {
        SymptomCheckRequest request = SymptomCheckRequest.builder()
                .message("These are all my symptoms, help me with care tips")
                .conversationHistory(List.of(
                        SymptomCheckRequest.ChatMessage.builder()
                                .role("user")
                                .content("I have fever")
                                .build(),
                        SymptomCheckRequest.ChatMessage.builder()
                                .role("user")
                                .content("Along with that headache")
                                .build(),
                        SymptomCheckRequest.ChatMessage.builder()
                                .role("user")
                                .content("Eyestrain also")
                                .build()
                ))
                .build();

        SymptomCheckResponse response = healthAssistantService.analyzeSymptoms(request);

        assertEquals("MEDIUM", response.getSeverity());
        assertTrue(response.getPossibleConditions().contains("Viral Fever"));
        assertTrue(response.getPossibleConditions().contains("Tension Headache / Migraine"));
        assertTrue(response.getPossibleConditions().contains("Digital Eye Strain"));
        assertTrue(response.getAiResponse().contains("20-20-20"));
        assertFalse(response.getAiResponse().contains("I need a little more detail"));
    }

    @Test
    void analyzeSymptoms_shouldAskForSymptomsOnGreetingMessage() {
        SymptomCheckRequest request = SymptomCheckRequest.builder()
                .message("hi")
                .build();

        SymptomCheckResponse response = healthAssistantService.analyzeSymptoms(request);

        assertEquals("LOW", response.getSeverity());
        assertTrue(response.getPossibleConditions().isEmpty());
        assertTrue(response.getAiResponse().contains("Please tell me what symptoms"));
    }

    @Test
    void analyzeSymptoms_shouldReturnFallback_whenApiUnreachable() {
        // A non-blank key against an unroutable local port: connection refused -> fallback, no hang.
        HealthAssistantService unreachable = new HealthAssistantService(
                "fake-key",
                "http://127.0.0.1:1/v1/chat/completions",
                "gpt-4o-mini",
                1024,
                1,
                objectMapper
        );

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

        SymptomCheckResponse response = unreachable.analyzeSymptoms(request);

        assertNotNull(response);
        assertNotNull(response.getAiResponse());
        assertFalse(response.getAiResponse().isEmpty());
    }

    @Test
    void parseLlmResponse_shouldExtractConditions() throws Exception {
        // Simulate an OpenAI-style response: choices[0].message.content
        String fakeResponse = """
                {
                  "choices": [{
                    "message": {
                      "content": "I understand you have a headache.\\n\\nPOSSIBLE_CONDITIONS: [Tension Headache, Migraine, Sinusitis]\\nSEVERITY: LOW\\n\\nPlease rest and stay hydrated."
                    }
                  }]
                }
                """;

        SymptomCheckResponse response = (SymptomCheckResponse) ReflectionTestUtils.invokeMethod(
                healthAssistantService, "parseLlmResponse", fakeResponse);

        assertNotNull(response);
        assertEquals(3, response.getPossibleConditions().size());
        assertTrue(response.getPossibleConditions().contains("Tension Headache"));
        assertTrue(response.getPossibleConditions().contains("Migraine"));
        assertTrue(response.getPossibleConditions().contains("Sinusitis"));
        assertEquals("LOW", response.getSeverity());
        assertFalse(response.isSeekDoctorAdvice());
    }

    @Test
    void parseLlmResponse_shouldDetectHighSeverityAndSeekDoctor() throws Exception {
        String fakeResponse = """
                {
                  "choices": [{
                    "message": {
                      "content": "This sounds serious.\\n\\nPOSSIBLE_CONDITIONS: [Pneumonia, COVID-19]\\nSEVERITY: HIGH\\nSEEK_DOCTOR: YES\\n\\nPlease see a doctor immediately."
                    }
                  }]
                }
                """;

        SymptomCheckResponse response = (SymptomCheckResponse) ReflectionTestUtils.invokeMethod(
                healthAssistantService, "parseLlmResponse", fakeResponse);

        assertNotNull(response);
        assertEquals(2, response.getPossibleConditions().size());
        assertEquals("HIGH", response.getSeverity());
        assertTrue(response.isSeekDoctorAdvice());
    }

    @Test
    void parseLlmResponse_shouldHandleMediumSeverityWithDoctorMention() throws Exception {
        String fakeResponse = """
                {
                  "choices": [{
                    "message": {
                      "content": "Based on your symptoms, you should consult a doctor if they persist.\\n\\nPOSSIBLE_CONDITIONS: [Gastritis]\\nSEVERITY: MEDIUM"
                    }
                  }]
                }
                """;

        SymptomCheckResponse response = (SymptomCheckResponse) ReflectionTestUtils.invokeMethod(
                healthAssistantService, "parseLlmResponse", fakeResponse);

        assertNotNull(response);
        assertEquals("MEDIUM", response.getSeverity());
        // "consult a doctor" text should trigger seekDoctorAdvice
        assertTrue(response.isSeekDoctorAdvice());
    }

    @Test
    void parseLlmResponse_shouldHandleEmptyChoices() throws Exception {
        String fakeResponse = """
                { "choices": [] }
                """;

        SymptomCheckResponse response = (SymptomCheckResponse) ReflectionTestUtils.invokeMethod(
                healthAssistantService, "parseLlmResponse", fakeResponse);

        assertNotNull(response);
        assertNotNull(response.getAiResponse());
        assertEquals("LOW", response.getSeverity());
        assertFalse(response.isSeekDoctorAdvice());
    }

    @Test
    void parseLlmResponse_shouldHandleNoConditions() throws Exception {
        String fakeResponse = """
                {
                  "choices": [{
                    "message": {
                      "content": "I need more information about your symptoms. Can you describe them in more detail?\\nSEVERITY: LOW"
                    }
                  }]
                }
                """;

        SymptomCheckResponse response = (SymptomCheckResponse) ReflectionTestUtils.invokeMethod(
                healthAssistantService, "parseLlmResponse", fakeResponse);

        assertNotNull(response);
        assertTrue(response.getPossibleConditions().isEmpty());
        assertEquals("LOW", response.getSeverity());
    }

    @Test
    void parseLlmResponse_shouldDefaultToMediumSeverity_whenNotParseable() throws Exception {
        String fakeResponse = """
                {
                  "choices": [{
                    "message": {
                      "content": "You should rest and drink plenty of water."
                    }
                  }]
                }
                """;

        SymptomCheckResponse response = (SymptomCheckResponse) ReflectionTestUtils.invokeMethod(
                healthAssistantService, "parseLlmResponse", fakeResponse);

        assertNotNull(response);
        // No SEVERITY marker, should default to MEDIUM
        assertEquals("MEDIUM", response.getSeverity());
    }

    @Test
    void buildUserMessage_shouldIncludeAgeAndGender() throws Exception {
        SymptomCheckRequest request = SymptomCheckRequest.builder()
                .message("I have a headache")
                .age(30)
                .gender("female")
                .build();

        String result = (String) ReflectionTestUtils.invokeMethod(
                healthAssistantService, "buildUserMessage", request);

        assertNotNull(result);
        assertTrue(result.contains("I have a headache"));
        assertTrue(result.contains("[Patient age: 30]"));
        assertTrue(result.contains("[Patient gender: female]"));
        // The user message is the final user turn only; the system prompt lives in the system message.
        assertFalse(result.contains("You are MediCycle Health Assistant"));
        assertFalse(result.startsWith("User:"));
    }

    @Test
    void buildUserMessage_shouldOnlyContainLatestMessage_whenHistoryPresent() throws Exception {
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
                healthAssistantService, "buildUserMessage", request);

        assertNotNull(result);
        // History is appended as separate chat messages in callLlm; the user message is just the latest turn.
        assertTrue(result.contains("It's getting worse"));
        assertFalse(result.contains("I have a fever"));
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