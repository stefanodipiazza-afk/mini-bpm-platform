package com.bpm.controller;

import com.bpm.dto.ProcessDefinitionCreateDTO;
import com.bpm.dto.ProcessDefinitionDTO;
import com.bpm.dto.ProcessDefinitionUpdateDTO;
import com.bpm.dto.ProcessInstanceDTO;
import com.bpm.dto.WorkflowDeploymentDTO;
import com.bpm.service.ProcessDefinitionService;
import com.bpm.service.ProcessInstanceService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping({"/api/processes", "/api/workflows"})
public class ProcessController {

    private final ProcessDefinitionService processDefinitionService;
    private final ProcessInstanceService processInstanceService;

    public ProcessController(ProcessDefinitionService processDefinitionService,
                             ProcessInstanceService processInstanceService) {
        this.processDefinitionService = processDefinitionService;
        this.processInstanceService = processInstanceService;
    }

    @PostMapping
    public ResponseEntity<ProcessDefinitionDTO> createProcessDefinition(@Valid @RequestBody ProcessDefinitionCreateDTO dto) {
        ProcessDefinitionDTO result = processDefinitionService.createProcessDefinition(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(result);
    }

    @GetMapping
    public ResponseEntity<List<ProcessDefinitionDTO>> listProcessDefinitions() {
        return ResponseEntity.ok(processDefinitionService.listProcessDefinitions());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProcessDefinitionDTO> getProcessDefinition(@PathVariable Long id) {
        return ResponseEntity.ok(processDefinitionService.getProcessDefinition(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ProcessDefinitionDTO> updateProcessDefinition(@PathVariable Long id,
                                                                        @Valid @RequestBody ProcessDefinitionUpdateDTO dto) {
        return ResponseEntity.ok(processDefinitionService.updateProcessDefinition(id, dto));
    }

    @PostMapping("/{id}/publish")
    public ResponseEntity<ProcessDefinitionDTO> publishProcessDefinition(@PathVariable Long id) {
        return ResponseEntity.ok(processDefinitionService.publishProcessDefinition(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProcessDefinition(@PathVariable Long id) {
        processDefinitionService.deleteProcessDefinition(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/start")
    public ResponseEntity<ProcessInstanceDTO> startProcessInstance(@PathVariable Long id,
                                                                   @RequestBody(required = false) Map<String, Object> variables) {
        ProcessDefinitionDTO processDefDto = processDefinitionService.getProcessDefinition(id);
        String processKey = processDefDto.flowableProcessDefinitionKey != null
                ? processDefDto.flowableProcessDefinitionKey
                : processDefDto.name.replaceAll("\\s+", "_");

        ProcessInstanceDTO result = processInstanceService.startProcessInstance(
                id,
                processKey,
                variables != null ? variables : new HashMap<>()
        );

        return ResponseEntity.status(HttpStatus.CREATED).body(result);
    }

    @GetMapping("/{id}/instances")
    public ResponseEntity<List<ProcessInstanceDTO>> listProcessInstances(@PathVariable Long id) {
        return ResponseEntity.ok(processInstanceService.listProcessInstances(id));
    }

    @GetMapping("/{id}/deployments")
    public ResponseEntity<List<WorkflowDeploymentDTO>> listDeploymentHistory(@PathVariable Long id) {
        return ResponseEntity.ok(processDefinitionService.listDeploymentHistory(id));
    }
}
