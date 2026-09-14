package com.medicycle.dto.response;

import lombok.Builder;
import lombok.Value;

import java.util.List;

@Value
@Builder
public class AdminQueryResponse {
    String interpretation;
    List<DonationResponse> donations;
    List<MedicineRequestResponse> requests;
    List<MedicineResponse> medicines;
}
