package com.medicycle.dto.request;

import lombok.Data;

/**
 * Optional values supplied by the donor to compare with the medicine label.
 * The image itself is sent as the multipart part named {@code image}.
 */
@Data
public class ImageVerificationRequest {
    private String medicineName;
    private String dosage;
}
