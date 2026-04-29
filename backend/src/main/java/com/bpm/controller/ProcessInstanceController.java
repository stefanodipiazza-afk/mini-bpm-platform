package com.bpm.controller;

import com.bpm.dto.*;
import com.bpm.service.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/instances")
@CrossOrigin(origins = "*")
public class ProcessInstanceController {

    @Autowired
    private ProcessInstanceService processInstanceService;

    @GetMapping("/{id}")
    public ResponseEntity<ProcessInstanceDTO> getProcessInstance(@PathVariable Long id) {
        ProcessInstanceDTO result = processInstanceService.getProcessInstance(id);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/{id}/history")
    public ResponseEntity<List<ExecutionLogDTO>> getExecutionHistory(@PathVariable Long id) {
        List<ExecutionLogDTO> history = processInstanceService.getExecutionHistory(id);
        return ResponseEntity.ok(history);
    }
}
