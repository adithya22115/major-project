package com.medicycle.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "medicines")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Medicine {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String medicineName;

    private String manufacturer;
    private String category;
    private String dosage;
    private String description;

    @Column(nullable = false)
    @Builder.Default
    private boolean requiresPrescription = false;
}
