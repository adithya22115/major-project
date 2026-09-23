package com.medicycle.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmailCheckResponse {
    private String email;
    private boolean exists;      // true if user already registered with this email
    private boolean formatValid; // true if syntax format is valid
    private boolean domainValid; // true if domain has active mail exchanger (MX)
    private boolean available;   // true if email can be used for registration
    private String message;
}
