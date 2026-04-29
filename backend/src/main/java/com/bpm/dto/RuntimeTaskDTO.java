package com.bpm.dto;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public class RuntimeTaskDTO {
    public Long id;
    public String flowableTaskId;
    public Long processInstanceId;
    public String flowableProcessInstanceId;
    public String name;
    public String assignee;
    public List<String> candidateGroups;
    public String formKey;
    public String formSchema;
    public String status;
    public LocalDateTime createdAt;
    public LocalDateTime dueDate;
    public Map<String, Object> variables;

    public RuntimeTaskDTO() {}
}
