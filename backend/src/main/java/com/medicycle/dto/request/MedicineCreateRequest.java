package com.medicycle.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class MedicineCreateRequest {

    @NotBlank(message = "Medicine name is required")
    private String medicineName;

    private String manufacturer;
    private String category;
    private String dosage;
    private String description;
    private boolean requiresPrescription;
}
