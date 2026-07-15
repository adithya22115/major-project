package com.medicycle.dto.response;

import com.medicycle.enums.VerificationResult;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VerificationResponse {
    private Long id;
    private Long donationId;
    private Long verifiedById;
    private String verifiedByName;
    private LocalDateTime verificationDate;
    private VerificationResult result;
    private String remarks;
}
