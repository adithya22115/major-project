package com.medicycle.service;

import com.medicycle.dto.request.ChangePasswordRequest;
import com.medicycle.dto.request.UpdateProfileRequest;
import com.medicycle.dto.response.UserResponse;
import com.medicycle.entity.User;
import com.medicycle.exception.ResourceNotFoundException;
import com.medicycle.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final AuditService auditService;
    private final PasswordEncoder passwordEncoder;
    private final PincodeLookupService pincodeLookupService;

    @Transactional(readOnly = true)
    public UserResponse getProfile(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));
        return DtoMapper.toUserResponse(user);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getProfileAsMap(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));
        Map<String, Object> map = new HashMap<>();
        map.put("id", user.getId());
        map.put("name", user.getName());
        map.put("email", user.getEmail());
        map.put("phone", user.getPhone());
        map.put("role", user.getRole().getRoleName());
        map.put("address", user.getAddress());
        map.put("city", user.getCity());
        map.put("state", user.getState());
        map.put("pincode", user.getPincode());
        map.put("latitude", user.getLatitude());
        map.put("longitude", user.getLongitude());
        map.put("isVerified", user.isVerified());
        map.put("createdAt", user.getCreatedAt());
        map.put("updatedAt", user.getUpdatedAt());
        return map;
    }

    @Transactional
    public UserResponse updateProfile(Long userId, UpdateProfileRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));

        if (request.getName() != null) user.setName(request.getName());
        if (request.getPhone() != null) user.setPhone(request.getPhone());
        if (request.getAddress() != null) user.setAddress(request.getAddress());
        if (request.getCity() != null) user.setCity(request.getCity());
        if (request.getState() != null) user.setState(request.getState());
        if (request.getPincode() != null) user.setPincode(request.getPincode());

        user = userRepository.save(user);
        auditService.log(user, "PROFILE_UPDATED", "User", user.getId());
        return DtoMapper.toUserResponse(user);
    }

    @Transactional
    public Map<String, Object> updateProfileFromMap(Long userId, Map<String, String> body) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));

        if (body.containsKey("name")) user.setName(body.get("name"));
        if (body.containsKey("phone")) user.setPhone(body.get("phone"));
        if (body.containsKey("address")) user.setAddress(body.get("address"));
        if (body.containsKey("city")) user.setCity(body.get("city"));
        if (body.containsKey("state")) user.setState(body.get("state"));
        if (body.containsKey("pincode")) user.setPincode(body.get("pincode"));

        user = userRepository.save(user);
        auditService.log(user, "PROFILE_UPDATED", "User", user.getId());
        return getProfileAsMap(userId);
    }

    @Transactional
    public Map<String, Object> updatePincode(Long userId, String pincode) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));

        user.setPincode(pincode);

        Map<String, Object> lookup = pincodeLookupService.lookup(pincode);
        if (lookup.get("city") != null) {
            user.setCity((String) lookup.get("city"));
        }
        if (lookup.get("state") != null) {
            user.setState((String) lookup.get("state"));
        }

        user = userRepository.save(user);
        auditService.log(user, "PINCODE_UPDATED", "User", user.getId());
        return getProfileAsMap(userId);
    }

    public Map<String, Object> lookupPincode(String pincode) {
        return pincodeLookupService.lookup(pincode);
    }

    @Transactional
    public Map<String, Object> updateLocation(Long userId, Double latitude, Double longitude) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));

        user.setLatitude(latitude);
        user.setLongitude(longitude);

        Map<String, Object> lookup = pincodeLookupService.lookupByCoordinates(latitude, longitude);
        if (lookup.get("city") != null) user.setCity((String) lookup.get("city"));
        if (lookup.get("state") != null) user.setState((String) lookup.get("state"));
        if (lookup.get("pincode") != null) user.setPincode((String) lookup.get("pincode"));

        user = userRepository.save(user);
        auditService.log(user, "LOCATION_UPDATED", "User", user.getId());
        return getProfileAsMap(userId);
    }

    @Transactional
    public void changePassword(Long userId, ChangePasswordRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new IllegalArgumentException("Current password is incorrect");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
        auditService.log(user, "PASSWORD_CHANGED", "User", user.getId());
    }
}
