package com.medicycle.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class QrScanRequest {
    @NotBlank private String qrCodeToken;
    @NotNull private Long requestId;
}
