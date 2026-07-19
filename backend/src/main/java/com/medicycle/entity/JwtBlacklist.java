package com.medicycle.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "jwt_blacklist")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JwtBlacklist {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 512)
    private String tokenJti;

    @Column(nullable = false)
    private LocalDateTime expiresAt;

    private LocalDateTime blacklistedAt;

    @PrePersist
    protected void onCreate() {
        blacklistedAt = LocalDateTime.now();
    }
}
