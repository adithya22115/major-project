package com.medicycle.dto.response;

import com.medicycle.enums.RequestStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MedicineRequestResponse {
    private Long id;
    private Long recipientId;
    private String recipientName;
    private Long medicineId;
    private String medicineName;
    private Integer requestedQuantity;
    private Long prescriptionId;
    private RequestStatus status;
    private Long approvedById;
    private String approvedByName;
    private LocalDateTime createdAt;
}
