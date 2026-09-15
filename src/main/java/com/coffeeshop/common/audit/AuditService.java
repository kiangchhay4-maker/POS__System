package com.coffeeshop.common.audit;

import com.coffeeshop.common.util.JsonUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class AuditService {

    private static final Logger log = LoggerFactory.getLogger(AuditService.class);

    private final AuditLogRepository auditLogRepository;

    public AuditService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    @Async
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void recordAudit(
            UUID actorId,
            String actorRole,
            String action,
            String entityType,
            UUID entityId,
            Object oldValue,
            Object newValue,
            String ipAddress
    ) {
        try {
            String oldJson = oldValue != null ? JsonUtil.toJson(oldValue) : null;
            String newJson = newValue != null ? JsonUtil.toJson(newValue) : null;

            AuditLog logEntry = AuditLog.create(
                    actorId,
                    actorRole,
                    action,
                    entityType,
                    entityId,
                    oldJson,
                    newJson,
                    ipAddress
            );

            auditLogRepository.save(logEntry);
            log.debug("Audit recorded: [{}] on {} [{}] by {}", action, entityType, entityId, actorId);
        } catch (Exception ex) {
            log.error("Failed to record audit log for action: {}", action, ex);
        }
    }
}
