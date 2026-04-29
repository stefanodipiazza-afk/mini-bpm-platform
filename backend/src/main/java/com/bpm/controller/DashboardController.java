package com.bpm.controller;

import com.bpm.repository.FormDefinitionRepository;
import com.bpm.repository.ProcessDefinitionRepository;
import com.bpm.repository.ProcessInstanceRepository;
import com.bpm.repository.UserTaskRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final ProcessDefinitionRepository processDefinitionRepository;
    private final ProcessInstanceRepository processInstanceRepository;
    private final FormDefinitionRepository formDefinitionRepository;
    private final UserTaskRepository userTaskRepository;

    public DashboardController(ProcessDefinitionRepository processDefinitionRepository,
                               ProcessInstanceRepository processInstanceRepository,
                               FormDefinitionRepository formDefinitionRepository,
                               UserTaskRepository userTaskRepository) {
        this.processDefinitionRepository = processDefinitionRepository;
        this.processInstanceRepository = processInstanceRepository;
        this.formDefinitionRepository = formDefinitionRepository;
        this.userTaskRepository = userTaskRepository;
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats() {
        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("processDefinitions", processDefinitionRepository.count());
        stats.put("processInstances", processInstanceRepository.count());
        stats.put("forms", formDefinitionRepository.count());
        stats.put("tasks", userTaskRepository.count());
        stats.put("pendingTasks", userTaskRepository.countPending());
        return ResponseEntity.ok(stats);
    }
}