package com.bpm.dto;

import java.time.LocalDateTime;

public class WorkflowDeploymentDTO {
    public String deploymentId;
    public String deploymentName;
    public LocalDateTime deployedAt;
    public String flowableProcessDefinitionId;
    public String flowableProcessDefinitionKey;
    public String flowableProcessDefinitionName;
    public Integer flowableProcessDefinitionVersion;
    public String resourceName;
    public boolean suspended;

    public WorkflowDeploymentDTO() {}
}
