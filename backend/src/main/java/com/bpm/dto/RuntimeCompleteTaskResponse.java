package com.bpm.dto;

public class RuntimeCompleteTaskResponse {
    public Long taskId;
    public String flowableTaskId;
    public Long processInstanceId;
    public boolean completed;
    public String processInstanceStatus;

    public RuntimeCompleteTaskResponse() {}
}
