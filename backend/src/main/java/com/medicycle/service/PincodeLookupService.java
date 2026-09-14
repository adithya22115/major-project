package com.medicycle.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class PincodeLookupService {

    private final RestTemplate restTemplate;

    private static final Map<String, Map<String, String>> FALLBACK_PINCODES = new HashMap<>();

    static {
        addFallback("110001", "New Delhi", "Delhi");
        addFallback("110002", "New Delhi", "Delhi");
        addFallback("110003", "New Delhi", "Delhi");
        addFallback("400001", "Mumbai", "Maharashtra");
        addFallback("400002", "Mumbai", "Maharashtra");
        addFallback("400003", "Mumbai", "Maharashtra");
        addFallback("400004", "Mumbai", "Maharashtra");
        addFallback("400005", "Mumbai", "Maharashtra");
        addFallback("400020", "Mumbai", "Maharashtra");
        addFallback("400049", "Mumbai", "Maharashtra");
        addFallback("400053", "Mumbai", "Maharashtra");
        addFallback("400070", "Mumbai", "Maharashtra");
        addFallback("400086", "Mumbai", "Maharashtra");
        addFallback("400092", "Mumbai", "Maharashtra");
        addFallback("411001", "Pune", "Maharashtra");
        addFallback("411002", "Pune", "Maharashtra");
        addFallback("411003", "Pune", "Maharashtra");
        addFallback("411004", "Pune", "Maharashtra");
        addFallback("411005", "Pune", "Maharashtra");
        addFallback("411006", "Pune", "Maharashtra");
        addFallback("411007", "Pune", "Maharashtra");
        addFallback("411008", "Pune", "Maharashtra");
        addFallback("560001", "Bengaluru", "Karnataka");
        addFallback("560002", "Bengaluru", "Karnataka");
        addFallback("560003", "Bengaluru", "Karnataka");
        addFallback("560004", "Bengaluru", "Karnataka");
        addFallback("560005", "Bengaluru", "Karnataka");
        addFallback("560034", "Bengaluru", "Karnataka");
        addFallback("600001", "Chennai", "Tamil Nadu");
        addFallback("600002", "Chennai", "Tamil Nadu");
        addFallback("600003", "Chennai", "Tamil Nadu");
        addFallback("600004", "Chennai", "Tamil Nadu");
        addFallback("600005", "Chennai", "Tamil Nadu");
        addFallback("600006", "Chennai", "Tamil Nadu");
        addFallback("700001", "Kolkata", "West Bengal");
        addFallback("700002", "Kolkata", "West Bengal");
        addFallback("700003", "Kolkata", "West Bengal");
        addFallback("700004", "Kolkata", "West Bengal");
        addFallback("700005", "Kolkata", "West Bengal");
        addFallback("700006", "Kolkata", "West Bengal");
        addFallback("700007", "Kolkata", "West Bengal");
        addFallback("700008", "Kolkata", "West Bengal");
        addFallback("500001", "Hyderabad", "Telangana");
        addFallback("500002", "Hyderabad", "Telangana");
        addFallback("500003", "Hyderabad", "Telangana");
        addFallback("500004", "Hyderabad", "Telangana");
        addFallback("500005", "Hyderabad", "Telangana");
        addFallback("380001", "Ahmedabad", "Gujarat");
        addFallback("380002", "Ahmedabad", "Gujarat");
        addFallback("380003", "Ahmedabad", "Gujarat");
        addFallback("380004", "Ahmedabad", "Gujarat");
        addFallback("380005", "Ahmedabad", "Gujarat");
        addFallback("302001", "Jaipur", "Rajasthan");
        addFallback("302002", "Jaipur", "Rajasthan");
        addFallback("302003", "Jaipur", "Rajasthan");
        addFallback("302004", "Jaipur", "Rajasthan");
        addFallback("302005", "Jaipur", "Rajasthan");
        addFallback("226001", "Lucknow", "Uttar Pradesh");
        addFallback("226002", "Lucknow", "Uttar Pradesh");
        addFallback("226003", "Lucknow", "Uttar Pradesh");
        addFallback("226004", "Lucknow", "Uttar Pradesh");
        addFallback("226005", "Lucknow", "Uttar Pradesh");
        addFallback("462001", "Bhopal", "Madhya Pradesh");
        addFallback("462002", "Bhopal", "Madhya Pradesh");
        addFallback("462003", "Bhopal", "Madhya Pradesh");
        addFallback("462004", "Bhopal", "Madhya Pradesh");
        addFallback("462005", "Bhopal", "Madhya Pradesh");
        addFallback("800001", "Patna", "Bihar");
        addFallback("800002", "Patna", "Bihar");
        addFallback("800003", "Patna", "Bihar");
        addFallback("800004", "Patna", "Bihar");
        addFallback("800005", "Patna", "Bihar");
        addFallback("682001", "Kochi", "Kerala");
        addFallback("682002", "Kochi", "Kerala");
        addFallback("682003", "Kochi", "Kerala");
        addFallback("682004", "Kochi", "Kerala");
        addFallback("682005", "Kochi", "Kerala");
    }

    private static final Map<String, double[]> CITY_COORDINATES = new HashMap<>();
    static {
        CITY_COORDINATES.put("New Delhi", new double[]{28.6139, 77.2090});
        CITY_COORDINATES.put("Mumbai", new double[]{19.0760, 72.8777});
        CITY_COORDINATES.put("Pune", new double[]{18.5204, 73.8567});
        CITY_COORDINATES.put("Bengaluru", new double[]{12.9716, 77.5946});
        CITY_COORDINATES.put("Chennai", new double[]{13.0827, 80.2707});
        CITY_COORDINATES.put("Kolkata", new double[]{22.5726, 88.3639});
        CITY_COORDINATES.put("Hyderabad", new double[]{17.3850, 78.4867});
        CITY_COORDINATES.put("Ahmedabad", new double[]{23.0225, 72.5714});
        CITY_COORDINATES.put("Jaipur", new double[]{26.9124, 75.7873});
        CITY_COORDINATES.put("Lucknow", new double[]{26.8467, 80.9462});
        CITY_COORDINATES.put("Bhopal", new double[]{23.2599, 77.4126});
        CITY_COORDINATES.put("Patna", new double[]{25.6093, 85.1376});
        CITY_COORDINATES.put("Kochi", new double[]{9.9312, 76.2673});
    }

    private static void addFallback(String pincode, String city, String state) {
        Map<String, String> entry = new HashMap<>();
        entry.put("city", city);
        entry.put("state", state);
        FALLBACK_PINCODES.put(pincode, entry);
    }

    public Map<String, Object> lookupByCoordinates(Double latitude, Double longitude) {
        Map<String, Object> result = new HashMap<>();
        result.put("latitude", latitude);
        result.put("longitude", longitude);

        try {
            String url = "https://nominatim.openstreetmap.org/reverse?lat=" + latitude + "&lon=" + longitude + "&format=json&addressdetails=1";
            HttpHeaders headers = new HttpHeaders();
            headers.set("User-Agent", "MediCycle/1.0 (medicine donation platform; contact: support@medicycle.local)");
            @SuppressWarnings("unchecked")
            Map<String, Object> response = restTemplate.exchange(
                    url, HttpMethod.GET, new HttpEntity<>(headers), Map.class).getBody();

            if (response != null) {
                @SuppressWarnings("unchecked")
                Map<String, Object> address = (Map<String, Object>) response.get("address");
                if (address != null) {
                    String city = (String) address.get("city");
                    if (city == null) city = (String) address.get("town");
                    if (city == null) city = (String) address.get("village");
                    if (city == null) city = (String) address.get("county");
                    String state = (String) address.get("state");
                    String pincode = (String) address.get("postcode");

                    result.put("city", city);
                    result.put("state", state);
                    result.put("pincode", pincode);
                    result.put("source", "nominatim");
                    return result;
                }
            }
        } catch (Exception e) {
            log.warn("Reverse geocoding failed for {},{}: {}", latitude, longitude, e.getMessage());
        }

        double minDist = Double.MAX_VALUE;
        String nearestCity = null;
        String nearestState = null;
        String nearestPincode = null;
        for (Map.Entry<String, double[]> entry : CITY_COORDINATES.entrySet()) {
            double[] coords = entry.getValue();
            double dist = Math.sqrt(Math.pow(latitude - coords[0], 2) + Math.pow(longitude - coords[1], 2));
            if (dist < minDist) {
                minDist = dist;
                nearestCity = entry.getKey();
                final String cityLookup = nearestCity;
                nearestPincode = FALLBACK_PINCODES.entrySet().stream()
                        .filter(e -> e.getValue().get("city").equals(cityLookup))
                        .map(Map.Entry::getKey)
                        .findFirst().orElse(null);
                nearestState = nearestPincode != null ? FALLBACK_PINCODES.get(nearestPincode).get("state") : null;
            }
        }

        result.put("city", nearestCity);
        result.put("state", nearestState);
        result.put("pincode", nearestPincode);
        result.put("source", nearestCity != null ? "fallback" : "not_found");
        return result;
    }

    public Map<String, Object> lookup(String pincode) {
        Map<String, String> fallback = FALLBACK_PINCODES.get(pincode);
        if (fallback != null) {
            Map<String, Object> result = new HashMap<>();
            result.put("pincode", pincode);
            result.put("city", fallback.get("city"));
            result.put("state", fallback.get("state"));
            result.put("source", "builtin");
            return result;
        }

        try {
            String url = "https://api.postalpincode.in/pincode/" + pincode;
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> response = restTemplate.getForObject(url, List.class);

            if (response != null && !response.isEmpty()) {
                Map<String, Object> first = response.get(0);
                if ("Success".equals(first.get("Status"))) {
                    @SuppressWarnings("unchecked")
                    List<Map<String, Object>> postOffices = (List<Map<String, Object>>) first.get("Post Office");
                    if (postOffices != null && !postOffices.isEmpty()) {
                        Map<String, Object> po = postOffices.get(0);
                        Map<String, Object> result = new HashMap<>();
                        result.put("pincode", pincode);
                        result.put("city", po.get("District") != null ? po.get("District").toString() : po.get("Name").toString());
                        result.put("state", po.get("State"));
                        result.put("source", "api");
                        return result;
                    }
                }
            }
        } catch (Exception e) {
            log.warn("Pincode API lookup failed for {}: {}", pincode, e.getMessage());
        }

        Map<String, Object> result = new HashMap<>();
        result.put("pincode", pincode);
        result.put("city", null);
        result.put("state", null);
        result.put("source", "not_found");
        return result;
    }
}
