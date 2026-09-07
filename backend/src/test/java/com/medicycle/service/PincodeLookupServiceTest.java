package com.medicycle.service;

import org.junit.jupiter.api.Test;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class PincodeLookupServiceTest {

    private final PincodeLookupService pincodeLookupService = new PincodeLookupService(new RestTemplate());

    @Test
    void lookup_shouldReturnMumbai_forKnownPincode() {
        Map<String, Object> result = pincodeLookupService.lookup("400001");

        assertEquals("400001", result.get("pincode"));
        assertEquals("Mumbai", result.get("city"));
        assertEquals("Maharashtra", result.get("state"));
        assertEquals("builtin", result.get("source"));
    }

    @Test
    void lookup_shouldReturnDelhi_forKnownPincode() {
        Map<String, Object> result = pincodeLookupService.lookup("110001");

        assertEquals("110001", result.get("pincode"));
        assertEquals("New Delhi", result.get("city"));
        assertEquals("Delhi", result.get("state"));
        assertEquals("builtin", result.get("source"));
    }

    @Test
    void lookup_shouldReturnBengaluru_forKnownPincode() {
        Map<String, Object> result = pincodeLookupService.lookup("560001");

        assertEquals("560001", result.get("pincode"));
        assertEquals("Bengaluru", result.get("city"));
        assertEquals("Karnataka", result.get("state"));
    }

    @Test
    void lookup_shouldReturnChennai_forKnownPincode() {
        Map<String, Object> result = pincodeLookupService.lookup("600001");

        assertEquals("Chennai", result.get("city"));
        assertEquals("Tamil Nadu", result.get("state"));
    }

    @Test
    void lookup_shouldReturnKolkata_forKnownPincode() {
        Map<String, Object> result = pincodeLookupService.lookup("700001");

        assertEquals("Kolkata", result.get("city"));
        assertEquals("West Bengal", result.get("state"));
    }

    @Test
    void lookup_shouldReturnHyderabad_forKnownPincode() {
        Map<String, Object> result = pincodeLookupService.lookup("500001");

        assertEquals("Hyderabad", result.get("city"));
        assertEquals("Telangana", result.get("state"));
    }

    @Test
    void lookup_shouldReturnNotFound_forUnknownPincode() {
        Map<String, Object> result = pincodeLookupService.lookup("999999");

        assertEquals("999999", result.get("pincode"));
        assertNull(result.get("city"));
        assertNull(result.get("state"));
        // Source will be either "not_found" or "api" depending on network
        assertNotNull(result.get("source"));
    }

    @Test
    void lookup_shouldReturnPune_forKnownPincode() {
        Map<String, Object> result = pincodeLookupService.lookup("411001");

        assertEquals("Pune", result.get("city"));
        assertEquals("Maharashtra", result.get("state"));
    }

    @Test
    void lookup_shouldReturnAhmedabad_forKnownPincode() {
        Map<String, Object> result = pincodeLookupService.lookup("380001");

        assertEquals("Ahmedabad", result.get("city"));
        assertEquals("Gujarat", result.get("state"));
    }

    @Test
    void lookup_shouldReturnJaipur_forKnownPincode() {
        Map<String, Object> result = pincodeLookupService.lookup("302001");

        assertEquals("Jaipur", result.get("city"));
        assertEquals("Rajasthan", result.get("state"));
    }
}
