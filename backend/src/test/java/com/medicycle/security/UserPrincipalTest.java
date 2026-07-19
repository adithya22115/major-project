package com.medicycle.security;

import com.medicycle.entity.Role;
import com.medicycle.entity.User;
import com.medicycle.enums.RoleType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.GrantedAuthority;

import java.util.Collection;

import static org.junit.jupiter.api.Assertions.*;

class UserPrincipalTest {

    private User donorUser;
    private User pharmacyUser;
    private User adminUser;

    @BeforeEach
    void setUp() {
        Role donorRole = Role.builder().id(1L).roleName(RoleType.DONOR).build();
        Role pharmacyRole = Role.builder().id(3L).roleName(RoleType.PHARMACY).build();
        Role adminRole = Role.builder().id(4L).roleName(RoleType.ADMIN).build();

        donorUser = User.builder()
                .id(1L).name("Donor").email("donor@test.com")
                .password("encoded").role(donorRole)
                .build();

        pharmacyUser = User.builder()
                .id(2L).name("Pharmacy").email("pharmacy@test.com")
                .password("encoded").role(pharmacyRole)
                .build();

        adminUser = User.builder()
                .id(3L).name("Admin").email("admin@test.com")
                .password("encoded").role(adminRole)
                .build();
    }

    @Test
    void getAuthorities_shouldReturnDonorRole() {
        UserPrincipal principal = new UserPrincipal(donorUser);

        Collection<? extends GrantedAuthority> authorities = principal.getAuthorities();

        assertEquals(1, authorities.size());
        assertEquals("ROLE_DONOR", authorities.iterator().next().getAuthority());
    }

    @Test
    void getAuthorities_shouldReturnPharmacyRole() {
        UserPrincipal principal = new UserPrincipal(pharmacyUser);

        Collection<? extends GrantedAuthority> authorities = principal.getAuthorities();

        assertEquals(1, authorities.size());
        assertEquals("ROLE_PHARMACY", authorities.iterator().next().getAuthority());
    }

    @Test
    void getAuthorities_shouldReturnAdminRole() {
        UserPrincipal principal = new UserPrincipal(adminUser);

        Collection<? extends GrantedAuthority> authorities = principal.getAuthorities();

        assertEquals(1, authorities.size());
        assertEquals("ROLE_ADMIN", authorities.iterator().next().getAuthority());
    }

    @Test
    void getUsername_shouldReturnEmail() {
        UserPrincipal principal = new UserPrincipal(donorUser);

        assertEquals("donor@test.com", principal.getUsername());
    }

    @Test
    void getPassword_shouldReturnEncodedPassword() {
        UserPrincipal principal = new UserPrincipal(donorUser);

        assertEquals("encoded", principal.getPassword());
    }

    @Test
    void getId_shouldReturnUserId() {
        UserPrincipal principal = new UserPrincipal(donorUser);

        assertEquals(1L, principal.getId());
    }

    @Test
    void getUser_shouldReturnOriginalUser() {
        UserPrincipal principal = new UserPrincipal(donorUser);

        assertSame(donorUser, principal.getUser());
    }

    @Test
    void isAccountNonExpired_shouldReturnTrue() {
        UserPrincipal principal = new UserPrincipal(donorUser);

        assertTrue(principal.isAccountNonExpired());
    }

    @Test
    void isAccountNonLocked_shouldReturnTrue() {
        UserPrincipal principal = new UserPrincipal(donorUser);

        assertTrue(principal.isAccountNonLocked());
    }

    @Test
    void isCredentialsNonExpired_shouldReturnTrue() {
        UserPrincipal principal = new UserPrincipal(donorUser);

        assertTrue(principal.isCredentialsNonExpired());
    }

    @Test
    void isEnabled_shouldReturnTrue() {
        UserPrincipal principal = new UserPrincipal(donorUser);

        assertTrue(principal.isEnabled());
    }
}
