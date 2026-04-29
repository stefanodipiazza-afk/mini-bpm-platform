package com.bpm.dto;

import java.time.LocalDateTime;

public class UserTaskDTO {
    public Long id;
    public Long processInstanceId;
    public String taskName;
    public String assignedTo;
    public String status;
    public String formSchema;
    public String formData;
    public LocalDateTime dueDate;
    public LocalDateTime createdAt;
    public LocalDateTime completedAt;

    public UserTaskDTO() {}
}
