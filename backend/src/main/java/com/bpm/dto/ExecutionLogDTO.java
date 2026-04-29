package com.bpm.dto;

import java.time.LocalDateTime;

public class ExecutionLogDTO {
    public Long id;
    public Long processInstanceId;
    public String eventType;
    public String eventData;
    public LocalDateTime timestamp;

    public ExecutionLogDTO() {}

    public ExecutionLogDTO(Long id, Long processInstanceId, String eventType, String eventData, LocalDateTime timestamp) {
        this.id = id;
        this.processInstanceId = processInstanceId;
        this.eventType = eventType;
        this.eventData = eventData;
        this.timestamp = timestamp;
    }
}
