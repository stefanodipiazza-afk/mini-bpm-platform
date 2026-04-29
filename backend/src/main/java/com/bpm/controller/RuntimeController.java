package com.bpm.controller;

import com.bpm.dto.RuntimeClaimTaskRequest;
import com.bpm.dto.RuntimeCompleteTaskRequest;
import com.bpm.dto.RuntimeCompleteTaskResponse;
import com.bpm.dto.RuntimeProcessInstanceDTO;
import com.bpm.dto.RuntimeStartProcessRequest;
import com.bpm.dto.RuntimeTaskDTO;
import com.bpm.dto.RuntimeHistoryEventDTO;
import com.bpm.dto.RuntimeTaskHistoryDTO;
import com.bpm.service.RuntimeFacadeService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

@RestController
@RequestMapping("/api/runtime")
public class RuntimeController {

    private final RuntimeFacadeService runtimeFacadeService;

    public RuntimeController(RuntimeFacadeService runtimeFacadeService) {
        this.runtimeFacadeService = runtimeFacadeService;
    }

    @PostMapping("/processes/{processDefinitionId}/start")
    public ResponseEntity<RuntimeProcessInstanceDTO> startProcess(
            @PathVariable Long processDefinitionId,
            @RequestBody(required = false) RuntimeStartProcessRequest request) {
        RuntimeProcessInstanceDTO result = runtimeFacadeService.startProcess(processDefinitionId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(result);
    }

    @GetMapping("/tasks/my")
    public ResponseEntity<List<RuntimeTaskDTO>> listMyTasks(@RequestParam String userId) {
        return ResponseEntity.ok(runtimeFacadeService.listMyTasks(userId));
    }

    @GetMapping("/tasks/group")
    public ResponseEntity<List<RuntimeTaskDTO>> listGroupTasks(
            @RequestParam(required = false) List<String> groupId,
            @RequestParam(required = false) String groupIds) {
        return ResponseEntity.ok(runtimeFacadeService.listGroupTasks(parseGroupIds(groupId, groupIds)));
    }

    @GetMapping("/instances/{processInstanceId}")
    public ResponseEntity<RuntimeProcessInstanceDTO> getProcessInstance(@PathVariable Long processInstanceId) {
        return ResponseEntity.ok(runtimeFacadeService.getProcessInstance(processInstanceId));
    }

    @GetMapping("/instances/{processInstanceId}/history")
    public ResponseEntity<List<RuntimeHistoryEventDTO>> listInstanceHistory(@PathVariable Long processInstanceId) {
        return ResponseEntity.ok(runtimeFacadeService.listInstanceHistory(processInstanceId));
    }

    @GetMapping("/instances/{processInstanceId}/task-history")
    public ResponseEntity<List<RuntimeTaskHistoryDTO>> listTaskHistory(@PathVariable Long processInstanceId) {
        return ResponseEntity.ok(runtimeFacadeService.listTaskHistory(processInstanceId));
    }

    @GetMapping("/tasks/{taskId}")
    public ResponseEntity<RuntimeTaskDTO> getTask(@PathVariable String taskId) {
        return ResponseEntity.ok(runtimeFacadeService.getTask(taskId));
    }

    @PostMapping("/tasks/{taskId}/claim")
    public ResponseEntity<RuntimeTaskDTO> claimTask(
            @PathVariable String taskId,
            @RequestBody RuntimeClaimTaskRequest request) {
        return ResponseEntity.ok(runtimeFacadeService.claimTask(taskId, request));
    }

    @PostMapping("/tasks/{taskId}/complete")
    public ResponseEntity<RuntimeCompleteTaskResponse> completeTask(
            @PathVariable String taskId,
            @RequestBody RuntimeCompleteTaskRequest request) {
        return ResponseEntity.ok(runtimeFacadeService.completeTask(taskId, request));
    }

    private List<String> parseGroupIds(List<String> groupId, String groupIds) {
        List<String> result = new ArrayList<>();
        if (groupId != null) {
            result.addAll(groupId);
        }
        if (groupIds != null && !groupIds.isBlank()) {
            result.addAll(Arrays.asList(groupIds.split(",")));
        }
        return result;
    }
}
