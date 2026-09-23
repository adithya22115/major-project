package com.medicycle.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class InventoryAdjustmentRequest {
    @NotNull
    private Long medicineId;

    @NotNull
    @Min(1)
    private Integer quantity;

    @NotNull
    private AdjustmentType type;

    private String reason;

    public enum AdjustmentType {
        ADD, REMOVE
    }
}
