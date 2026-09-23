package com.medicycle.entity;

import com.medicycle.enums.VerificationStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "doctor_verifications")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DoctorVerification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String doctorName;

    @Column(nullable = false)
    private String registrationNumber; // Medical Council Registration Number

    private String specialization;

    private String qualification; // e.g. MBBS, MD, MS

    private String clinicHospitalName;

    @Column(nullable = false)
    private String clinicAddress;

    private String city;
    private String state;
    private String pincode;

    @Column(nullable = false)
    private String contactPhone;

    @Column(nullable = false)
    private String contactEmail;

    @ElementCollection
    @CollectionTable(name = "doctor_verification_documents", joinColumns = @JoinColumn(name = "doctor_verification_id"))
    @Builder.Default
    private List<String> documentUrls = new ArrayList<>();

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private VerificationStatus status = VerificationStatus.PENDING;

    @Column(length = 1000)
    private String adminRemarks;

    private LocalDateTime submittedAt;
    private LocalDateTime reviewedAt;

    @PrePersist
    public void prePersist() {
        if (submittedAt == null) {
            submittedAt = LocalDateTime.now();
        }
    }
}
