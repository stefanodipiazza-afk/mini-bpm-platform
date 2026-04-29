package com.bpm.dto;

import java.time.LocalDateTime;

public class RuntimeTaskHistoryDTO {
    public String flowableTaskId;
    public String name;
    public String taskDefinitionKey;
    public String assignee;
    public String owner;
    public String formKey;
    public String deleteReason;
    public LocalDateTime createdAt;
    public LocalDateTime claimTime;
    public LocalDateTime endedAt;
    public LocalDateTime dueDate;
    public Long durationMillis;
    public String status;

    public RuntimeTaskHistoryDTO() {}
}
