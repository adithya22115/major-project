package com.medicycle.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.medicycle.dto.request.ImageVerificationRequest;
import com.medicycle.dto.response.ImageVerificationResponse;
import io.netty.channel.ChannelOption;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.netty.http.client.HttpClient;

import java.io.IOException;
import java.time.Duration;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Service
@Slf4j
public class MedicineImageAnalysisService {
    private static final String PROMPT = """
            Follow this decision order: first determine whether medicine packaging is visible.
            If packaging is not available, set packagingAvailable=false and do not guess any text.
            If packaging is visible, read the medicine packaging and expiry date. Return ONLY valid JSON (no markdown)
            with exactly these keys: medicineName (string or null), dosage (string or null),
            batchNumber (string or null),
            expiryDate (YYYY-MM-DD string or null), quantity (positive integer or null),
            confidence (number from 0 to 1), packagingAvailable (boolean).
            Do not guess values that are not legible.
            """;

    private final WebClient webClient;
    private final ObjectMapper objectMapper;
    private final String apiKey;
    private final String apiUrl;
    private final String model;
    private final int maxTokens;
    private final int timeoutSeconds;
    private final long maxImageSize;

    public MedicineImageAnalysisService(
            @Value("${medicine.analysis.api.key:}") String apiKey,
            @Value("${medicine.analysis.api.url:https://api.openai.com/v1/chat/completions}") String apiUrl,
            @Value("${medicine.analysis.model:gpt-4o-mini}") String model,
            @Value("${llm.max-tokens:1024}") int maxTokens,
            @Value("${medicine.analysis.timeout-seconds:20}") int timeoutSeconds,
            @Value("${medicine.analysis.max-image-bytes:5242880}") long maxImageSize,
            ObjectMapper objectMapper) {
        this.apiKey = apiKey;
        this.apiUrl = apiUrl;
        this.model = model;
        this.maxTokens = maxTokens;
        this.timeoutSeconds = timeoutSeconds;
        this.maxImageSize = maxImageSize;
        this.objectMapper = objectMapper;
        HttpClient client = HttpClient.create()
                .option(ChannelOption.CONNECT_TIMEOUT_MILLIS, timeoutSeconds * 1000)
                .responseTimeout(Duration.ofSeconds(timeoutSeconds));
        this.webClient = WebClient.builder()
                .clientConnector(new ReactorClientHttpConnector(client))
                .codecs(c -> c.defaultCodecs().maxInMemorySize(1024 * 1024))
                .build();
    }

    public ImageVerificationResponse analyze(MultipartFile image, ImageVerificationRequest request) {
        validateImage(image);
        String suppliedName = clean(request == null ? null : request.getMedicineName());
        String suppliedDosage = clean(request == null ? null : request.getDosage());
        List<String> warnings = new ArrayList<>();
        ImageVerificationResponse response;

        if (!StringUtils.hasText(apiKey)) {
            warnings.add("AI image analysis is unavailable because no API key is configured.");
            response = fallback(suppliedName, suppliedDosage, warnings);
        } else {
            try {
                response = parse(callVision(image), suppliedName, suppliedDosage);
            } catch (Exception ex) {
                log.warn("Medicine image analysis failed: {}", ex.getMessage());
                warnings.add("AI image analysis could not be completed; please verify the label manually.");
                response = fallback(suppliedName, suppliedDosage, warnings);
            }
        }
        return applySafetyDecision(addComparisons(response, suppliedName, suppliedDosage));
    }

    private String callVision(MultipartFile image) throws Exception {
        String mediaType = image.getContentType().toLowerCase(Locale.ROOT);
        String dataUri = "data:" + mediaType + ";base64," +
                java.util.Base64.getEncoder().encodeToString(image.getBytes());
        ObjectNode root = objectMapper.createObjectNode();
        root.put("model", model);
        root.put("max_tokens", maxTokens);
        ArrayNode messages = root.putArray("messages");
        messages.addObject().put("role", "system").put("content", PROMPT);
        ObjectNode user = messages.addObject();
        user.put("role", "user");
        ArrayNode content = user.putArray("content");
        content.addObject().put("type", "text").put("text", "Analyze this medicine image.");
        content.addObject().put("type", "image_url").putObject("image_url").put("url", dataUri);
        String body = webClient.post().uri(apiUrl)
                .header("Authorization", "Bearer " + apiKey)
                .contentType(MediaType.APPLICATION_JSON).bodyValue(objectMapper.writeValueAsString(root))
                .retrieve().bodyToMono(String.class).timeout(Duration.ofSeconds(timeoutSeconds)).block();
        if (!StringUtils.hasText(body)) throw new IOException("Empty vision response");
        return body;
    }

    private ImageVerificationResponse parse(String body, String suppliedName, String suppliedDosage) throws IOException {
        JsonNode choices = objectMapper.readTree(body).path("choices");
        if (!choices.isArray() || choices.isEmpty()) throw new IOException("Invalid vision response");
        String text = choices.get(0).path("message").path("content").asText("");
        JsonNode json = objectMapper.readTree(stripCodeFence(text));
        String expiry = validDate(json.path("expiryDate").asText(null));
        Integer quantity = validQuantity(json.path("quantity").asInt(0));
        Double confidence = validConfidence(json.path("confidence").asDouble(-1));
        boolean packagingAvailable = json.path("packagingAvailable").asBoolean(true);
        List<String> fields = new ArrayList<>();
        if (json.path("medicineName").asText("").isBlank()) fields.add("medicineName");
        if (json.path("dosage").asText("").isBlank()) fields.add("dosage");
        if (expiry == null) fields.add("expiryDate");
        if (quantity == null) fields.add("quantity");
        return ImageVerificationResponse.builder().medicineName(clean(json.path("medicineName").asText(null)))
                .batchNumber(clean(json.path("batchNumber").asText(null)))
                .dosage(clean(json.path("dosage").asText(null))).expiryDate(expiry).quantity(quantity)
                .confidence(confidence).analysisAvailable(true).packagingAvailable(packagingAvailable)
                .warningFields(fields).warnings(new ArrayList<>()).build();
    }

    private ImageVerificationResponse fallback(String name, String dosage, List<String> warnings) {
        return ImageVerificationResponse.builder().medicineName(name).dosage(dosage).analysisAvailable(false)
                .packagingAvailable(false).decision("MANUAL_VERIFICATION")
                .confidence(null).warningFields(List.of("medicineName", "dosage", "expiryDate", "quantity"))
                .warnings(warnings).build();
    }

    private ImageVerificationResponse applySafetyDecision(ImageVerificationResponse response) {
        if (!response.isPackagingAvailable()) {
            response.setDecision("MANUAL_VERIFICATION");
            response.getWarnings().add("Packaging is unavailable or not visible. Manual verification is required.");
            return response;
        }
        if (response.getExpiryDate() == null) {
            response.setDecision("MANUAL_VERIFICATION");
            response.getWarnings().add("Expiry date could not be read. Manual verification is required.");
            return response;
        }
        boolean expired = LocalDate.parse(response.getExpiryDate()).isBefore(LocalDate.now());
        response.setExpiryExpired(expired);
        response.setDecision(expired ? "REJECT" : "CONTINUE");
        if (expired) response.getWarnings().add("The medicine is expired and must be rejected.");
        return response;
    }

    private ImageVerificationResponse addComparisons(ImageVerificationResponse response, String name, String dosage) {
        response.setMedicineNameMismatch(StringUtils.hasText(name) && StringUtils.hasText(response.getMedicineName())
                && !name.equalsIgnoreCase(response.getMedicineName().trim()));
        response.setDosageMismatch(StringUtils.hasText(dosage) && StringUtils.hasText(response.getDosage())
                && !dosage.equalsIgnoreCase(response.getDosage().trim()));
        if (response.isMedicineNameMismatch()) response.getWarnings().add("Medicine name does not match the supplied value.");
        if (response.isDosageMismatch()) response.getWarnings().add("Dosage does not match the supplied value.");
        return response;
    }

    private void validateImage(MultipartFile image) {
        if (image == null || image.isEmpty()) throw new IllegalArgumentException("An image is required.");
        if (image.getSize() > maxImageSize) throw new IllegalArgumentException("Image exceeds the configured size limit.");
        String type = image.getContentType();
        if (type == null || !type.toLowerCase(Locale.ROOT).startsWith("image/"))
            throw new IllegalArgumentException("Only image files are accepted.");
        try {
            byte[] bytes = image.getBytes();
            boolean signature = (bytes.length >= 3 && bytes[0] == (byte) 0xff && bytes[1] == (byte) 0xd8 && bytes[2] == (byte) 0xff)
                    || (bytes.length >= 8 && bytes[0] == (byte) 0x89 && bytes[1] == 0x50 && bytes[2] == 0x4e && bytes[3] == 0x47)
                    || (bytes.length >= 6 && new String(bytes, 0, 6).startsWith("GIF"))
                    || (bytes.length >= 12 && new String(bytes, 8, 4).equals("WEBP"));
            if (!signature) throw new IllegalArgumentException("The uploaded file is not a supported image.");
        } catch (IOException ex) {
            throw new IllegalArgumentException("Unable to read the uploaded image.");
        }
    }

    private String stripCodeFence(String text) { return text.replaceFirst("^```json\\s*", "").replaceFirst("```\\s*$", "").trim(); }
    private String clean(String value) { return StringUtils.hasText(value) ? value.trim() : null; }
    private String validDate(String value) {
        if (value == null || !value.matches("\\d{4}-\\d{2}-\\d{2}")) return null;
        try {
            LocalDate.parse(value);
            return value;
        } catch (DateTimeParseException ignored) {
            return null;
        }
    }
    private Integer validQuantity(int value) { return value > 0 && value <= 100000 ? value : null; }
    private Double validConfidence(double value) { return value >= 0 && value <= 1 ? value : null; }
}
