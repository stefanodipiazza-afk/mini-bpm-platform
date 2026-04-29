package com.bpm.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "execution_logs")
public class ExecutionLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long processInstanceId;

    private Long taskId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EventType eventType;

    private String eventData;

    @Column(nullable = false, updatable = false)
    private LocalDateTime timestamp = LocalDateTime.now();

    public enum EventType {
        PROCESS_STARTED, PROCESS_COMPLETED, PROCESS_FAILED,
        TASK_CREATED, TASK_COMPLETED, TASK_FAILED, TASK_CLAIMED,
        GATEWAY_EVALUATED, SERVICE_TASK_EXECUTED
    }

    // Constructors
    public ExecutionLog() {}

    public ExecutionLog(Long processInstanceId, EventType eventType) {
        this.processInstanceId = processInstanceId;
        this.eventType = eventType;
    }

    // Getters & Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getProcessInstanceId() { return processInstanceId; }
    public void setProcessInstanceId(Long processInstanceId) { this.processInstanceId = processInstanceId; }

    public Long getTaskId() { return taskId; }
    public void setTaskId(Long taskId) { this.taskId = taskId; }

    public EventType getEventType() { return eventType; }
    public void setEventType(EventType eventType) { this.eventType = eventType; }

    public String getEventData() { return eventData; }
    public void setEventData(String eventData) { this.eventData = eventData; }

    public LocalDateTime getTimestamp() { return timestamp; }
}
