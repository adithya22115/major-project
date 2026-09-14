package com.medicycle.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class DoctorAppointmentRequest {
    @NotBlank private String patientName;
    @NotBlank private String phone;
    @NotBlank private String specialty;
    @NotBlank private String consultationType;
    private String notes;
}
