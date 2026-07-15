package com.medicycle.dto.request;

import com.medicycle.enums.VerificationResult;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class VerificationRequest {

    @NotNull(message = "Verification result is required")
    private VerificationResult result;

    private String remarks;
}
