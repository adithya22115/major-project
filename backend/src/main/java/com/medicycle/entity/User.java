package com.medicycle.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String email;

    private String phone;

    @Column(nullable = false)
    private String password;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "role_id", nullable = false)
    private Role role;

    private String address;
    private String city;
    private String state;
    private String pincode;

    private Double latitude;
    private Double longitude;

    @Column(nullable = false)
    @Builder.Default
    private boolean isVerified = false;

    @Column(columnDefinition = "boolean default false")
    @Builder.Default
    private Boolean isTwoFactorEnabled = false;

    private String twoFactorSecret;

    @Column(columnDefinition = "integer default 0")
    @Builder.Default
    private Integer failedLoginAttempts = 0;

    private LocalDateTime lockedUntil;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
