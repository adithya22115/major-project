package com.medicycle.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.medicycle.dto.request.SymptomCheckRequest;
import com.medicycle.dto.response.SymptomCheckResponse;
import io.netty.channel.ChannelOption;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.netty.http.client.HttpClient;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@Slf4j
public class HealthAssistantService {

    private static final int MAX_HISTORY_MESSAGES = 12;
    private static final int MAX_HISTORY_MESSAGE_LENGTH = 1200;

    private final WebClient webClient;
    private final ObjectMapper objectMapper;

    // LLM (OpenAI-compatible Chat Completions) configuration
    private final String apiKey;
    private final String apiUrl;
    private final String model;
    private final int maxTokens;
    private final int timeoutSeconds;

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
            @Value("${llm.api.key:}") String apiKey,
            @Value("${llm.api.url:https://api.openai.com/v1/chat/completions}") String apiUrl,
            @Value("${llm.model:gpt-4o-mini}") String model,
            @Value("${llm.max-tokens:1024}") int maxTokens,
            @Value("${llm.timeout-seconds:15}") int timeoutSeconds,
            ObjectMapper objectMapper) {
        this.apiKey = apiKey;
        this.apiUrl = apiUrl;
        this.model = model;
        this.maxTokens = maxTokens;
        this.timeoutSeconds = timeoutSeconds;
        this.objectMapper = objectMapper;

        // Hard connect + read timeouts so a hung upstream never stalls the demo.
        HttpClient httpClient = HttpClient.create()
                .option(ChannelOption.CONNECT_TIMEOUT_MILLIS, timeoutSeconds * 1000)
                .responseTimeout(Duration.ofSeconds(timeoutSeconds));
        this.webClient = WebClient.builder()
                .clientConnector(new ReactorClientHttpConnector(httpClient))
                .codecs(configurer -> configurer.defaultCodecs().maxInMemorySize(1024 * 1024))
                .build();
    }

    public SymptomCheckResponse analyzeSymptoms(SymptomCheckRequest request) {
        // No API key configured: skip the network entirely and answer instantly.
        // This keeps the feature working during demos even without credentials.
        if (!StringUtils.hasText(apiKey)) {
            log.debug("No LLM API key configured, using internal fallback");
            return generateFallbackAnalysis(request);
        }

        try {
            String llmResponse = callLlm(request);
            return parseLlmResponse(llmResponse);
        } catch (Exception ex) {
            log.warn("LLM API call failed ({}), using internal fallback", ex.getMessage());
            return generateFallbackAnalysis(request);
        }
    }

    private String callLlm(SymptomCheckRequest request) throws Exception {
        ObjectNode root = objectMapper.createObjectNode();
        root.put("model", model);
        root.put("max_tokens", maxTokens);
        root.put("temperature", 0.5);

        ArrayNode messages = root.putArray("messages");
        ObjectNode systemMessage = messages.addObject();
        systemMessage.put("role", "system");
        systemMessage.put("content", SYSTEM_PROMPT);

        for (SymptomCheckRequest.ChatMessage msg : recentHistory(request.getConversationHistory())) {
                String role = "user".equalsIgnoreCase(msg.getRole()) ? "user" : "assistant";
                ObjectNode historyMessage = messages.addObject();
                historyMessage.put("role", role);
                historyMessage.put("content", msg.getContent());
        }

        ObjectNode userMessage = messages.addObject();
        userMessage.put("role", "user");
        userMessage.put("content", buildUserMessage(request));

        String requestBody = objectMapper.writeValueAsString(root);

        String responseBody = webClient.post()
                .uri(apiUrl)
                .header("Authorization", "Bearer " + apiKey)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(requestBody)
                .retrieve()
                .bodyToMono(String.class)
                .timeout(Duration.ofSeconds(timeoutSeconds))
                .block();

        if (responseBody == null || responseBody.isBlank()) {
            throw new RuntimeException("Empty response from LLM API");
        }
        return responseBody;
    }

    private SymptomCheckResponse parseLlmResponse(String responseBody) {
        try {
            JsonNode root = objectMapper.readTree(responseBody);
            JsonNode choices = root.path("choices");
            if (!choices.isArray() || choices.isEmpty()) {
                return buildErrorResponse("Unexpected response format from the AI service.");
            }

            String content = choices.get(0).path("message").path("content").asText("");
            if (content.isBlank()) {
                return buildErrorResponse("Empty response from the AI service.");
            }

            List<String> conditions = extractConditions(content);
            String severity = extractSeverity(content);
            boolean seekDoctor = content.toUpperCase().contains("SEEK_DOCTOR: YES")
                    || "HIGH".equals(severity)
                    || content.toLowerCase().contains("see a doctor")
                    || content.toLowerCase().contains("seek medical")
                    || content.toLowerCase().contains("consult a doctor");
            String cleanResponse = cleanAiResponse(content);

            return SymptomCheckResponse.builder()
                    .aiResponse(cleanResponse)
                    .possibleConditions(conditions)
                    .severity(severity)
                    .seekDoctorAdvice(seekDoctor)
                    .build();

        } catch (Exception e) {
            log.error("Error parsing LLM response: {}", responseBody, e);
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
        List<SymptomCheckRequest.ChatMessage> history = recentHistory(request.getConversationHistory());
        String msg = buildMemoryAwareMessage(request, history).toLowerCase();

        List<String> conditions = new ArrayList<>();
        String severity = "LOW";
        boolean seekDoctor = false;
        StringBuilder advice = new StringBuilder();

        if (!history.isEmpty()) {
            advice.append("Thanks for the update. I’m using what you shared earlier in this conversation together with your latest message.\n\n");
        } else {
            advice.append("Hello! I have evaluated the symptoms you described:\n\n");
        }

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
    }

    private String buildUserMessage(SymptomCheckRequest request) {
        StringBuilder sb = new StringBuilder();
        sb.append(request.getMessage());
        if (request.getAge() != null) {
            sb.append("\n[Patient age: ").append(request.getAge()).append("]");
        }
        if (request.getGender() != null && !request.getGender().isBlank()) {
            sb.append("\n[Patient gender: ").append(request.getGender()).append("]");
        }
        return sb.toString();
    }

    private List<SymptomCheckRequest.ChatMessage> recentHistory(
            List<SymptomCheckRequest.ChatMessage> history) {
        if (history == null || history.isEmpty()) {
            return List.of();
        }

        List<SymptomCheckRequest.ChatMessage> validHistory = history.stream()
                .filter(msg -> msg != null
                        && StringUtils.hasText(msg.getContent())
                        && ("user".equalsIgnoreCase(msg.getRole())
                        || "assistant".equalsIgnoreCase(msg.getRole())))
                .map(msg -> SymptomCheckRequest.ChatMessage.builder()
                        .role(msg.getRole().toLowerCase())
                        .content(msg.getContent().trim()
                                .substring(0, Math.min(msg.getContent().trim().length(),
                                        MAX_HISTORY_MESSAGE_LENGTH)))
                        .build())
                .skip(Math.max(0, history.size() - MAX_HISTORY_MESSAGES))
                .toList();
        int start = Math.max(0, validHistory.size() - MAX_HISTORY_MESSAGES);
        return validHistory.subList(start, validHistory.size());
    }

    private String buildMemoryAwareMessage(
            SymptomCheckRequest request,
            List<SymptomCheckRequest.ChatMessage> history) {
        StringBuilder combined = new StringBuilder();
        history.stream()
                .filter(msg -> "user".equals(msg.getRole()))
                .forEach(msg -> combined.append(msg.getContent()).append('\n'));
        combined.append(request.getMessage() == null ? "" : request.getMessage());
        return combined.toString();
    }

}