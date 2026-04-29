package com.bpm.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "user_tasks")
public class UserTask {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String flowableTaskId;

    @Column(nullable = false)
    private Long processInstanceId;

    @Column(nullable = false)
    private String taskName;

    private String assignedTo;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TaskStatus status = TaskStatus.PENDING;

    @Column(columnDefinition = "LONGTEXT")
    private String formSchema;

    @Column(columnDefinition = "LONGTEXT")
    private String formData;

    private LocalDateTime dueDate;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    private LocalDateTime completedAt;

    public enum TaskStatus {
        PENDING, COMPLETED, FAILED, REASSIGNED
    }

    // Constructors
    public UserTask() {}

    public UserTask(String flowableTaskId, Long processInstanceId, String taskName) {
        this.flowableTaskId = flowableTaskId;
        this.processInstanceId = processInstanceId;
        this.taskName = taskName;
    }

    // Getters & Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getFlowableTaskId() { return flowableTaskId; }
    public void setFlowableTaskId(String flowableTaskId) { this.flowableTaskId = flowableTaskId; }

    public Long getProcessInstanceId() { return processInstanceId; }
    public void setProcessInstanceId(Long processInstanceId) { this.processInstanceId = processInstanceId; }

    public String getTaskName() { return taskName; }
    public void setTaskName(String taskName) { this.taskName = taskName; }

    public String getAssignedTo() { return assignedTo; }
    public void setAssignedTo(String assignedTo) { this.assignedTo = assignedTo; }

    public TaskStatus getStatus() { return status; }
    public void setStatus(TaskStatus status) { this.status = status; }

    public String getFormSchema() { return formSchema; }
    public void setFormSchema(String formSchema) { this.formSchema = formSchema; }

    public String getFormData() { return formData; }
    public void setFormData(String formData) { this.formData = formData; }

    public LocalDateTime getDueDate() { return dueDate; }
    public void setDueDate(LocalDateTime dueDate) { this.dueDate = dueDate; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getCompletedAt() { return completedAt; }
    public void setCompletedAt(LocalDateTime completedAt) { this.completedAt = completedAt; }
}
