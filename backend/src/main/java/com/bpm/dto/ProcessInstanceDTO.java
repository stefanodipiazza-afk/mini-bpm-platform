package com.bpm.dto;

import java.time.LocalDateTime;

public class ProcessInstanceDTO {
    public Long id;
    public Long processDefinitionId;
    public String status;
    public String variables;
    public LocalDateTime startedAt;
    public LocalDateTime completedAt;

    public ProcessInstanceDTO() {}

    public ProcessInstanceDTO(Long id, Long processDefinitionId, String status,
                             String variables, LocalDateTime startedAt, LocalDateTime completedAt) {
        this.id = id;
        this.processDefinitionId = processDefinitionId;
        this.status = status;
        this.variables = variables;
        this.startedAt = startedAt;
        this.completedAt = completedAt;
    }
}
