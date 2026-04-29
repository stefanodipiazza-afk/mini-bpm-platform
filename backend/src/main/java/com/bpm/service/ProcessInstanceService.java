package com.bpm.service;

import com.bpm.entity.ProcessInstance;
import com.bpm.dto.ProcessInstanceDTO;
import com.bpm.dto.ExecutionLogDTO;
import com.bpm.entity.ExecutionLog;
import com.bpm.repository.ProcessInstanceRepository;
import com.bpm.repository.ExecutionLogRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.core.type.TypeReference;
import org.flowable.engine.RuntimeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@SuppressWarnings("all")
public class ProcessInstanceService {

    @Autowired
    private ProcessInstanceRepository processInstanceRepository;

    @Autowired
    private ExecutionLogRepository executionLogRepository;

    @Autowired
    private RuntimeService flowableRuntimeService;

    @Autowired
    private ObjectMapper objectMapper;

    @Transactional
    public ProcessInstanceDTO startProcessInstance(Long processDefinitionId, String processKey, Map<String, Object> variables) {
        // Start Flowable process
        var flowableInstance = flowableRuntimeService.startProcessInstanceByKey(processKey, variables);

        // Create business process instance record
        ProcessInstance pi = new ProcessInstance(flowableInstance.getId(), processDefinitionId);
        pi.setStatus(ProcessInstance.InstanceStatus.ACTIVE);

        try {
            pi.setVariables(objectMapper.writeValueAsString(variables != null ? variables : new HashMap<>()));
        } catch (Exception e) {
            pi.setVariables("{}");
        }

        ProcessInstance saved = processInstanceRepository.save(pi);

        // Log event
        ExecutionLog log = new ExecutionLog(
            saved.getId() != null ? saved.getId() : 0L,
            com.bpm.entity.ExecutionLog.EventType.PROCESS_STARTED
        );
        executionLogRepository.save(log);

        return toDTO(saved);
    }

    public ProcessInstanceDTO getProcessInstance(Long id) {
        ProcessInstance pi = processInstanceRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Process instance not found: " + id));
        return toDTO(pi);
    }

    public List<ProcessInstanceDTO> listProcessInstances(Long processDefinitionId) {
        return processInstanceRepository.findByProcessDefinitionId(processDefinitionId).stream()
            .map(this::toDTO)
            .collect(Collectors.toList());
    }

    public List<ProcessInstanceDTO> listActiveInstances() {
        return processInstanceRepository.findByStatus(ProcessInstance.InstanceStatus.ACTIVE).stream()
            .map(this::toDTO)
            .collect(Collectors.toList());
    }

    public List<ExecutionLogDTO> getExecutionHistory(Long processInstanceId) {
        return executionLogRepository.findByProcessInstanceIdOrderByTimestampAsc(processInstanceId).stream()
            .map(this::logToDTO)
            .collect(Collectors.toList());
    }

    public Map<String, Object> getProcessVariables(Long processInstanceId) {
        ProcessInstance pi = processInstanceRepository.findById(processInstanceId)
            .orElseThrow(() -> new RuntimeException("Process instance not found"));
        try {
            return objectMapper.readValue(pi.getVariables(), new TypeReference<Map<String, Object>>() {});
        } catch (Exception e) {
            return new HashMap<>();
        }
    }

    @Transactional
    public void completeProcessInstance(Long processInstanceId) {
        ProcessInstance pi = processInstanceRepository.findById(processInstanceId)
            .orElseThrow(() -> new RuntimeException("Process instance not found"));

        pi.setStatus(ProcessInstance.InstanceStatus.COMPLETED);
        pi.setCompletedAt(LocalDateTime.now());
        processInstanceRepository.save(pi);

        ExecutionLog log = new ExecutionLog(
            processInstanceId != null ? processInstanceId : 0L,
            com.bpm.entity.ExecutionLog.EventType.PROCESS_COMPLETED
        );
        executionLogRepository.save(log);
    }

    private ProcessInstanceDTO toDTO(ProcessInstance pi) {
        return new ProcessInstanceDTO(
            pi.getId() != null ? pi.getId() : 0L,
            pi.getProcessDefinitionId() != null ? pi.getProcessDefinitionId() : 0L,
            pi.getStatus().name(),
            pi.getVariables(), pi.getStartedAt(), pi.getCompletedAt()
        );
    }

    private ExecutionLogDTO logToDTO(ExecutionLog log) {
        ExecutionLogDTO dto = new ExecutionLogDTO();
        dto.eventType = log.getEventType().name();
        dto.timestamp = log.getTimestamp();
        dto.eventData = log.getEventData();
        return dto;
    }
}
