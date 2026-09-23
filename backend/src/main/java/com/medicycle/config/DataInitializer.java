package com.medicycle.config;

import com.medicycle.entity.Medicine;
import com.medicycle.entity.Role;
import com.medicycle.entity.User;
import com.medicycle.enums.RoleType;
import com.medicycle.repository.MedicineRepository;
import com.medicycle.repository.RoleRepository;
import com.medicycle.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final MedicineRepository medicineRepository;
    private final PasswordEncoder passwordEncoder;
    private final JdbcTemplate jdbcTemplate;

    @Value("${app.admin.email:}")
    private String adminEmail;

    @Value("${app.admin.password:}")
    private String adminPassword;

    @Value("${app.admin.name:MediCycle Admin}")
    private String adminName;

    @Value("${app.admin.phone:0000000000}")
    private String adminPhone;

    @Value("${app.doctor.email:}")
    private String doctorEmail;

    @Value("${app.doctor.password:}")
    private String doctorPassword;

    @Value("${app.doctor.name:MediCycle Doctor}")
    private String doctorName;

    @Override
    public void run(String... args) {
        migrateRoleConstraint();
        seedRoles();
        seedAdminUser();
        seedDoctorUser();
        seedMedicines();
    }

    private void migrateRoleConstraint() {
        try {
            jdbcTemplate.execute("ALTER TABLE roles DROP CONSTRAINT IF EXISTS roles_role_name_check");
            jdbcTemplate.execute("ALTER TABLE pharmacy_verifications ADD COLUMN IF NOT EXISTS verification_type VARCHAR(50) DEFAULT 'PHARMACY'");
            jdbcTemplate.execute("UPDATE pharmacy_verifications SET verification_type = 'PHARMACY' WHERE verification_type IS NULL");
        } catch (Exception ex) {
            log.debug("Role/verification constraint migration skipped: {}", ex.getMessage());
        }
    }

    private void seedRoles() {
        for (RoleType roleType : RoleType.values()) {
            roleRepository.findByRoleName(roleType).orElseGet(() ->
                    roleRepository.save(Role.builder().roleName(roleType).build()));
        }
    }

    private void seedAdminUser() {
        if (!StringUtils.hasText(adminEmail) || !StringUtils.hasText(adminPassword)) {
            log.warn("Admin seed skipped: set app.admin.email and app.admin.password "
                    + "(or the ADMIN_EMAIL / ADMIN_PASSWORD environment variables) to create the admin account.");
            return;
        }

        Role adminRole = roleRepository.findByRoleName(RoleType.ADMIN)
                .orElseThrow(() -> new IllegalStateException("ADMIN role not found"));

        String trimmedAdminEmail = adminEmail.trim();
        String trimmedAdminPassword = adminPassword.trim();

        userRepository.findByEmailIgnoreCase(trimmedAdminEmail).ifPresentOrElse(
                admin -> {
                    admin.setPassword(passwordEncoder.encode(trimmedAdminPassword));
                    admin.setRole(adminRole);
                    admin.setVerified(true);
                    admin.setFailedLoginAttempts(0);
                    admin.setLockedUntil(null);
                    userRepository.save(admin);
                    log.info("Updated password and unlocked admin account {}", trimmedAdminEmail);
                },
                () -> {
                    User admin = User.builder()
                            .name(adminName)
                            .email(trimmedAdminEmail)
                            .phone(adminPhone)
                            .password(passwordEncoder.encode(trimmedAdminPassword))
                            .role(adminRole)
                            .address("MediCycle HQ")
                            .city("Mumbai")
                            .state("Maharashtra")
                            .pincode("400001")
                            .latitude(19.0760)
                            .longitude(72.8777)
                            .isVerified(true)
                            .failedLoginAttempts(0)
                            .build();
                    userRepository.save(admin);
                    log.info("Seeded admin account for {}", trimmedAdminEmail);
                }
        );
    }

    private void seedDoctorUser() {
        if (!StringUtils.hasText(doctorEmail) || !StringUtils.hasText(doctorPassword)) {
            return;
        }

        String trimmedDoctorEmail = doctorEmail.trim();
        String trimmedDoctorPassword = doctorPassword.trim();

        Role doctorRole = roleRepository.findByRoleName(RoleType.DOCTOR)
                .orElseThrow(() -> new IllegalStateException("DOCTOR role not found"));

        java.util.Optional<User> doctorOpt = userRepository.findByEmailIgnoreCase(trimmedDoctorEmail);
        if (doctorOpt.isEmpty()) {
            java.util.List<User> existingDoctors = userRepository.findByRole_RoleName(RoleType.DOCTOR);
            if (!existingDoctors.isEmpty()) {
                doctorOpt = java.util.Optional.of(existingDoctors.get(0));
            }
        }

        if (doctorOpt.isPresent()) {
            User doctor = doctorOpt.get();
            doctor.setEmail(trimmedDoctorEmail);
            doctor.setPassword(passwordEncoder.encode(trimmedDoctorPassword));
            doctor.setRole(doctorRole);
            doctor.setVerified(true);
            doctor.setFailedLoginAttempts(0);
            doctor.setLockedUntil(null);
            userRepository.save(doctor);
            log.info("Updated credentials and unlocked doctor account: {}", trimmedDoctorEmail);
        } else {
            userRepository.save(User.builder()
                    .name(doctorName)
                    .email(trimmedDoctorEmail)
                    .phone("0000000000")
                    .password(passwordEncoder.encode(trimmedDoctorPassword))
                    .role(doctorRole)
                    .city("Mumbai")
                    .state("Maharashtra")
                    .pincode("400001")
                    .isVerified(true)
                    .failedLoginAttempts(0)
                    .build());
            log.info("Seeded new doctor account for {}", trimmedDoctorEmail);
        }
    }

    private void seedMedicines() {
        if (medicineRepository.count() > 0) {
            return;
        }

        medicineRepository.save(Medicine.builder()
                .medicineName("Paracetamol 500mg")
                .manufacturer("Cipla")
                .category("Analgesic")
                .dosage("500mg")
                .description("Pain reliever and fever reducer")
                .requiresPrescription(false)
                .build());

        medicineRepository.save(Medicine.builder()
                .medicineName("Amoxicillin 250mg")
                .manufacturer("Sun Pharma")
                .category("Antibiotic")
                .dosage("250mg")
                .description("Antibiotic for bacterial infections")
                .requiresPrescription(true)
                .build());

        medicineRepository.save(Medicine.builder()
                .medicineName("Metformin 500mg")
                .manufacturer("Dr. Reddy's")
                .category("Antidiabetic")
                .dosage("500mg")
                .description("Oral medication for type 2 diabetes")
                .requiresPrescription(true)
                .build());

        medicineRepository.save(Medicine.builder()
                .medicineName("Cetirizine 10mg")
                .manufacturer("Alkem")
                .category("Antihistamine")
                .dosage("10mg")
                .description("Allergy relief medication")
                .requiresPrescription(false)
                .build());

        medicineRepository.save(Medicine.builder()
                .medicineName("Omeprazole 20mg")
                .manufacturer("Torrent")
                .category("Antacid")
                .dosage("20mg")
                .description("Reduces stomach acid production")
                .requiresPrescription(false)
                .build());
    }
}
