package com.medicycle.dto.request;

import com.medicycle.enums.VerificationType;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.util.List;

@Data
public class PharmacyVerificationRequest {

    // For pharmacy: pharmacy name; for doctor: clinic/practice name
    private String pharmacyName;

    // For pharmacy: drug license number; for doctor: medical registration number
    private String licenseNumber;

    @NotBlank(message = "Address is required")
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

    // PHARMACY (default) or DOCTOR
    private VerificationType verificationType = VerificationType.PHARMACY;
}
