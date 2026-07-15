package com.medicycle.dto.request;

import com.medicycle.enums.RequestStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class RequestStatusUpdate {

    @NotNull(message = "Status is required")
    private RequestStatus status;

    private String remarks;
}
