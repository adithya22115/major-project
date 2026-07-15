package com.medicycle.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class UpdateProfileRequest {

    private String name;
    private String phone;
    private String address;
    private String city;
    private String state;
    private String pincode;
}
