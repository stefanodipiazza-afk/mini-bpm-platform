package com.bpm.dto;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public class RuntimeProcessInstanceDTO {
    public Long id;
    public String flowableProcessInstanceId;
    public Long processDefinitionId;
    public String flowableProcessDefinitionId;
    public String businessKey;
    public String status;
    public LocalDateTime startedAt;
    public LocalDateTime completedAt;
    public LocalDateTime endedAt;
    public Long durationMillis;
    public Map<String, Object> variables;
    public List<RuntimeTaskDTO> activeTasks;
    public List<ExecutionLogDTO> history;
    public List<RuntimeHistoryEventDTO> flowableHistory;
    public List<RuntimeTaskHistoryDTO> taskHistory;

    public RuntimeProcessInstanceDTO() {}
}
