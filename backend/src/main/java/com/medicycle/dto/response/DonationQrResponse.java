package com.medicycle.dto.response;

import lombok.Builder;
import lombok.Value;

import java.time.LocalDate;

@Value
@Builder
public class DonationQrResponse {
    Long donationId;
    String qrCodeToken;
    String qrCodeFileName;
    String medicineName;
    String batchNumber;
    LocalDate expiryDate;
    Integer quantity;
    Integer remainingQuantity;
    String packagingPhotoUrl;
    Long donorId;
    String verificationStatus;
}
