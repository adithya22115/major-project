package com.medicycle.config;

import com.medicycle.entity.Medicine;
import com.medicycle.entity.Role;
import com.medicycle.entity.User;
import com.medicycle.enums.RoleType;
import com.medicycle.repository.MedicineRepository;
import com.medicycle.repository.RoleRepository;
import com.medicycle.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final MedicineRepository medicineRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        seedRoles();
        seedAdminUser();
        seedMedicines();
    }

    private void seedRoles() {
        for (RoleType roleType : RoleType.values()) {
            roleRepository.findByRoleName(roleType).orElseGet(() ->
                    roleRepository.save(Role.builder().roleName(roleType).build()));
        }
    }

    private void seedAdminUser() {
        if (userRepository.existsByEmail("admin@medicycle.com")) {
            return;
        }

        Role adminRole = roleRepository.findByRoleName(RoleType.ADMIN)
                .orElseThrow(() -> new IllegalStateException("ADMIN role not found"));

        User admin = User.builder()
                .name("System Admin")
                .email("admin@medicycle.com")
                .phone("9999999999")
                .password(passwordEncoder.encode("admin123"))
                .role(adminRole)
                .address("MediCycle HQ")
                .city("Mumbai")
                .state("Maharashtra")
                .pincode("400001")
                .isVerified(true)
                .build();

        userRepository.save(admin);
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
