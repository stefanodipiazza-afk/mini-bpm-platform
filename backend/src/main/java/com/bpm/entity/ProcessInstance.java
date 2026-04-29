package com.bpm.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "process_instances")
public class ProcessInstance {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String flowableProcessInstanceId;

    @Column(nullable = false)
    private Long processDefinitionId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private InstanceStatus status = InstanceStatus.ACTIVE;

    @Column(columnDefinition = "LONGTEXT")
    private String variables;

    @Column(nullable = false, updatable = false)
    private LocalDateTime startedAt = LocalDateTime.now();

    private LocalDateTime completedAt;

    public enum InstanceStatus {
        ACTIVE, COMPLETED, FAILED, SUSPENDED
    }

    // Constructors
    public ProcessInstance() {}

    public ProcessInstance(String flowableProcessInstanceId, Long processDefinitionId) {
        this.flowableProcessInstanceId = flowableProcessInstanceId;
        this.processDefinitionId = processDefinitionId;
    }

    // Getters & Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getFlowableProcessInstanceId() { return flowableProcessInstanceId; }
    public void setFlowableProcessInstanceId(String id) { this.flowableProcessInstanceId = id; }

    public Long getProcessDefinitionId() { return processDefinitionId; }
    public void setProcessDefinitionId(Long processDefinitionId) { this.processDefinitionId = processDefinitionId; }

    public InstanceStatus getStatus() { return status; }
    public void setStatus(InstanceStatus status) { this.status = status; }

    public String getVariables() { return variables; }
    public void setVariables(String variables) { this.variables = variables; }

    public LocalDateTime getStartedAt() { return startedAt; }
    public LocalDateTime getCompletedAt() { return completedAt; }
    public void setCompletedAt(LocalDateTime completedAt) { this.completedAt = completedAt; }
}
