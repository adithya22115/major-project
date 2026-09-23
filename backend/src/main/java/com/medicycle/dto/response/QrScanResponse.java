package com.medicycle.dto.response;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class QrScanResponse {
    boolean valid;
    String message;
    Long donationId;
    Long requestId;
    String medicineName;
    String batchNumber;
    String expiryDate;
    Integer quantity;
}
