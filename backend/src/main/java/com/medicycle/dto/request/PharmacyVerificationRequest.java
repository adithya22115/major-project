package com.medicycle.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.util.List;

@Data
public class PharmacyVerificationRequest {

    @NotBlank(message = "Pharmacy name is required")
    private String pharmacyName;

    @NotBlank(message = "License number is required")
    private String licenseNumber;

    @NotBlank(message = "Pharmacy address is required")
    private String pharmacyAddress;

    private String city;
    private String state;
    private String pincode;

    @NotBlank(message = "Contact phone is required")
    private String contactPhone;

    @NotBlank(message = "Contact email is required")
    @Email(message = "Invalid email format")
    private String contactEmail;

    private List<String> documentUrls;
}
