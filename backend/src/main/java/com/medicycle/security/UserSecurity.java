package com.medicycle.security;

import com.medicycle.entity.User;
import com.medicycle.enums.RoleType;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

/**
 * Custom security checks used from @PreAuthorize expressions.
 */
@Component("userSecurity")
public class UserSecurity {

    /**
     * True for admins and for pharmacies whose registration documents have been
     * approved by an admin (user.isVerified). Unverified/pending/rejected
     * pharmacies are denied pharmacy-gated actions.
     */
    public boolean isVerifiedPharmacy(Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof UserPrincipal principal)) {
            return false;
        }
        User user = principal.getUser();
        if (user == null || user.getRole() == null) {
            return false;
        }
        RoleType role = user.getRole().getRoleName();
        return role == RoleType.ADMIN || (role == RoleType.PHARMACY && user.isVerified());
    }
}