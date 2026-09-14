package com.medicycle.repository;

import com.medicycle.entity.User;
import com.medicycle.enums.RoleType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    List<User> findByOrderByIdDesc();
    List<User> findByRole_RoleName(RoleType roleName);
    long countByRole_RoleName(RoleType roleName);
    Page<User> findAllByOrderByIdDesc(Pageable pageable);
}
