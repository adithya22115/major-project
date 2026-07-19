package com.medicycle.dto.request;

import com.medicycle.enums.RoleType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class GuestRegisterRequest {

    @NotBlank(message = "Name is required")
    private String name;

    private String phone;

    @NotNull(message = "Role is required")
    private RoleType role;

    private String city;
    private String state;
    private String pincode;
    private Double latitude;
    private Double longitude;
}
