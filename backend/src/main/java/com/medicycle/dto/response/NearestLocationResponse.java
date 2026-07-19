package com.medicycle.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NearestLocationResponse {
    private Long medicineId;
    private String medicineName;
    private String requestedCity;
    private boolean availableInCity;
    private List<LocationAvailability> nearestLocations;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class LocationAvailability {
        private String city;
        private String state;
        private String pincode;
        private Double latitude;
        private Double longitude;
        private double distanceKm;
        private int availableQuantity;
        private long donationCount;
        private String directionsUrl;
    }
}
