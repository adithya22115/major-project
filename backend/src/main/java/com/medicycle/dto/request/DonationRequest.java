package com.medicycle.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;

@Data
public class DonationRequest {

    private Long medicineId;

    private String medicineName;
    private String manufacturer;
    private String category;
    private String dosage;
    private String description;
    private boolean requiresPrescription;

    @NotNull(message = "Quantity is required")
    @Min(value = 1, message = "Quantity must be at least 1")
    private Integer quantity;

    private String batchNumber;
    private LocalDate manufactureDate;
    private LocalDate expiryDate;
    private String condition;
    private String remarks;
    private List<String> imageUrls;
}
