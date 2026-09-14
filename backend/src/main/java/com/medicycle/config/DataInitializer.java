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
        } catch (Exception ex) {
            log.debug("Role constraint migration skipped: {}", ex.getMessage());
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

        if (userRepository.existsByEmail(adminEmail.trim())) {
            return;
        }

        Role adminRole = roleRepository.findByRoleName(RoleType.ADMIN)
                .orElseThrow(() -> new IllegalStateException("ADMIN role not found"));

        User admin = User.builder()
                .name(adminName)
                .email(adminEmail.trim())
                .phone(adminPhone)
                .password(passwordEncoder.encode(adminPassword))
                .role(adminRole)
                .address("MediCycle HQ")
                .city("Mumbai")
                .state("Maharashtra")
                .pincode("400001")
                .latitude(19.0760)
                .longitude(72.8777)
                .isVerified(true)
                .build();

        userRepository.save(admin);
        log.info("Seeded admin account for {}", adminEmail);
    }

    private void seedDoctorUser() {
        if (!StringUtils.hasText(doctorEmail) || !StringUtils.hasText(doctorPassword)
                || userRepository.existsByEmail(doctorEmail.trim())) {
            return;
        }
        Role doctorRole = roleRepository.findByRoleName(RoleType.DOCTOR)
                .orElseThrow(() -> new IllegalStateException("DOCTOR role not found"));
        userRepository.save(User.builder()
                .name(doctorName).email(doctorEmail.trim()).phone("0000000000")
                .password(passwordEncoder.encode(doctorPassword)).role(doctorRole)
                .city("Mumbai").state("Maharashtra").pincode("400001").isVerified(true).build());
        log.info("Seeded doctor account for {}", doctorEmail);
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
