package com.medicycle.service;

import com.medicycle.dto.response.NotificationResponse;
import com.medicycle.entity.Notification;
import com.medicycle.entity.Role;
import com.medicycle.entity.User;
import com.medicycle.enums.RoleType;
import com.medicycle.exception.ResourceNotFoundException;
import com.medicycle.repository.NotificationRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NotificationServiceTest {

    @Mock private NotificationRepository notificationRepository;

    @InjectMocks private NotificationService notificationService;

    private User testUser;
    private Notification notification1;
    private Notification notification2;

    @BeforeEach
    void setUp() {
        Role donorRole = Role.builder().id(1L).roleName(RoleType.DONOR).build();
        testUser = User.builder().id(1L).name("Test User").email("test@test.com")
                .role(donorRole).build();

        notification1 = Notification.builder()
                .id(1L).user(testUser).title("Test Title")
                .message("Test message").type("DONATION").isRead(false).build();

        notification2 = Notification.builder()
                .id(2L).user(testUser).title("Another Title")
                .message("Another message").type("REQUEST").isRead(false).build();
    }

    @Test
    void createNotification_shouldSaveAndReturn() {
        when(notificationRepository.save(any(Notification.class))).thenReturn(notification1);

        Notification result = notificationService.createNotification(
                testUser, "Test Title", "Test message", "DONATION");

        assertNotNull(result);
        assertEquals("Test Title", result.getTitle());
        verify(notificationRepository).save(any(Notification.class));
    }

    @Test
    void getUserNotifications_shouldReturnList() {
        when(notificationRepository.findByUserIdOrderByCreatedAtDesc(1L))
                .thenReturn(List.of(notification1, notification2));

        List<NotificationResponse> result = notificationService.getUserNotifications(1L);

        assertEquals(2, result.size());
        assertEquals("Test Title", result.get(0).getTitle());
        assertEquals("Another Title", result.get(1).getTitle());
    }

    @Test
    void markAsRead_shouldSetReadTrue() {
        when(notificationRepository.findById(1L)).thenReturn(Optional.of(notification1));
        when(notificationRepository.save(any(Notification.class))).thenReturn(notification1);

        NotificationResponse result = notificationService.markAsRead(1L, 1L);

        assertNotNull(result);
        assertTrue(notification1.isRead());
    }

    @Test
    void markAsRead_shouldThrow_whenNotificationNotFound() {
        when(notificationRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> notificationService.markAsRead(99L, 1L));
    }

    @Test
    void markAsRead_shouldThrow_whenNotificationBelongsToDifferentUser() {
        User otherUser = User.builder().id(2L).name("Other").build();
        Notification otherNotification = Notification.builder()
                .id(3L).user(otherUser).title("Other").message("Other msg").build();

        when(notificationRepository.findById(3L)).thenReturn(Optional.of(otherNotification));

        assertThrows(IllegalArgumentException.class,
                () -> notificationService.markAsRead(3L, 1L));
    }

    @Test
    void markAllAsRead_shouldMarkAllUnread() {
        when(notificationRepository.findByUserIdAndIsReadFalse(1L))
                .thenReturn(List.of(notification1, notification2));

        notificationService.markAllAsRead(1L);

        assertTrue(notification1.isRead());
        assertTrue(notification2.isRead());
        verify(notificationRepository).saveAll(List.of(notification1, notification2));
    }

    @Test
    void markAllAsRead_shouldHandleEmptyList() {
        when(notificationRepository.findByUserIdAndIsReadFalse(1L))
                .thenReturn(List.of());

        notificationService.markAllAsRead(1L);

        verify(notificationRepository).saveAll(List.of());
    }
}
