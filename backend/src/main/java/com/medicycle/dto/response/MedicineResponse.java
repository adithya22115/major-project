package com.medicycle.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MedicineResponse {
    private Long id;
    private String medicineName;
    private String manufacturer;
    private String category;
    private String dosage;
    private String description;
    private boolean requiresPrescription;
}
