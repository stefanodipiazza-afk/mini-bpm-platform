package com.bpm.dto;

import java.time.LocalDateTime;

public class ProcessDefinitionDTO {
    public Long id;
    public String name;
    public Integer version;
    public String status;
    public String description;
    public LocalDateTime createdAt;
    public LocalDateTime updatedAt;
    public String definition;
    public String flowableDeploymentId;
    public String flowableProcessDefinitionId;
    public String flowableProcessDefinitionKey;
    public Integer flowableProcessDefinitionVersion;
    public LocalDateTime publishedAt;

    public ProcessDefinitionDTO() {}

    public ProcessDefinitionDTO(Long id, String name, Integer version, String status,
                               String description, LocalDateTime createdAt, LocalDateTime updatedAt, String definition) {
        this.id = id;
        this.name = name;
        this.version = version;
        this.status = status;
        this.description = description;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.definition = definition;
    }
}
