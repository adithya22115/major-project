package com.medicycle.repository;

import com.medicycle.entity.DoctorAppointment;
import com.medicycle.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface DoctorAppointmentRepository extends JpaRepository<DoctorAppointment, Long> {
    @Query("select a from DoctorAppointment a join fetch a.patient left join fetch a.doctor order by a.requestedAt desc")
    List<DoctorAppointment> findAllForStaff();

    @Query("select a from DoctorAppointment a left join fetch a.doctor where a.patient.id = :patientId order by a.requestedAt desc")
    List<DoctorAppointment> findByPatientId(Long patientId);

    @Query("select a from DoctorAppointment a join fetch a.patient where a.doctor.id = :doctorId order by a.requestedAt desc")
    List<DoctorAppointment> findByDoctorId(Long doctorId);

    @Query("select a from DoctorAppointment a join fetch a.patient left join fetch a.doctor " +
            "where a.doctor.id = :doctorId or a.doctor is null order by a.requestedAt desc")
    List<DoctorAppointment> findForDoctor(Long doctorId);
}
