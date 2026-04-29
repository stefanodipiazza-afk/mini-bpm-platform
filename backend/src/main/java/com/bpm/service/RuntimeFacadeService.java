package com.bpm.service;

import com.bpm.dto.RuntimeClaimTaskRequest;
import com.bpm.dto.RuntimeCompleteTaskRequest;
import com.bpm.dto.RuntimeCompleteTaskResponse;
import com.bpm.dto.ExecutionLogDTO;
import com.bpm.dto.RuntimeProcessInstanceDTO;
import com.bpm.dto.RuntimeStartProcessRequest;
import com.bpm.dto.RuntimeHistoryEventDTO;
import com.bpm.dto.RuntimeTaskDTO;
import com.bpm.dto.RuntimeTaskHistoryDTO;
import com.bpm.entity.ExecutionLog;
import com.bpm.entity.FormDefinition;
import com.bpm.entity.ProcessDefinition;
import com.bpm.entity.ProcessInstance;
import com.bpm.entity.UserTask;
import com.bpm.repository.ExecutionLogRepository;
import com.bpm.repository.FormDefinitionRepository;
import com.bpm.repository.ProcessDefinitionRepository;
import com.bpm.repository.ProcessInstanceRepository;
import com.bpm.repository.UserTaskRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.EntityNotFoundException;
import org.flowable.common.engine.api.FlowableException;
import org.flowable.common.engine.api.FlowableIllegalArgumentException;
import org.flowable.common.engine.api.FlowableObjectNotFoundException;
import org.flowable.common.engine.api.FlowableTaskAlreadyClaimedException;
import org.flowable.engine.RuntimeService;
import org.flowable.engine.TaskService;
import org.flowable.engine.HistoryService;
import org.flowable.engine.history.HistoricActivityInstance;
import org.flowable.engine.history.HistoricProcessInstance;
import org.flowable.identitylink.api.IdentityLink;
import org.flowable.task.api.Task;
import org.flowable.task.api.history.HistoricTaskInstance;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Collections;
import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class RuntimeFacadeService {

    private final ProcessDefinitionRepository processDefinitionRepository;
    private final ProcessInstanceRepository processInstanceRepository;
    private final UserTaskRepository userTaskRepository;
    private final FormDefinitionRepository formDefinitionRepository;
    private final ExecutionLogRepository executionLogRepository;
    private final RuntimeService runtimeService;
    private final TaskService taskService;
    private final HistoryService historyService;
    private final ObjectMapper objectMapper;

    public RuntimeFacadeService(ProcessDefinitionRepository processDefinitionRepository,
                                ProcessInstanceRepository processInstanceRepository,
                                UserTaskRepository userTaskRepository,
                                FormDefinitionRepository formDefinitionRepository,
                                ExecutionLogRepository executionLogRepository,
                                RuntimeService runtimeService,
                                TaskService taskService,
                                HistoryService historyService,
                                ObjectMapper objectMapper) {
        this.processDefinitionRepository = processDefinitionRepository;
        this.processInstanceRepository = processInstanceRepository;
        this.userTaskRepository = userTaskRepository;
        this.formDefinitionRepository = formDefinitionRepository;
        this.executionLogRepository = executionLogRepository;
        this.runtimeService = runtimeService;
        this.taskService = taskService;
        this.historyService = historyService;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public RuntimeProcessInstanceDTO startProcess(Long processDefinitionId, RuntimeStartProcessRequest request) {
        if (processDefinitionId == null) {
            throw new IllegalArgumentException("processDefinitionId is required");
        }

        ProcessDefinition processDefinition = processDefinitionRepository.findById(processDefinitionId)
                .orElseThrow(() -> new IllegalArgumentException("Process definition not found: " + processDefinitionId));

        if (processDefinition.getStatus() != ProcessDefinition.ProcessStatus.PUBLISHED) {
            throw new IllegalStateException("Process definition must be published before it can be started");
        }
        if (processDefinition.getFlowableProcessDefinitionId() == null) {
            throw new IllegalStateException("Published process definition has no Flowable process definition id");
        }

        Map<String, Object> variables = request != null && request.variables != null
                ? request.variables
                : Collections.emptyMap();
        String businessKey = request != null ? request.businessKey : null;

        org.flowable.engine.runtime.ProcessInstance flowableInstance =
                runtimeService.startProcessInstanceById(
                        processDefinition.getFlowableProcessDefinitionId(),
                        businessKey,
                        variables
                );

        ProcessInstance processInstance = new ProcessInstance(flowableInstance.getId(), processDefinition.getId());
        processInstance.setStatus(ProcessInstance.InstanceStatus.ACTIVE);
        processInstance.setVariables(toJson(variables));

        ProcessInstance saved = processInstanceRepository.save(processInstance);
        executionLogRepository.save(new ExecutionLog(saved.getId(), ExecutionLog.EventType.PROCESS_STARTED));

        return toProcessInstanceDTO(saved, processDefinition, businessKey, variables);
    }

    public List<RuntimeTaskDTO> listMyTasks(String userId) {
        if (userId == null || userId.isBlank()) {
            throw new IllegalArgumentException("userId is required");
        }

        return taskService.createTaskQuery()
                .taskAssignee(userId)
                .active()
                .orderByTaskCreateTime()
                .desc()
                .list()
                .stream()
                .map(this::toTaskDTO)
                .toList();
    }

    public List<RuntimeTaskDTO> listGroupTasks(List<String> groupIds) {
        List<String> normalizedGroupIds = groupIds == null
                ? List.of()
                : groupIds.stream()
                        .filter(groupId -> groupId != null && !groupId.isBlank())
                        .map(String::trim)
                        .toList();

        if (normalizedGroupIds.isEmpty()) {
            throw new IllegalArgumentException("At least one group id is required");
        }

        return taskService.createTaskQuery()
                .taskCandidateGroupIn(normalizedGroupIds)
                .active()
                .orderByTaskCreateTime()
                .desc()
                .list()
                .stream()
                .map(this::toTaskDTO)
                .toList();
    }

    public RuntimeTaskDTO getTask(String taskId) {
        return toTaskDTO(getActiveTask(taskId));
    }

    public RuntimeProcessInstanceDTO getProcessInstance(Long processInstanceId) {
        if (processInstanceId == null) {
            throw new IllegalArgumentException("processInstanceId is required");
        }

        ProcessInstance processInstance = processInstanceRepository.findById(processInstanceId)
                .orElseThrow(() -> new EntityNotFoundException("Process instance not found: " + processInstanceId));
        Long processDefinitionId = processInstance.getProcessDefinitionId();
        if (processDefinitionId == null) {
            throw new IllegalStateException("Process instance has no process definition id");
        }

        ProcessDefinition processDefinition = processDefinitionRepository.findById(processDefinitionId)
                .orElseThrow(() -> new EntityNotFoundException("Process definition not found: " + processDefinitionId));

        String flowableProcessInstanceId = processInstance.getFlowableProcessInstanceId();
        org.flowable.engine.runtime.ProcessInstance flowableInstance = runtimeService.createProcessInstanceQuery()
                .processInstanceId(flowableProcessInstanceId)
                .singleResult();
        HistoricProcessInstance historicProcessInstance = historyService.createHistoricProcessInstanceQuery()
                .processInstanceId(flowableProcessInstanceId)
                .singleResult();

        Map<String, Object> variables = flowableInstance != null
                ? runtimeService.getVariables(flowableProcessInstanceId)
                : historicVariables(flowableProcessInstanceId);
        if (variables.isEmpty()) {
            variables = fromJson(processInstance.getVariables());
        }
        String businessKey = flowableInstance != null
                ? flowableInstance.getBusinessKey()
                : historicProcessInstance != null ? historicProcessInstance.getBusinessKey() : null;

        RuntimeProcessInstanceDTO dto = toProcessInstanceDTO(processInstance, processDefinition, businessKey, variables);
        applyFlowableInstanceState(dto, flowableInstance, historicProcessInstance);
        dto.activeTasks = taskService.createTaskQuery()
                .processInstanceId(flowableProcessInstanceId)
                .active()
                .orderByTaskCreateTime()
                .desc()
                .list()
                .stream()
                .map(this::toTaskDTO)
                .toList();
        dto.history = executionLogRepository.findByProcessInstanceIdOrderByTimestampAsc(processInstance.getId())
                .stream()
                .map(this::toExecutionLogDTO)
                .toList();
        dto.flowableHistory = listFlowableHistory(flowableProcessInstanceId);
        dto.taskHistory = listTaskHistoryByFlowableProcessInstanceId(flowableProcessInstanceId);
        return dto;
    }

    public List<RuntimeHistoryEventDTO> listInstanceHistory(Long processInstanceId) {
        ProcessInstance processInstance = getApplicationProcessInstance(processInstanceId);
        return listFlowableHistory(processInstance.getFlowableProcessInstanceId());
    }

    public List<RuntimeTaskHistoryDTO> listTaskHistory(Long processInstanceId) {
        ProcessInstance processInstance = getApplicationProcessInstance(processInstanceId);
        return listTaskHistoryByFlowableProcessInstanceId(processInstance.getFlowableProcessInstanceId());
    }

    @Transactional
    public RuntimeTaskDTO claimTask(String taskId, RuntimeClaimTaskRequest request) {
        String userId = request != null ? request.userId : null;
        if (userId == null || userId.isBlank()) {
            throw new IllegalArgumentException("userId is required");
        }

        Task task = getActiveTask(taskId);
        if (task.getAssignee() != null && !task.getAssignee().isBlank()) {
            if (task.getAssignee().equals(userId)) {
                return toTaskDTO(task);
            }
            throw new IllegalStateException("Task is already assigned to another user");
        }

        try {
            taskService.claim(task.getId(), userId);
        } catch (FlowableTaskAlreadyClaimedException e) {
            throw new IllegalStateException("Task is already claimed", e);
        } catch (FlowableObjectNotFoundException e) {
            throw new EntityNotFoundException("Task not found: " + taskId);
        } catch (FlowableIllegalArgumentException e) {
            throw new IllegalArgumentException(e.getMessage(), e);
        }

        userTaskRepository.findByFlowableTaskId(task.getId()).ifPresent(userTask -> {
            userTask.setAssignedTo(userId);
            userTaskRepository.save(userTask);
            saveTaskLog(userTask, ExecutionLog.EventType.TASK_CLAIMED, "Claimed by " + userId);
        });

        Task claimedTask = taskService.createTaskQuery().taskId(task.getId()).singleResult();
        if (claimedTask == null) {
            throw new EntityNotFoundException("Task not found after claim: " + taskId);
        }
        return toTaskDTO(claimedTask);
    }

    @Transactional
    public RuntimeCompleteTaskResponse completeTask(String taskId, RuntimeCompleteTaskRequest request) {
        String userId = request != null ? request.userId : null;
        if (userId == null || userId.isBlank()) {
            throw new IllegalArgumentException("userId is required");
        }

        Task task = getActiveTask(taskId);
        if (task.getAssignee() == null || task.getAssignee().isBlank()) {
            throw new IllegalStateException("Task must be claimed before it can be completed");
        }
        if (!task.getAssignee().equals(userId)) {
            throw new IllegalStateException("Task is assigned to another user");
        }

        String flowableTaskId = task.getId();
        String flowableProcessInstanceId = task.getProcessInstanceId();
        Optional<UserTask> userTask = userTaskRepository.findByFlowableTaskId(flowableTaskId);
        Optional<ProcessInstance> processInstance =
                processInstanceRepository.findByFlowableProcessInstanceId(flowableProcessInstanceId);
        Map<String, Object> variables = request != null && request.variables != null
                ? request.variables
                : Collections.emptyMap();
        validateTaskFormSubmission(task, variables);

        try {
            taskService.complete(flowableTaskId, variables);
        } catch (FlowableObjectNotFoundException e) {
            throw new EntityNotFoundException("Task not found: " + taskId);
        } catch (FlowableIllegalArgumentException e) {
            throw new IllegalArgumentException(e.getMessage(), e);
        } catch (FlowableException e) {
            throw new IllegalStateException("Unable to complete task: " + e.getMessage(), e);
        }

        userTask.ifPresent(taskEntity -> {
            taskEntity.setAssignedTo(userId);
            taskEntity.setStatus(UserTask.TaskStatus.COMPLETED);
            taskEntity.setCompletedAt(LocalDateTime.now());
            taskEntity.setFormData(toJson(request != null && request.formData != null ? request.formData : variables));
            userTaskRepository.save(taskEntity);
            saveTaskLog(taskEntity, ExecutionLog.EventType.TASK_COMPLETED, "Completed by " + userId);
        });

        String processInstanceStatus = updateProcessInstanceAfterTaskCompletion(processInstance, flowableProcessInstanceId);

        RuntimeCompleteTaskResponse response = new RuntimeCompleteTaskResponse();
        response.taskId = userTask.map(UserTask::getId).orElse(null);
        response.flowableTaskId = flowableTaskId;
        response.processInstanceId = processInstance.map(ProcessInstance::getId).orElse(null);
        response.completed = true;
        response.processInstanceStatus = processInstanceStatus;
        return response;
    }

    private RuntimeProcessInstanceDTO toProcessInstanceDTO(ProcessInstance processInstance,
                                                           ProcessDefinition processDefinition,
                                                           String businessKey,
                                                           Map<String, Object> variables) {
        RuntimeProcessInstanceDTO dto = new RuntimeProcessInstanceDTO();
        dto.id = processInstance.getId();
        dto.flowableProcessInstanceId = processInstance.getFlowableProcessInstanceId();
        dto.processDefinitionId = processInstance.getProcessDefinitionId();
        dto.flowableProcessDefinitionId = processDefinition.getFlowableProcessDefinitionId();
        dto.businessKey = businessKey;
        dto.status = processInstance.getStatus().name();
        dto.startedAt = processInstance.getStartedAt();
        dto.completedAt = processInstance.getCompletedAt();
        dto.variables = variables;
        return dto;
    }

    private ProcessInstance getApplicationProcessInstance(Long processInstanceId) {
        if (processInstanceId == null) {
            throw new IllegalArgumentException("processInstanceId is required");
        }

        return processInstanceRepository.findById(processInstanceId)
                .orElseThrow(() -> new EntityNotFoundException("Process instance not found: " + processInstanceId));
    }

    private void applyFlowableInstanceState(RuntimeProcessInstanceDTO dto,
                                            org.flowable.engine.runtime.ProcessInstance flowableInstance,
                                            HistoricProcessInstance historicProcessInstance) {
        if (flowableInstance != null) {
            dto.status = flowableInstance.isSuspended() ? "SUSPENDED" : "ACTIVE";
            dto.endedAt = null;
            dto.durationMillis = null;
            return;
        }

        if (historicProcessInstance == null) {
            dto.status = "UNKNOWN";
            return;
        }

        dto.startedAt = toLocalDateTime(historicProcessInstance.getStartTime());
        dto.endedAt = toLocalDateTime(historicProcessInstance.getEndTime());
        dto.completedAt = dto.endedAt;
        dto.durationMillis = historicProcessInstance.getDurationInMillis();
        if (historicProcessInstance.getDeleteReason() != null && !historicProcessInstance.getDeleteReason().isBlank()) {
            dto.status = "FAILED";
        } else if (historicProcessInstance.getEndTime() != null) {
            dto.status = "COMPLETED";
        } else {
            dto.status = "ACTIVE";
        }
    }

    private Map<String, Object> historicVariables(String flowableProcessInstanceId) {
        Map<String, Object> variables = new java.util.HashMap<>();
        historyService.createHistoricVariableInstanceQuery()
                .processInstanceId(flowableProcessInstanceId)
                .excludeLocalVariables()
                .list()
                .forEach(variable -> variables.put(variable.getVariableName(), variable.getValue()));
        return variables;
    }

    private List<RuntimeHistoryEventDTO> listFlowableHistory(String flowableProcessInstanceId) {
        return historyService.createHistoricActivityInstanceQuery()
                .processInstanceId(flowableProcessInstanceId)
                .orderByHistoricActivityInstanceStartTime()
                .asc()
                .list()
                .stream()
                .map(this::toRuntimeHistoryEventDTO)
                .toList();
    }

    private List<RuntimeTaskHistoryDTO> listTaskHistoryByFlowableProcessInstanceId(String flowableProcessInstanceId) {
        return historyService.createHistoricTaskInstanceQuery()
                .processInstanceId(flowableProcessInstanceId)
                .includeProcessVariables()
                .orderByHistoricTaskInstanceStartTime()
                .asc()
                .list()
                .stream()
                .map(this::toRuntimeTaskHistoryDTO)
                .toList();
    }

    private RuntimeHistoryEventDTO toRuntimeHistoryEventDTO(HistoricActivityInstance activity) {
        RuntimeHistoryEventDTO dto = new RuntimeHistoryEventDTO();
        dto.type = activity.getEndTime() == null ? "ACTIVITY_STARTED" : "ACTIVITY_COMPLETED";
        dto.label = activity.getActivityName() != null ? activity.getActivityName() : activity.getActivityId();
        dto.activityId = activity.getActivityId();
        dto.activityName = activity.getActivityName();
        dto.activityType = activity.getActivityType();
        dto.taskId = activity.getTaskId();
        dto.assignee = activity.getAssignee();
        dto.startedAt = toLocalDateTime(activity.getStartTime());
        dto.endedAt = toLocalDateTime(activity.getEndTime());
        dto.durationMillis = activity.getDurationInMillis();
        return dto;
    }

    private RuntimeTaskHistoryDTO toRuntimeTaskHistoryDTO(HistoricTaskInstance task) {
        RuntimeTaskHistoryDTO dto = new RuntimeTaskHistoryDTO();
        dto.flowableTaskId = task.getId();
        dto.name = task.getName();
        dto.taskDefinitionKey = task.getTaskDefinitionKey();
        dto.assignee = task.getAssignee();
        dto.owner = task.getOwner();
        dto.formKey = task.getFormKey();
        dto.deleteReason = task.getDeleteReason();
        dto.createdAt = toLocalDateTime(task.getCreateTime());
        dto.claimTime = toLocalDateTime(task.getClaimTime());
        dto.endedAt = toLocalDateTime(task.getEndTime());
        dto.dueDate = toLocalDateTime(task.getDueDate());
        dto.durationMillis = task.getDurationInMillis();
        dto.status = task.getEndTime() == null ? "ACTIVE" : "COMPLETED";
        if (task.getDeleteReason() != null && !task.getDeleteReason().isBlank()) {
            dto.status = "DELETED";
        }
        return dto;
    }

    private RuntimeTaskDTO toTaskDTO(Task task) {
        RuntimeTaskDTO dto = new RuntimeTaskDTO();
        dto.id = userTaskRepository.findByFlowableTaskId(task.getId())
                .map(com.bpm.entity.UserTask::getId)
                .orElse(null);
        dto.flowableTaskId = task.getId();
        dto.processInstanceId = processInstanceRepository.findByFlowableProcessInstanceId(task.getProcessInstanceId())
                .map(ProcessInstance::getId)
                .orElse(null);
        dto.flowableProcessInstanceId = task.getProcessInstanceId();
        dto.name = task.getName();
        dto.assignee = task.getAssignee();
        dto.candidateGroups = candidateGroups(task.getId());
        dto.formKey = task.getFormKey();
        dto.formSchema = resolveFormSchema(task);
        dto.status = task.getAssignee() == null ? "CANDIDATE" : "ASSIGNED";
        dto.createdAt = toLocalDateTime(task.getCreateTime());
        dto.dueDate = toLocalDateTime(task.getDueDate());
        dto.variables = taskService.getVariables(task.getId());
        return dto;
    }

    private String resolveFormSchema(Task task) {
        String formKey = task.getFormKey();
        if (formKey != null && !formKey.isBlank()) {
            Optional<FormDefinition> formDefinition = resolveFormDefinition(formKey.trim());
            if (formDefinition.isPresent()) {
                return formDefinition.get().getSchema();
            }
        }

        return userTaskRepository.findByFlowableTaskId(task.getId())
                .map(UserTask::getFormSchema)
                .filter(schema -> schema != null && !schema.isBlank())
                .orElse(null);
    }

    private void validateTaskFormSubmission(Task task, Map<String, Object> variables) {
        String formSchema = resolveFormSchema(task);
        if (formSchema == null || formSchema.isBlank()) {
            return;
        }

        JsonNode root;
        try {
            root = objectMapper.readTree(formSchema);
        } catch (Exception e) {
            throw new IllegalStateException("Task form schema is not valid JSON", e);
        }

        JsonNode fields = root.path("fields");
        if (!fields.isArray()) {
            throw new IllegalStateException("Task form schema must contain a fields array");
        }

        for (JsonNode field : fields) {
            validateSubmittedField(field, variables);
        }
    }

    private void validateSubmittedField(JsonNode field, Map<String, Object> variables) {
        String id = fieldText(field, "id", fieldText(field, "name", ""));
        String type = fieldText(field, "type", "");
        String label = fieldText(field, "label", id);

        if (id.isBlank() || type.isBlank()) {
            throw new IllegalStateException("Task form schema contains a field without id/name or type");
        }

        Object value = variables.get(id);
        boolean required = field.path("required").asBoolean(false);
        if (isMissingSubmittedValue(value)) {
            if (required) {
                throw new IllegalArgumentException(label + " is required");
            }
            return;
        }

        switch (type) {
            case "text", "textarea" -> validateTextValue(label, value, field);
            case "number" -> validateNumberValue(label, value, field);
            case "date" -> validateDateValue(label, value);
            case "select" -> validateSelectValue(label, value, field.path("options"));
            case "checkbox" -> {
                if (!(value instanceof Boolean)) {
                    throw new IllegalArgumentException(label + " must be true or false");
                }
            }
            default -> throw new IllegalArgumentException("Unsupported form field type: " + type);
        }
    }

    private void validateTextValue(String label, Object value, JsonNode field) {
        if (!(value instanceof String textValue)) {
            throw new IllegalArgumentException(label + " must be text");
        }

        JsonNode minLength = field.path("minLength");
        if (minLength.isNumber() && textValue.length() < minLength.asInt()) {
            throw new IllegalArgumentException(label + " must contain at least " + minLength.asInt() + " characters");
        }

        JsonNode maxLength = field.path("maxLength");
        if (maxLength.isNumber() && textValue.length() > maxLength.asInt()) {
            throw new IllegalArgumentException(label + " must contain at most " + maxLength.asInt() + " characters");
        }
    }

    private void validateNumberValue(String label, Object value, JsonNode field) {
        if (!(value instanceof Number numberValue)) {
            throw new IllegalArgumentException(label + " must be a number");
        }

        double submitted = numberValue.doubleValue();
        JsonNode min = field.path("min");
        if (min.isNumber() && submitted < min.asDouble()) {
            throw new IllegalArgumentException(label + " must be greater than or equal to " + min.asDouble());
        }

        JsonNode max = field.path("max");
        if (max.isNumber() && submitted > max.asDouble()) {
            throw new IllegalArgumentException(label + " must be less than or equal to " + max.asDouble());
        }
    }

    private void validateDateValue(String label, Object value) {
        if (!(value instanceof String textValue)) {
            throw new IllegalArgumentException(label + " must be a date string");
        }

        try {
            LocalDate.parse(textValue);
        } catch (Exception e) {
            throw new IllegalArgumentException(label + " must be a valid date");
        }
    }

    private void validateSelectValue(String label, Object value, JsonNode options) {
        if (!options.isArray() || options.isEmpty()) {
            throw new IllegalStateException(label + " select field has no options");
        }

        String submitted = String.valueOf(value);
        for (JsonNode option : options) {
            JsonNode optionValue = option.path("value");
            if (!optionValue.isMissingNode() && !optionValue.isNull()
                    && submitted.equals(optionValue.asText())) {
                return;
            }
        }

        throw new IllegalArgumentException(label + " must be one of the available options");
    }

    private boolean isMissingSubmittedValue(Object value) {
        return value == null || (value instanceof String textValue && textValue.isBlank());
    }

    private String fieldText(JsonNode node, String fieldName, String defaultValue) {
        JsonNode value = node.path(fieldName);
        return value.isTextual() ? value.asText().trim() : defaultValue;
    }

    private Optional<FormDefinition> resolveFormDefinition(String formKey) {
        try {
            Long formDefinitionId = Long.parseLong(formKey);
            return formDefinitionRepository.findById(formDefinitionId);
        } catch (NumberFormatException e) {
            Optional<FormDefinition> exactMatch = formDefinitionRepository.findFirstByNameOrderByVersionDesc(formKey);
            if (exactMatch.isPresent()) {
                return exactMatch;
            }

            String normalizedFormKey = normalizeFormKey(formKey);
            return formDefinitionRepository.findByOrderByCreatedAtDesc().stream()
                    .filter(form -> normalizeFormKey(form.getName()).equals(normalizedFormKey))
                    .findFirst();
        }
    }

    private String normalizeFormKey(String value) {
        if (value == null) {
            return "";
        }
        return value.trim().toLowerCase().replaceAll("[^a-z0-9]+", "_").replaceAll("^_+|_+$", "");
    }

    private Task getActiveTask(String taskId) {
        if (taskId == null || taskId.isBlank()) {
            throw new IllegalArgumentException("taskId is required");
        }

        String flowableTaskId = resolveFlowableTaskId(taskId);
        Task task = taskService.createTaskQuery()
                .taskId(flowableTaskId)
                .active()
                .singleResult();
        if (task == null) {
            throw new EntityNotFoundException("Task not found: " + taskId);
        }
        return task;
    }

    private String resolveFlowableTaskId(String taskId) {
        try {
            Long applicationTaskId = Long.parseLong(taskId);
            return userTaskRepository.findById(applicationTaskId)
                    .map(UserTask::getFlowableTaskId)
                    .orElse(taskId);
        } catch (NumberFormatException e) {
            return taskId;
        }
    }

    private void saveTaskLog(UserTask task, ExecutionLog.EventType eventType, String eventData) {
        ExecutionLog log = new ExecutionLog(task.getProcessInstanceId(), eventType);
        log.setTaskId(task.getId());
        log.setEventData(eventData);
        executionLogRepository.save(log);
    }

    private String updateProcessInstanceAfterTaskCompletion(Optional<ProcessInstance> processInstance,
                                                            String flowableProcessInstanceId) {
        boolean active = runtimeService.createProcessInstanceQuery()
                .processInstanceId(flowableProcessInstanceId)
                .singleResult() != null;

        if (processInstance.isEmpty()) {
            return active ? "ACTIVE" : "COMPLETED";
        }

        ProcessInstance instance = processInstance.get();
        if (active) {
            Map<String, Object> variables = runtimeService.getVariables(flowableProcessInstanceId);
            instance.setVariables(toJson(variables));
            processInstanceRepository.save(instance);
            return instance.getStatus().name();
        }

        instance.setStatus(ProcessInstance.InstanceStatus.COMPLETED);
        instance.setCompletedAt(LocalDateTime.now());
        processInstanceRepository.save(instance);
        executionLogRepository.save(new ExecutionLog(instance.getId(), ExecutionLog.EventType.PROCESS_COMPLETED));
        return instance.getStatus().name();
    }

    private List<String> candidateGroups(String flowableTaskId) {
        return taskService.getIdentityLinksForTask(flowableTaskId).stream()
                .filter(link -> "candidate".equals(link.getType()))
                .map(IdentityLink::getGroupId)
                .filter(groupId -> groupId != null && !groupId.isBlank())
                .distinct()
                .toList();
    }

    private LocalDateTime toLocalDateTime(Date date) {
        if (date == null) {
            return null;
        }
        return LocalDateTime.ofInstant(date.toInstant(), ZoneId.systemDefault());
    }

    private String toJson(Map<String, Object> value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (Exception e) {
            return "{}";
        }
    }

    private Map<String, Object> fromJson(String value) {
        if (value == null || value.isBlank()) {
            return Collections.emptyMap();
        }
        try {
            return objectMapper.readValue(value, new TypeReference<Map<String, Object>>() {});
        } catch (Exception e) {
            return Collections.emptyMap();
        }
    }

    private ExecutionLogDTO toExecutionLogDTO(ExecutionLog log) {
        return new ExecutionLogDTO(
                log.getId(),
                log.getProcessInstanceId(),
                log.getEventType().name(),
                log.getEventData(),
                log.getTimestamp()
        );
    }

}
