package com.medicycle.dto.response;

import com.medicycle.enums.AppointmentStatus;
import lombok.Builder;
import lombok.Value;

import java.time.LocalDateTime;

@Value
@Builder
public class DoctorAppointmentResponse {
    Long id;
    String patientName;
    String phone;
    String specialty;
    String consultationType;
    String notes;
    String doctorName;
    LocalDateTime requestedAt;
    LocalDateTime appointmentAt;
    AppointmentStatus status;
}
