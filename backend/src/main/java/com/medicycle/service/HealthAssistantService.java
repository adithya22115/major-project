package com.medicycle.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.medicycle.dto.request.SymptomCheckRequest;
import com.medicycle.dto.response.SymptomCheckResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@Slf4j
public class HealthAssistantService {

    private final WebClient webClient;
    private final ObjectMapper objectMapper;
    private final String apiKey;
    private final String apiUrl;
    private final int maxTokens;

    // Hugging Face configuration
    private final String hfApiKey;
    private final String hfApiUrl;
    private final int hfMaxTokens;

    private static final String SYSTEM_PROMPT = """
            You are MediCycle Health Assistant, an AI-powered symptom checker. You are NOT a doctor and cannot diagnose conditions.

            YOUR ROLE:
            - Help users understand their symptoms
            - Suggest POSSIBLE conditions (not diagnoses)
            - Recommend when to seek professional medical help
            - Ask clarifying questions to better understand symptoms

            RESPONSE FORMAT (ALWAYS follow this exact structure):
            1. Start with a brief empathetic acknowledgment
            2. Ask 1-2 clarifying questions if needed
            3. Based on the symptoms described, list possible conditions in this format:
                   POSSIBLE_CONDITIONS: [condition1, condition2, condition3]
            4. Assess severity:
                   SEVERITY: [LOW|MEDIUM|HIGH]
            5. If MEDIUM or HIGH severity, add:
                   SEEK_DOCTOR: YES
            6. Provide general self-care tips if applicable
            7. Always end with a reminder that this is not a medical diagnosis

            SEVERITY GUIDELINES:
            - LOW: Common conditions that typically resolve on their own (cold, minor headache, mild allergies)
            - MEDIUM: Conditions that may need medical attention within a few days (persistent fever, moderate pain, infections)
            - HIGH: Conditions requiring urgent/immediate medical attention (chest pain, difficulty breathing, severe injuries, high fever with rash)

            IMPORTANT RULES:
            - Never prescribe medication
            - Never provide a definitive diagnosis
            - Always encourage consulting a real doctor for persistent or concerning symptoms
            - Be empathetic and reassuring
            - Use simple, non-medical jargon where possible
            - If symptoms suggest an emergency, strongly advise calling emergency services immediately
            """;

    public HealthAssistantService(
            @Value("${gemini.api.key}") String apiKey,
            @Value("${gemini.api.url}") String apiUrl,
            @Value("${gemini.api.max-tokens}") int maxTokens,

            @Value("${hf.api.key}") String hfApiKey,
            @Value("${hf.api.url}") String hfApiUrl,
            @Value("${hf.api.max-tokens}") int hfMaxTokens,

            ObjectMapper objectMapper) {
        this.apiKey = apiKey;
        this.apiUrl = apiUrl;
        this.maxTokens = maxTokens;
        this.hfApiKey = hfApiKey;
        this.hfApiUrl = hfApiUrl;
        this.hfMaxTokens = hfMaxTokens;
        this.objectMapper = objectMapper;
        this.webClient = WebClient.builder()
                .codecs(configurer -> configurer.defaultCodecs().maxInMemorySize(1024 * 1024))
                .build();
    }

    public SymptomCheckResponse analyzeSymptoms(SymptomCheckRequest request) {
        try {
            // Try Hugging Face first
            String hfResponse = callHuggingFace(request);
            return parseHuggingFaceResponse(hfResponse);
        } catch (Exception hfEx) {
            log.warn("Hugging Face API call failed ({}), falling back to Gemini", hfEx.getMessage());
            try {
                String geminiResponse = callGemini(request);
                return parseGeminiResponse(geminiResponse);
            } catch (Exception gemEx) {
                log.warn("Gemini also failed ({}), using internal fallback", gemEx.getMessage());
                return generateFallbackAnalysis(request);
            }
        }
    }

    private String callGemini(SymptomCheckRequest request) throws Exception {
        String requestBody = buildGeminiRequest(request);
        String fullUrl = apiUrl + "?key=" + apiKey;

        String responseBody = webClient.post()
                .uri(fullUrl)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(requestBody)
                .retrieve()
                .bodyToMono(String.class)
                .timeout(Duration.ofSeconds(15))
                .block();

        if (responseBody == null || responseBody.isBlank()) {
            throw new RuntimeException("Empty response from Gemini");
        }
        return responseBody;
    }

    private String callHuggingFace(SymptomCheckRequest request) throws Exception {
        String prompt = buildPromptForHF(request);
        ObjectNode root = objectMapper.createObjectNode();
        root.put("inputs", prompt);
        ObjectNode params = objectMapper.createObjectNode();
        params.put("max_new_tokens", hfMaxTokens);
        // Optional: return only the newly generated text
        params.put("return_full_text", false);
        root.set("parameters", params);
        String requestBody = objectMapper.writeValueAsString(root);

        String responseBody = webClient.post()
                .uri(hfApiUrl)
                .header("Authorization", "Bearer " + hfApiKey)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(requestBody)
                .retrieve()
                .bodyToMono(String.class)
                .timeout(Duration.ofSeconds(15))
                .block();

        if (responseBody == null || responseBody.isBlank()) {
            throw new RuntimeException("Empty response from Hugging Face");
        }
        return responseBody;
    }

    private String buildGeminiRequest(SymptomCheckRequest request) {
        try {
            ObjectNode root = objectMapper.createObjectNode();

            // System instruction
            ObjectNode systemInstruction = objectMapper.createObjectNode();
            ObjectNode systemParts = objectMapper.createObjectNode();
            systemParts.put("text", SYSTEM_PROMPT);
            ArrayNode systemPartsArray = objectMapper.createArrayNode();
            systemPartsArray.add(systemParts);
            systemInstruction.set("parts", systemPartsArray);
            root.set("system_instruction", systemInstruction);

            // Contents (conversation history + current message)
            ArrayNode contents = objectMapper.createArrayNode();

            // Add conversation history if present
            if (request.getConversationHistory() != null) {
                for (SymptomCheckRequest.ChatMessage msg : request.getConversationHistory()) {
                    ObjectNode content = objectMapper.createObjectNode();
                    content.put("role", "user".equals(msg.getRole()) ? "user" : "model");
                    ArrayNode parts = objectMapper.createArrayNode();
                    ObjectNode part = objectMapper.createObjectNode();
                    part.put("text", msg.getContent());
                    parts.add(part);
                    content.set("parts", parts);
                    contents.add(content);
                }
            }

            // Add current user message
            ObjectNode userContent = objectMapper.createObjectNode();
            userContent.put("role", "user");
            ArrayNode userParts = objectMapper.createArrayNode();
            ObjectNode userPart = objectMapper.createObjectNode();

            StringBuilder messageBuilder = new StringBuilder(request.getMessage());
            if (request.getAge() != null) {
                messageBuilder.append("\n[Patient age: ").append(request.getAge()).append("]");
            }
            if (request.getGender() != null && !request.getGender().isBlank()) {
                messageBuilder.append("\n[Patient gender: ").append(request.getGender()).append("]");
            }
            userPart.put("text", messageBuilder.toString());
            userParts.add(userPart);
            userContent.set("parts", userParts);
            contents.add(userContent);

            root.set("contents", contents);

            // Generation config
            ObjectNode generationConfig = objectMapper.createObjectNode();
            generationConfig.put("maxOutputTokens", maxTokens);
            generationConfig.put("temperature", 0.7);
            generationConfig.put("topP", 0.9);
            root.set("generationConfig", generationConfig);

            // Safety settings — allow health-related content
            ArrayNode safetySettings = objectMapper.createArrayNode();
            String[] categories = {
                    "HARM_CATEGORY_DANGEROUS_CONTENT",
                    "HARM_CATEGORY_HARASSMENT",
                    "HARM_CATEGORY_HATE_SPEECH",
                    "HARM_CATEGORY_SEXUALLY_EXPLICIT"
            };
            for (String category : categories) {
                ObjectNode setting = objectMapper.createObjectNode();
                setting.put("category", category);
                setting.put("threshold", "BLOCK_ONLY_HIGH");
                safetySettings.add(setting);
            }
            root.set("safetySettings", safetySettings);

            return objectMapper.writeValueAsString(root);
        } catch (Exception e) {
            throw new RuntimeException("Failed to build Gemini request", e);
        }
    }

    private SymptomCheckResponse parseGeminiResponse(String responseBody) {
        try {
            JsonNode root = objectMapper.readTree(responseBody);
            JsonNode candidates = root.path("candidates");

            if (candidates.isEmpty() || candidates.isMissingNode()) {
                return buildErrorResponse("No response received from the AI. Please try rephrasing your symptoms.");
            }

            String aiText = candidates.get(0)
                    .path("content")
                    .path("parts")
                    .get(0)
                    .path("text")
                    .asText("");

            if (aiText.isBlank()) {
                return buildErrorResponse("The AI returned an empty response. Please try again.");
            }

            // Parse structured data from the AI response
            List<String> conditions = extractConditions(aiText);
            String severity = extractSeverity(aiText);
            boolean seekDoctor = aiText.toUpperCase().contains("SEEK_DOCTOR: YES")
                    || "HIGH".equals(severity)
                    || aiText.toLowerCase().contains("see a doctor")
                    || aiText.toLowerCase().contains("seek medical")
                    || aiText.toLowerCase().contains("consult a doctor");

            // Clean the AI text: remove the structured markers for display
            String cleanResponse = cleanAiResponse(aiText);

            return SymptomCheckResponse.builder()
                    .aiResponse(cleanResponse)
                    .possibleConditions(conditions)
                    .severity(severity)
                    .seekDoctorAdvice(seekDoctor)
                    .build();

        } catch (Exception e) {
            log.error("Error parsing Gemini response: {}", responseBody, e);
            return buildErrorResponse("Error processing the AI response. Please try again.");
        }
    }

    private SymptomCheckResponse parseHuggingFaceResponse(String responseBody) {
        try {
            JsonNode root = objectMapper.readTree(responseBody);
            // Expect an array with at least one element containing generated_text
            JsonNode first = root.get(0);
            if (first == null || first.isMissingNode()) {
                return buildErrorResponse("Unexpected response format from Hugging Face.");
            }

            String generated = first.path("generated_text").asText("");
            if (generated.isBlank()) {
                return buildErrorResponse("Empty generated text from Hugging Face.");
            }

            // Strip the prompt we sent: keep only the part after the last "User:" line
            int lastUserIdx = generated.lastIndexOf("User:");
            String aiText = (lastUserIdx >= 0) ? generated.substring(lastUserIdx + 5).trim() : generated;

            // Parse using the same helpers as Gemini response
            List<String> conditions = extractConditions(aiText);
            String severity = extractSeverity(aiText);
            boolean seekDoctor = aiText.toUpperCase().contains("SEEK_DOCTOR: YES")
                    || "HIGH".equals(severity)
                    || aiText.toLowerCase().contains("see a doctor")
                    || aiText.toLowerCase().contains("seek medical")
                    || aiText.toLowerCase().contains("consult a doctor");
            String cleanResponse = cleanAiResponse(aiText);

            return SymptomCheckResponse.builder()
                    .aiResponse(cleanResponse)
                    .possibleConditions(conditions)
                    .severity(severity)
                    .seekDoctorAdvice(seekDoctor)
                    .build();

        } catch (Exception e) {
            log.error("Error parsing Hugging Face response: {}", responseBody, e);
            return buildErrorResponse("Error processing the AI response. Please try again.");
        }
    }

    private List<String> extractConditions(String text) {
        List<String> conditions = new ArrayList<>();
        // Pattern: POSSIBLE_CONDITIONS: [cond1, cond2, cond3]
        Pattern pattern = Pattern.compile("POSSIBLE_CONDITIONS:\\s*\\[([^\\]]+)]", Pattern.CASE_INSENSITIVE);
        Matcher matcher = pattern.matcher(text);
        if (matcher.find()) {
            String conditionList = matcher.group(1);
            for (String condition : conditionList.split(",")) {
                String trimmed = condition.trim();
                if (!trimmed.isEmpty()) {
                    conditions.add(trimmed);
                }
            }
        }
        return conditions;
    }

    private String extractSeverity(String text) {
        Pattern pattern = Pattern.compile("SEVERITY:\\s*(LOW|MEDIUM|HIGH)", Pattern.CASE_INSENSITIVE);
        Matcher matcher = pattern.matcher(text);
        if (matcher.find()) {
            return matcher.group(1).toUpperCase();
        }
        // Default to MEDIUM if we can't parse it
        return "MEDIUM";
    }

    private String cleanAiResponse(String text) {
        // Remove the structured markers but keep the readable content
        String cleaned = text
                .replaceAll("(?i)POSSIBLE_CONDITIONS:\\s*\\[[^\\]]*]\\s*", "")
                .replaceAll("(?i)SEVERITY:\\s*(LOW|MEDIUM|HIGH)\\s*", "")
                .replaceAll("(?i)SEEK_DOCTOR:\\s*(YES|NO)\\s*", "")
                .replaceAll("\\n{3,}", "\n\n")
                .trim();
        return cleaned;
    }

    private SymptomCheckResponse generateFallbackAnalysis(SymptomCheckRequest request) {
        String msg = (request.getMessage() != null ? request.getMessage() : "").toLowerCase();

        List<String> conditions = new ArrayList<>();
        String severity = "LOW";
        boolean seekDoctor = false;
        StringBuilder advice = new StringBuilder();

        advice.append("Hello! I have evaluated the symptoms you described:\n\n");

        if (msg.contains("chest pain") || msg.contains("breathing") || msg.contains("shortness of breath") || msg.contains("fainting") || msg.contains("seizure")) {
            conditions.addAll(List.of("Severe Respiratory Distress", "Cardiac/Cardiovascular Event", "Emergency Acute Condition"));
            severity = "HIGH";
            seekDoctor = true;
            advice.append("⚠️ URGENT MEDICAL ATTENTION RECOMMENDED:\n");
            advice.append("Chest pain or severe difficulty breathing can indicate a serious medical emergency. Please visit an emergency care facility or call emergency medical service immediately.\n\n");
        } else if (msg.contains("fever") || msg.contains("temperature") || msg.contains("chills")) {
            conditions.addAll(List.of("Viral Fever", "Influenza (Flu)", "Acute Upper Respiratory Infection"));
            severity = "MEDIUM";
            seekDoctor = msg.contains("high") || msg.contains("persistent");
            advice.append("General Health Guidance:\n");
            advice.append("- Rest adequately and maintain hydration by drinking water, warm broths, or ORS.\n");
            advice.append("- Monitor your body temperature regularly.\n");
            advice.append("- Seek medical evaluation if fever exceeds 102°F (38.9°C) or lasts more than 3 days.\n\n");
        } else if (msg.contains("headache") || msg.contains("migraine") || msg.contains("head pain")) {
            conditions.addAll(List.of("Tension Headache", "Migraine", "Sinusitis / Eye Strain"));
            severity = msg.contains("severe") ? "MEDIUM" : "LOW";
            seekDoctor = msg.contains("severe") || msg.contains("sudden");
            advice.append("General Self-Care Tips:\n");
            advice.append("- Rest in a quiet, dark room away from bright screens.\n");
            advice.append("- Stay hydrated and apply a cool or warm compress to your forehead.\n");
            advice.append("- Consult a physician if the headache is sudden and unusually severe.\n\n");
        } else if (msg.contains("cough") || msg.contains("cold") || msg.contains("sore throat") || msg.contains("flu")) {
            conditions.addAll(List.of("Common Cold", "Pharyngitis / Sore Throat", "Seasonal Respiratory Allergy"));
            severity = "LOW";
            advice.append("General Self-Care Tips:\n");
            advice.append("- Drink warm liquids such as herbal tea with honey or warm water.\n");
            advice.append("- Gargle with warm salt water to relieve throat irritation.\n");
            advice.append("- Ensure good rest and humidify your breathing space.\n\n");
        } else if (msg.contains("stomach") || msg.contains("vomit") || msg.contains("nausea") || msg.contains("diarrhea") || msg.contains("abdominal")) {
            conditions.addAll(List.of("Acute Gastritis / Indigestion", "Food Poisoning", "Gastroenteritis"));
            severity = "MEDIUM";
            seekDoctor = msg.contains("blood") || msg.contains("severe");
            advice.append("General Health Guidance:\n");
            advice.append("- Sip small amounts of oral rehydration solution (ORS) or clear liquids.\n");
            advice.append("- Avoid greasy, spicy, or heavy foods until symptoms subside.\n");
            advice.append("- Seek medical care if vomiting or diarrhea persists for over 24-48 hours.\n\n");
        } else {
            conditions.addAll(List.of("General Fatigue / Mild Infection", "Stress-Related Exhaustion"));
            severity = "LOW";
            advice.append("General Health Guidance:\n");
            advice.append("- Please ensure adequate rest, proper sleep hygiene, and balanced fluid intake.\n");
            advice.append("- If your symptoms persist or worsen, please consult a healthcare professional.\n\n");
        }

        advice.append("Reminder: This assistant provides educational information and is not a substitute for professional medical diagnosis.");

        return SymptomCheckResponse.builder()
                .aiResponse(advice.toString())
                .possibleConditions(conditions)
                .severity(severity)
                .seekDoctorAdvice(seekDoctor)
                .build();
    }

    private SymptomCheckResponse buildErrorResponse(String message) {
        return SymptomCheckResponse.builder()
                .aiResponse(message)
                .possibleConditions(List.of())
                .severity("LOW")
                .seekDoctorAdvice(false)
                .build();

    private String buildPromptForHF(SymptomCheckRequest request) {
        StringBuilder sb = new StringBuilder();
        sb.append(SYSTEM_PROMPT).append("\n\n");
        // conversation history
        if (request.getConversationHistory() != null) {
            for (SymptomCheckRequest.ChatMessage msg : request.getConversationHistory()) {
                String role = "user".equalsIgnoreCase(msg.getRole()) ? "User" : "Assistant";
                sb.append(": ").append(msg.getContent()).append("\n");
            }
        }
        sb.append("User: ").append(request.getMessage());
        if (request.getAge() != null) {
            sb.append("\n[Patient age: ").append(request.getAge()).append("]");
        }
        if (request.getGender() != null && !request.getGender().isBlank()) {
            sb.append("\n[Patient gender: ").append(request.getGender()).append("]");
        }
        return sb.toString();
    }

    }
}