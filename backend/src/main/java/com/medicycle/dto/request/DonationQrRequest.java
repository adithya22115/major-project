package com.medicycle.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class DonationQrRequest {
    @NotBlank private String medicineName;
    @NotBlank private String batchNumber;
    @NotBlank private String expiryDate;
    @NotNull private Integer quantity;
    private String packagingPhotoUrl;
    @NotNull private Long donorId;
    @NotBlank private String verificationStatus;
}
