package com.medicycle.dto.response;

import com.medicycle.enums.VerificationStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PharmacyVerificationResponse {
    private Long id;
    private Long userId;
    private String userName;
    private String userEmail;
    private String pharmacyName;
    private String licenseNumber;
    private String pharmacyAddress;
    private String city;
    private String state;
    private String pincode;
    private String contactPhone;
    private String contactEmail;
    private List<String> documentUrls;
    private VerificationStatus status;
    private String adminRemarks;
    private LocalDateTime submittedAt;
    private LocalDateTime reviewedAt;
    private LocalDateTime expiresAt;
}
