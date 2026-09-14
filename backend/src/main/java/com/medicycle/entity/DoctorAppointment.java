package com.medicycle.entity;

import com.medicycle.enums.AppointmentStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "doctor_appointments")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DoctorAppointment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    private User patient;

    @ManyToOne(fetch = FetchType.LAZY)
    private User doctor;

    @Column(nullable = false)
    private String patientName;

    @Column(nullable = false)
    private String phone;

    @Column(nullable = false)
    private String specialty;

    @Column(nullable = false)
    private String consultationType;

    @Column(length = 2000)
    private String notes;

    @Column(nullable = false)
    private LocalDateTime requestedAt;

    private LocalDateTime appointmentAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private AppointmentStatus status = AppointmentStatus.REQUESTED;

    @PrePersist
    void onCreate() {
        requestedAt = LocalDateTime.now();
    }
}
