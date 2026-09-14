package com.medicycle.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AdminQueryRequest {
    @NotBlank
    private String query;
}
