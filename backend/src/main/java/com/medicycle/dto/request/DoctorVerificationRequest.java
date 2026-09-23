package com.medicycle.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DoctorVerificationRequest {

    @NotBlank(message = "Doctor name is required")
    private String doctorName;

    @NotBlank(message = "Medical registration number is required")
    private String registrationNumber;

    private String specialization;

    private String qualification;

    private String clinicHospitalName;

    @NotBlank(message = "Clinic address is required")
    private String clinicAddress;

    private String city;
    private String state;
    private String pincode;

    @NotBlank(message = "Contact phone is required")
    private String contactPhone;

    @NotBlank(message = "Contact email is required")
    private String contactEmail;

    @Builder.Default
    private List<String> documentUrls = new ArrayList<>();
}
