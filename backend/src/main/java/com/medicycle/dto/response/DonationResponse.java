package com.medicycle.dto.response;

import com.medicycle.enums.DonationStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DonationResponse {
    private Long id;
    private Long donorId;
    private String donorName;
    private Long medicineId;
    private String medicineName;
    private String medicineCategory;
    private String medicineDosage;
    private Integer quantity;
    private String batchNumber;
    private LocalDate manufactureDate;
    private LocalDate expiryDate;
    private String condition;
    private DonationStatus status;
    private String remarks;
    private String city;
    private String state;
    private String pincode;
    private Double latitude;
    private Double longitude;
    private LocalDateTime createdAt;
    private List<String> imageUrls;
}
