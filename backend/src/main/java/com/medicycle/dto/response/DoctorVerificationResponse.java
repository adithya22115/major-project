package com.medicycle.dto.response;

import com.medicycle.enums.VerificationStatus;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DoctorVerificationResponse {

    private Long id;
    private Long userId;
    private String userName;
    private String userEmail;

    private String doctorName;
    private String registrationNumber;
    private String specialization;
    private String qualification;
    private String clinicHospitalName;
    private String clinicAddress;
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
}
