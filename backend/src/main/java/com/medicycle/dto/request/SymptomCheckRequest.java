package com.medicycle.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SymptomCheckRequest {

    @NotBlank(message = "Symptom description is required")
    @Size(max = 2000, message = "Symptom description must not exceed 2000 characters")
    private String message;

    private List<ChatMessage> conversationHistory;

    private Integer age;

    private String gender;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ChatMessage {
        private String role; // "user" or "assistant"
        private String content;
    }
}
