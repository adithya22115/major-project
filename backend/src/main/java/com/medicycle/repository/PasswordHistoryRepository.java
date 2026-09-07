package com.medicycle.repository;

import com.medicycle.entity.PasswordHistory;
import com.medicycle.entity.User;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PasswordHistoryRepository extends JpaRepository<PasswordHistory, Long> {
    List<PasswordHistory> findByUserOrderByCreatedAtDesc(User user, Pageable pageable);
}
