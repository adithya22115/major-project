package com.medicycle.dto.response;

import lombok.Builder;
import lombok.Value;

import java.util.List;

@Value
@Builder
public class DemandForecastResponse {
    int monthsAnalyzed;
    List<MedicineForecast> forecasts;

    @Value
    @Builder
    public static class MedicineForecast {
        Long medicineId;
        String medicineName;
        long totalRequested;
        long averageMonthlyDemand;
        long projectedNextMonthDemand;
        String city;
    }
}
