package com.bpm.service;

import com.bpm.entity.ProcessDefinition;
import com.bpm.dto.*;
import com.bpm.repository.ProcessDefinitionRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.EntityNotFoundException;
import org.flowable.engine.RepositoryService;
import org.flowable.engine.repository.Deployment;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Date;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@SuppressWarnings("all")
public class ProcessDefinitionService {

    @Autowired
    private ProcessDefinitionRepository processDefinitionRepository;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private WorkflowPublishService workflowPublishService;

    @Autowired
    private RepositoryService flowableRepositoryService;

    @Transactional
    public ProcessDefinitionDTO createProcessDefinition(ProcessDefinitionCreateDTO dto) {
        validateWorkflowDefinitionJson(dto.definition);

        ProcessDefinition pd = new ProcessDefinition(dto.name, dto.definition);
        pd.setDescription(dto.description);
        ProcessDefinition saved = processDefinitionRepository.save(pd);
        return toDTO(saved);
    }

    public ProcessDefinitionDTO getProcessDefinition(Long id) {
        ProcessDefinition pd = processDefinitionRepository.findById(id)
            .orElseThrow(() -> new EntityNotFoundException("Process definition not found: " + id));
        return toDTO(pd);
    }

    public List<ProcessDefinitionDTO> listProcessDefinitions() {
        return processDefinitionRepository.findAll().stream()
            .map(this::toDTO)
            .collect(Collectors.toList());
    }

    public List<WorkflowDeploymentDTO> listDeploymentHistory(Long id) {
        if (id == null) {
            throw new IllegalArgumentException("processDefinitionId is required");
        }

        ProcessDefinition pd = processDefinitionRepository.findById(id)
            .orElseThrow(() -> new EntityNotFoundException("Process definition not found: " + id));

        if (pd.getFlowableProcessDefinitionKey() != null && !pd.getFlowableProcessDefinitionKey().isBlank()) {
            return flowableRepositoryService.createProcessDefinitionQuery()
                    .processDefinitionKey(pd.getFlowableProcessDefinitionKey())
                    .orderByProcessDefinitionVersion()
                    .desc()
                    .list()
                    .stream()
                    .map(this::toWorkflowDeploymentDTO)
                    .toList();
        }

        if (pd.getFlowableDeploymentId() != null && !pd.getFlowableDeploymentId().isBlank()) {
            org.flowable.engine.repository.ProcessDefinition flowableDefinition =
                    flowableRepositoryService.createProcessDefinitionQuery()
                            .deploymentId(pd.getFlowableDeploymentId())
                            .singleResult();
            return flowableDefinition == null ? List.of() : List.of(toWorkflowDeploymentDTO(flowableDefinition));
        }

        return List.of();
    }

    @Transactional
    public ProcessDefinitionDTO updateProcessDefinition(Long id, ProcessDefinitionUpdateDTO dto) {
        ProcessDefinition pd = processDefinitionRepository.findById(id)
            .orElseThrow(() -> new EntityNotFoundException("Process definition not found: " + id));

        if (pd.getStatus() != ProcessDefinition.ProcessStatus.DRAFT) {
            throw new IllegalStateException("Only DRAFT processes can be updated");
        }

        validateWorkflowDefinitionJson(dto.definition);

        pd.setName(dto.name);
        pd.setDescription(dto.description);
        pd.setDefinitionJson(dto.definition);

        ProcessDefinition saved = processDefinitionRepository.save(pd);
        return toDTO(saved);
    }

    @Transactional
    public ProcessDefinitionDTO publishProcessDefinition(Long id) {
        ProcessDefinition pd = processDefinitionRepository.findById(id)
            .orElseThrow(() -> new EntityNotFoundException("Process definition not found: " + id));

        if (pd.getStatus() != ProcessDefinition.ProcessStatus.DRAFT) {
            throw new IllegalStateException("Only DRAFT processes can be published");
        }

        validateWorkflowDefinitionJson(pd.getDefinition());

        workflowPublishService.publish(pd);
        ProcessDefinition updated = processDefinitionRepository.save(pd);

        return toDTO(updated);
    }

    @Transactional
    public void deleteProcessDefinition(Long id) {
        ProcessDefinition pd = processDefinitionRepository.findById(id)
            .orElseThrow(() -> new EntityNotFoundException("Process definition not found: " + id));

        if (pd.getStatus() != ProcessDefinition.ProcessStatus.DRAFT) {
            throw new IllegalStateException("Only DRAFT processes can be deleted");
        }

        processDefinitionRepository.deleteById(id);
    }

    private void validateWorkflowDefinitionJson(String jsonDefinition) {
        List<String> errors = new ArrayList<>();

        try {
            JsonNode root = objectMapper.readTree(jsonDefinition);

            if (!root.isObject()) {
                errors.add("Workflow definition must be a JSON object");
            }

            JsonNode nameNode = root.path("name");
            if (!nameNode.isTextual() || nameNode.asText().trim().isEmpty()) {
                errors.add("Workflow definition name is required");
            }

            JsonNode nodesNode = root.path("nodes");
            if (!nodesNode.isArray()) {
                errors.add("Workflow definition nodes must be an array");
            } else {
                validateWorkflowNodes(nodesNode, errors);
            }

            JsonNode edgesNode = root.path("edges");
            if (!edgesNode.isMissingNode() && !edgesNode.isArray()) {
                errors.add("Workflow definition edges must be an array");
            } else if (edgesNode.isArray() && nodesNode.isArray()) {
                validateWorkflowEdges(edgesNode, collectNodeIds(nodesNode), errors);
            }
        } catch (Exception e) {
            errors.add("Workflow definition must be valid JSON");
        }

        if (!errors.isEmpty()) {
            throw new IllegalArgumentException("Invalid workflow definition: " + String.join("; ", errors));
        }
    }

    private void validateWorkflowNodes(JsonNode nodesNode, List<String> errors) {
        Set<String> ids = new HashSet<>();
        Set<String> duplicateIds = new HashSet<>();
        boolean hasStart = false;
        boolean hasEnd = false;

        for (JsonNode node : nodesNode) {
            JsonNode idNode = node.path("id");
            String id = idNode.isTextual() ? idNode.asText().trim() : "";

            if (id.isEmpty()) {
                errors.add("Workflow nodes must have non-empty ids");
            } else if (!ids.add(id)) {
                duplicateIds.add(id);
            }

            String type = node.path("type").isTextual() ? node.path("type").asText().trim() : "";
            hasStart = hasStart || isStartNodeType(type);
            hasEnd = hasEnd || isEndNodeType(type);

            if (isUserTaskNodeType(type)) {
                validateUserTaskFormMapping(id, node, errors);
            }
        }

        if (!duplicateIds.isEmpty()) {
            errors.add("Workflow node ids must be unique: " + String.join(", ", duplicateIds));
        }

        if (!hasStart) {
            errors.add("Workflow definition must include at least one start node");
        }

        if (!hasEnd) {
            errors.add("Workflow definition must include at least one end node");
        }
    }

    private Set<String> collectNodeIds(JsonNode nodesNode) {
        Set<String> ids = new HashSet<>();

        for (JsonNode node : nodesNode) {
            JsonNode idNode = node.path("id");
            if (idNode.isTextual() && !idNode.asText().trim().isEmpty()) {
                ids.add(idNode.asText().trim());
            }
        }

        return ids;
    }

    private void validateWorkflowEdges(JsonNode edgesNode, Set<String> nodeIds, List<String> errors) {
        for (JsonNode edge : edgesNode) {
            String source = edge.path("source").isTextual() ? edge.path("source").asText().trim() : "";
            String target = edge.path("target").isTextual() ? edge.path("target").asText().trim() : "";

            if (source.isEmpty() || target.isEmpty()) {
                errors.add("Workflow edges must have non-empty source and target");
                continue;
            }

            if (!nodeIds.contains(source)) {
                errors.add("Workflow edge source does not match an existing node: " + source);
            }

            if (!nodeIds.contains(target)) {
                errors.add("Workflow edge target does not match an existing node: " + target);
            }
        }
    }

    private boolean isStartNodeType(String type) {
        return "start".equalsIgnoreCase(type) || "startEvent".equalsIgnoreCase(type);
    }

    private boolean isEndNodeType(String type) {
        return "end".equalsIgnoreCase(type) || "endEvent".equalsIgnoreCase(type);
    }

    private boolean isUserTaskNodeType(String type) {
        return "userTask".equalsIgnoreCase(type) || "user_task".equalsIgnoreCase(type);
    }

    private void validateUserTaskFormMapping(String nodeId, JsonNode node, List<String> errors) {
        JsonNode formKey = node.path("formKey");
        JsonNode formId = node.path("formId");
        JsonNode assignee = node.path("assignee");
        JsonNode candidateGroup = node.path("candidateGroup");

        if (!formKey.isMissingNode() && !formKey.isTextual() && !formKey.isNumber()) {
            errors.add("User task '" + nodeId + "' formKey must be a string or number");
        }

        if (!formId.isMissingNode() && !formId.isTextual() && !formId.isNumber()) {
            errors.add("User task '" + nodeId + "' formId must be a string or number");
        }

        if (!assignee.isMissingNode() && !assignee.isTextual()) {
            errors.add("User task '" + nodeId + "' assignee must be a string");
        }

        if (!candidateGroup.isMissingNode() && !candidateGroup.isTextual()) {
            errors.add("User task '" + nodeId + "' candidateGroup must be a string");
        }
    }

    private ProcessDefinitionDTO toDTO(ProcessDefinition pd) {
        ProcessDefinitionDTO dto = new ProcessDefinitionDTO(
            pd.getId() != null ? pd.getId() : 0L,
            pd.getName(), pd.getVersion(), pd.getStatus().name(),
            pd.getDescription(), pd.getCreatedAt(), pd.getUpdatedAt(), pd.getDefinition()
        );
        dto.flowableDeploymentId = pd.getFlowableDeploymentId();
        dto.flowableProcessDefinitionId = pd.getFlowableProcessDefinitionId();
        dto.flowableProcessDefinitionKey = pd.getFlowableProcessDefinitionKey();
        dto.flowableProcessDefinitionVersion = pd.getFlowableProcessDefinitionVersion();
        dto.publishedAt = pd.getPublishedAt();
        return dto;
    }

    private WorkflowDeploymentDTO toWorkflowDeploymentDTO(org.flowable.engine.repository.ProcessDefinition flowableDefinition) {
        WorkflowDeploymentDTO dto = new WorkflowDeploymentDTO();
        dto.flowableProcessDefinitionId = flowableDefinition.getId();
        dto.flowableProcessDefinitionKey = flowableDefinition.getKey();
        dto.flowableProcessDefinitionName = flowableDefinition.getName();
        dto.flowableProcessDefinitionVersion = flowableDefinition.getVersion();
        dto.deploymentId = flowableDefinition.getDeploymentId();
        dto.resourceName = flowableDefinition.getResourceName();
        dto.suspended = flowableDefinition.isSuspended();

        Deployment deployment = flowableRepositoryService.createDeploymentQuery()
                .deploymentId(flowableDefinition.getDeploymentId())
                .singleResult();
        if (deployment != null) {
            dto.deploymentName = deployment.getName();
            dto.deployedAt = toLocalDateTime(deployment.getDeploymentTime());
        }

        return dto;
    }

    private LocalDateTime toLocalDateTime(Date date) {
        if (date == null) {
            return null;
        }
        return LocalDateTime.ofInstant(date.toInstant(), ZoneId.systemDefault());
    }
}
