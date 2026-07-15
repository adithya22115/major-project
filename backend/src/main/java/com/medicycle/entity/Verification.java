package com.medicycle.entity;

import com.medicycle.enums.VerificationResult;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "verifications")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Verification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "donation_id", nullable = false)
    private MedicineDonation donation;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "verified_by_id", nullable = false)
    private User verifiedBy;

    private LocalDateTime verificationDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private VerificationResult result;

    private String remarks;

    @PrePersist
    protected void onCreate() {
        verificationDate = LocalDateTime.now();
    }
}
