package com.medicycle.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InventoryResponse {
    private Long id;
    private Long medicineId;
    private String medicineName;
    private Integer availableQuantity;
    private Integer reservedQuantity;
    private Integer distributedQuantity;
    private Integer expiredQuantity;
    private LocalDateTime updatedAt;
}
