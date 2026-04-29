package com.bpm.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "process_definitions")
public class ProcessDefinition {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private Integer version = 1;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ProcessStatus status = ProcessStatus.DRAFT;

    @Column(name = "bpmn_xml", columnDefinition = "LONGTEXT")
    private String bpmnXml;

    @Column(name = "definition", columnDefinition = "LONGTEXT")
    private String definitionJson;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Column(name = "flowable_deployment_id")
    private String flowableDeploymentId;

    @Column(name = "flowable_process_definition_id")
    private String flowableProcessDefinitionId;

    @Column(name = "flowable_process_definition_key")
    private String flowableProcessDefinitionKey;

    @Column(name = "flowable_process_definition_version")
    private Integer flowableProcessDefinitionVersion;

    @Column(name = "published_at")
    private LocalDateTime publishedAt;

    private String description;

    public enum ProcessStatus {
        DRAFT, PUBLISHED, ARCHIVED
    }

    // Constructors
    public ProcessDefinition() {}

    public ProcessDefinition(String name, String definitionJson) {
        this.name = name;
        this.definitionJson = definitionJson;
    }

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        this.createdAt = now;
        this.updatedAt = now;
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    // Getters & Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public Integer getVersion() { return version; }
    public void setVersion(Integer version) { this.version = version; }

    public ProcessStatus getStatus() { return status; }
    public void setStatus(ProcessStatus status) { this.status = status; }

    public String getBpmnXml() { return bpmnXml; }
    public void setBpmnXml(String bpmnXml) { this.bpmnXml = bpmnXml; }

    public String getDefinitionJson() { return definitionJson; }
    public void setDefinitionJson(String definitionJson) { this.definitionJson = definitionJson; }

    public String getDefinition() { return definitionJson; }
    public void setDefinition(String definition) { this.definitionJson = definition; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public String getFlowableDeploymentId() { return flowableDeploymentId; }
    public void setFlowableDeploymentId(String flowableDeploymentId) { this.flowableDeploymentId = flowableDeploymentId; }

    public String getFlowableProcessDefinitionId() { return flowableProcessDefinitionId; }
    public void setFlowableProcessDefinitionId(String flowableProcessDefinitionId) { this.flowableProcessDefinitionId = flowableProcessDefinitionId; }

    public String getFlowableProcessDefinitionKey() { return flowableProcessDefinitionKey; }
    public void setFlowableProcessDefinitionKey(String flowableProcessDefinitionKey) { this.flowableProcessDefinitionKey = flowableProcessDefinitionKey; }

    public Integer getFlowableProcessDefinitionVersion() { return flowableProcessDefinitionVersion; }
    public void setFlowableProcessDefinitionVersion(Integer flowableProcessDefinitionVersion) { this.flowableProcessDefinitionVersion = flowableProcessDefinitionVersion; }

    public LocalDateTime getPublishedAt() { return publishedAt; }
    public void setPublishedAt(LocalDateTime publishedAt) { this.publishedAt = publishedAt; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
}
