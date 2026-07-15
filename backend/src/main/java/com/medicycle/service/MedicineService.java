package com.medicycle.service;

import com.medicycle.dto.request.MedicineCreateRequest;
import com.medicycle.dto.response.MedicineResponse;
import com.medicycle.entity.Medicine;
import com.medicycle.entity.User;
import com.medicycle.exception.ResourceNotFoundException;
import com.medicycle.repository.MedicineRepository;
import com.medicycle.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class MedicineService {

    private final MedicineRepository medicineRepository;
    private final UserRepository userRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public List<MedicineResponse> getAllMedicines() {
        return medicineRepository.findAll().stream()
                .map(DtoMapper::toMedicineResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public MedicineResponse getMedicineById(Long id) {
        Medicine medicine = medicineRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Medicine not found: " + id));
        return DtoMapper.toMedicineResponse(medicine);
    }

    @Transactional
    public MedicineResponse createMedicine(MedicineCreateRequest request, Long adminId) {
        User admin = userRepository.findById(adminId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + adminId));

        Medicine medicine = Medicine.builder()
                .medicineName(request.getMedicineName())
                .manufacturer(request.getManufacturer())
                .category(request.getCategory())
                .dosage(request.getDosage())
                .description(request.getDescription())
                .requiresPrescription(request.isRequiresPrescription())
                .build();

        medicine = medicineRepository.save(medicine);
        auditService.log(admin, "MEDICINE_CREATED", "Medicine", medicine.getId());
        return DtoMapper.toMedicineResponse(medicine);
    }
}
