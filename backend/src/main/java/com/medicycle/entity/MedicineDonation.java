package com.medicycle.entity;

import com.medicycle.enums.DonationStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "medicine_donations")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MedicineDonation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "donor_id", nullable = false)
    private User donor;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "medicine_id", nullable = false)
    private Medicine medicine;

    @Column(nullable = false)
    private Integer quantity;

    private String batchNumber;
    private LocalDate manufactureDate;
    private LocalDate expiryDate;

    @Column(name = "item_condition")
    private String condition;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private DonationStatus status = DonationStatus.PENDING;

    private String remarks;

    private String city;
    private String state;
    private String pincode;

    private Double latitude;
    private Double longitude;

    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
