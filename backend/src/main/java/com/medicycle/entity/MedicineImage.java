package com.medicycle.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "medicine_images")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MedicineImage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "donation_id", nullable = false)
    private MedicineDonation donation;

    @Column(nullable = false)
    private String imageUrl;

    private String imageType;
}
