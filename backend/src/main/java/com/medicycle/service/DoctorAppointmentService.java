package com.medicycle.service;

import com.medicycle.dto.request.DoctorAppointmentRequest;
import com.medicycle.dto.response.DoctorAppointmentResponse;
import com.medicycle.entity.DoctorAppointment;
import com.medicycle.entity.User;
import com.medicycle.enums.AppointmentStatus;
import com.medicycle.enums.RoleType;
import com.medicycle.exception.ResourceNotFoundException;
import com.medicycle.repository.DoctorAppointmentRepository;
import com.medicycle.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class DoctorAppointmentService {
    private final DoctorAppointmentRepository appointmentRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;
    private final NotificationService notificationService;

    @Transactional
    public DoctorAppointmentResponse book(DoctorAppointmentRequest request, Long patientId) {
        User patient = userRepository.findById(patientId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found"));
        DoctorAppointment appointment = DoctorAppointment.builder()
                .patient(patient)
                .patientName(request.getPatientName())
                .phone(request.getPhone())
                .specialty(request.getSpecialty())
                .consultationType(request.getConsultationType())
                .notes(request.getNotes())
                .build();
        return toResponse(appointmentRepository.save(appointment));
    }

    @Transactional(readOnly = true)
    public List<DoctorAppointmentResponse> getForUser(User user) {
        RoleType role = user.getRole().getRoleName();
        if (role == RoleType.DOCTOR) return appointmentRepository.findForDoctor(user.getId()).stream().map(this::toResponse).toList();
        if (role == RoleType.ADMIN || role == RoleType.PHARMACY) return appointmentRepository.findAllForStaff().stream().map(this::toResponse).toList();
        return appointmentRepository.findByPatientId(user.getId()).stream().map(this::toResponse).toList();
    }

    @Transactional
    public DoctorAppointmentResponse updateStatus(Long id, AppointmentStatus status, Long doctorId) {
        DoctorAppointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found"));
        User doctor = userRepository.findById(doctorId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found"));
        if (doctor.getRole().getRoleName() != RoleType.DOCTOR && doctor.getRole().getRoleName() != RoleType.ADMIN) {
            throw new IllegalStateException("Only a doctor or admin can update appointments");
        }
        if (doctor.getRole().getRoleName() == RoleType.DOCTOR) appointment.setDoctor(doctor);
        appointment.setStatus(status);
        appointment = appointmentRepository.save(appointment);

        // Notify and email patient regarding whether consultation request was accepted or declined
        User patient = appointment.getPatient();
        if (patient != null && patient.getEmail() != null) {
            String doctorName = (doctor.getName() != null && !doctor.getName().isBlank()) ? doctor.getName() : "Doctor";
            String title = (status == AppointmentStatus.CONFIRMED) ? "Consultation Request Accepted" :
                           (status == AppointmentStatus.CANCELLED) ? "Consultation Request Declined" :
                           "Consultation Completed";
            String notifMsg = (status == AppointmentStatus.CONFIRMED)
                    ? "Dr. " + doctorName + " has accepted your consultation request for " + appointment.getSpecialty() + "."
                    : (status == AppointmentStatus.CANCELLED)
                    ? "Your consultation request for " + appointment.getSpecialty() + " was declined by Dr. " + doctorName + "."
                    : "Your consultation with Dr. " + doctorName + " is completed.";

            notificationService.createNotification(patient, title, notifMsg, "APPOINTMENT");

            emailService.sendAppointmentStatusEmail(
                    patient.getEmail(),
                    appointment.getPatientName() != null ? appointment.getPatientName() : patient.getName(),
                    doctorName,
                    appointment.getSpecialty(),
                    appointment.getConsultationType(),
                    status.name(),
                    appointment.getNotes());
        }

        return toResponse(appointment);
    }

    private DoctorAppointmentResponse toResponse(DoctorAppointment a) {
        return DoctorAppointmentResponse.builder().id(a.getId()).patientName(a.getPatientName()).phone(a.getPhone())
                .specialty(a.getSpecialty()).consultationType(a.getConsultationType()).notes(a.getNotes())
                .doctorName(a.getDoctor() != null ? a.getDoctor().getName() : null)
                .requestedAt(a.getRequestedAt()).appointmentAt(a.getAppointmentAt()).status(a.getStatus()).build();
    }
}
