package com.medicycle.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ImageVerificationResponse {
    private String medicineName;
    private String dosage;
    private String expiryDate;
    private Integer quantity;
    private Double confidence;
    private boolean medicineNameMismatch;
    private boolean dosageMismatch;
    private boolean analysisAvailable;
    private List<String> warningFields;
    private List<String> warnings;
}
