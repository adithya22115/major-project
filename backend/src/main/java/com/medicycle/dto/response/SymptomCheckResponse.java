package com.medicycle.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SymptomCheckResponse {

    private String aiResponse;

    private List<String> possibleConditions;

    private String severity; // LOW, MEDIUM, HIGH

    private boolean seekDoctorAdvice;

    @Builder.Default
    private String disclaimer = "This is not a medical diagnosis. The information provided is for "
            + "educational purposes only. Always consult a qualified healthcare professional "
            + "for proper diagnosis and treatment.";
}
