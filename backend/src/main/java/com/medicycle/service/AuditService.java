package com.medicycle.service;

import com.medicycle.entity.AuditLog;
import com.medicycle.entity.User;
import com.medicycle.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuditService {

    private final AuditLogRepository auditLogRepository;

    @Transactional
    public void log(User user, String action, String entityName, Long entityId) {
        AuditLog auditLog = AuditLog.builder()
                .user(user)
                .action(action)
                .entityName(entityName)
                .entityId(entityId)
                .build();
        auditLogRepository.save(auditLog);
    }
}
