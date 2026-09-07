package com.medicycle.service;

import com.medicycle.dto.request.ChangePasswordRequest;
import com.medicycle.dto.request.UpdateProfileRequest;
import com.medicycle.dto.response.UserResponse;
import com.medicycle.entity.Role;
import com.medicycle.entity.User;
import com.medicycle.enums.RoleType;
import com.medicycle.exception.ResourceNotFoundException;
import com.medicycle.repository.PasswordHistoryRepository;
import com.medicycle.repository.UserRepository;
import com.medicycle.security.PasswordValidator;
import com.medicycle.security.TwoFactorService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private AuditService auditService;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private PincodeLookupService pincodeLookupService;
    @Mock private PasswordValidator passwordValidator;
    @Mock private PasswordHistoryRepository passwordHistoryRepository;
    @Mock private TwoFactorService twoFactorService;

    @InjectMocks private UserService userService;

    private User testUser;

    @BeforeEach
    void setUp() {
        Role donorRole = Role.builder().id(1L).roleName(RoleType.DONOR).build();
        testUser = User.builder()
                .id(1L).name("Test User").email("test@test.com")
                .phone("9876543210").password("encoded_password")
                .role(donorRole).address("123 Street").city("Mumbai")
                .state("Maharashtra").pincode("400001").isVerified(true)
                .build();
    }

    @Test
    void getProfile_shouldReturnUserResponse() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));

        UserResponse result = userService.getProfile(1L);

        assertNotNull(result);
        assertEquals("Test User", result.getName());
        assertEquals("test@test.com", result.getEmail());
        assertEquals(RoleType.DONOR, result.getRole());
        assertEquals("Mumbai", result.getCity());
    }

    @Test
    void getProfile_shouldThrow_whenUserNotFound() {
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> userService.getProfile(99L));
    }

    @Test
    void getProfileAsMap_shouldReturnMap() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));

        Map<String, Object> result = userService.getProfileAsMap(1L);

        assertNotNull(result);
        assertEquals(1L, result.get("id"));
        assertEquals("Test User", result.get("name"));
        assertEquals("test@test.com", result.get("email"));
        assertEquals("Mumbai", result.get("city"));
    }

    @Test
    void updateProfile_shouldUpdateFields() {
        UpdateProfileRequest request = new UpdateProfileRequest();
        request.setName("Updated Name");
        request.setPhone("1234567890");
        request.setCity("Pune");

        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        UserResponse result = userService.updateProfile(1L, request);

        assertNotNull(result);
        assertEquals("Updated Name", testUser.getName());
        assertEquals("1234567890", testUser.getPhone());
        assertEquals("Pune", testUser.getCity());
        verify(auditService).log(eq(testUser), eq("PROFILE_UPDATED"), eq("User"), eq(1L));
    }

    @Test
    void updateProfile_shouldOnlyUpdateProvidedFields() {
        UpdateProfileRequest request = new UpdateProfileRequest();
        request.setCity("Delhi");

        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        userService.updateProfile(1L, request);

        assertEquals("Test User", testUser.getName());
        assertEquals("9876543210", testUser.getPhone());
        assertEquals("Delhi", testUser.getCity());
    }

    @Test
    void updateProfileFromMap_shouldUpdateFields() {
        Map<String, String> body = Map.of("name", "Map Updated", "city", "Bangalore");

        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        userService.updateProfileFromMap(1L, body);

        assertEquals("Map Updated", testUser.getName());
        assertEquals("Bangalore", testUser.getCity());
        verify(auditService).log(eq(testUser), eq("PROFILE_UPDATED"), eq("User"), eq(1L));
    }

    @Test
    void updatePincode_shouldUpdatePincodeAndCityState() {
        Map<String, Object> lookupResult = Map.of(
                "pincode", "560001",
                "city", "Bengaluru",
                "state", "Karnataka",
                "source", "builtin"
        );

        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(pincodeLookupService.lookup("560001")).thenReturn(lookupResult);
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        userService.updatePincode(1L, "560001");

        assertEquals("560001", testUser.getPincode());
        assertEquals("Bengaluru", testUser.getCity());
        assertEquals("Karnataka", testUser.getState());
        verify(auditService).log(eq(testUser), eq("PINCODE_UPDATED"), eq("User"), eq(1L));
    }

    @Test
    void changePassword_shouldSucceed_whenCurrentPasswordCorrect() {
        ChangePasswordRequest request = new ChangePasswordRequest();
        request.setCurrentPassword("old_password");
        request.setNewPassword("new_password");

        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches("old_password", "encoded_password")).thenReturn(true);
        when(passwordEncoder.encode("new_password")).thenReturn("new_encoded_password");
        when(passwordValidator.validate("new_password")).thenReturn(Collections.emptyList());
        when(passwordHistoryRepository.findByUserOrderByCreatedAtDesc(any(), any(Pageable.class))).thenReturn(Collections.emptyList());
        when(userRepository.save(any(User.class))).thenReturn(testUser);
        when(passwordHistoryRepository.save(any())).thenReturn(null);

        userService.changePassword(1L, request);

        assertEquals("new_encoded_password", testUser.getPassword());
        verify(auditService).log(eq(testUser), eq("PASSWORD_CHANGED"), eq("User"), eq(1L));
    }

    @Test
    void changePassword_shouldThrow_whenCurrentPasswordWrong() {
        ChangePasswordRequest request = new ChangePasswordRequest();
        request.setCurrentPassword("wrong_password");
        request.setNewPassword("new_password");

        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches("wrong_password", "encoded_password")).thenReturn(false);

        assertThrows(IllegalArgumentException.class,
                () -> userService.changePassword(1L, request));
        verify(userRepository, never()).save(any());
    }

    @Test
    void changePassword_shouldThrow_whenUserNotFound() {
        ChangePasswordRequest request = new ChangePasswordRequest();
        request.setCurrentPassword("old");
        request.setNewPassword("new");

        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> userService.changePassword(99L, request));
    }

    @Test
    void lookupPincode_shouldDelegateToService() {
        Map<String, Object> expected = Map.of("pincode", "400001", "city", "Mumbai", "state", "Maharashtra");
        when(pincodeLookupService.lookup("400001")).thenReturn(expected);

        Map<String, Object> result = userService.lookupPincode("400001");

        assertEquals(expected, result);
    }
}
