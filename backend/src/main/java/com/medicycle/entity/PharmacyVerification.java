package com.medicycle.entity;

import com.medicycle.enums.VerificationStatus;
import com.medicycle.enums.VerificationType;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "pharmacy_verifications")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PharmacyVerification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String pharmacyName;

    @Column(nullable = false)
    private String licenseNumber;

    @Column(nullable = false)
    private String pharmacyAddress;

    private String city;
    private String state;
    private String pincode;

    @Column(nullable = false)
    private String contactPhone;

    @Column(nullable = false)
    private String contactEmail;

    @ElementCollection
    @CollectionTable(name = "verification_documents", joinColumns = @JoinColumn(name = "verification_id"))
    @Builder.Default
    private List<String> documentUrls = new ArrayList<>();

    @Enumerated(EnumType.STRING)
    @Column(name = "verification_type", nullable = false, length = 50)
    @Builder.Default
    private VerificationType verificationType = VerificationType.PHARMACY;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private VerificationStatus status = VerificationStatus.PENDING;

    private String adminRemarks;

    private LocalDateTime submittedAt;
    private LocalDateTime reviewedAt;
    private LocalDateTime expiresAt;

    @PrePersist
    protected void onCreate() {
        submittedAt = LocalDateTime.now();
        if (status == VerificationStatus.PENDING) {
            expiresAt = submittedAt.plusDays(30);
        }
    }

    @PreUpdate
    protected void onUpdate() {
        if (status != VerificationStatus.PENDING && reviewedAt == null) {
            reviewedAt = LocalDateTime.now();
        }
    }
}
