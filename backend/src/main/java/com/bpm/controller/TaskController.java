package com.bpm.controller;

import com.bpm.entity.UserTask;
import com.bpm.repository.UserTaskRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.lang.NonNull;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tasks")
public class TaskController {

    private final UserTaskRepository userTaskRepository;

    public TaskController(@NonNull UserTaskRepository userTaskRepository) {
        this.userTaskRepository = userTaskRepository;
    }

    @GetMapping
    public ResponseEntity<List<UserTask>> getAllTasks() {
        return ResponseEntity.ok(userTaskRepository.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserTask> getTaskById(@PathVariable @NonNull Long id) {
        return userTaskRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<UserTask> createTask(@RequestBody @NonNull UserTask task) {
        UserTask saved = userTaskRepository.save(task);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<UserTask> updateTask(@PathVariable @NonNull Long id,
                                               @RequestBody @NonNull UserTask payload) {
        return userTaskRepository.findById(id)
                .map(existing -> {
                    existing.setFlowableTaskId(payload.getFlowableTaskId());
                    existing.setProcessInstanceId(payload.getProcessInstanceId());
                    existing.setTaskName(payload.getTaskName());
                    existing.setAssignedTo(payload.getAssignedTo());
                    existing.setStatus(payload.getStatus());
                    existing.setFormSchema(payload.getFormSchema());
                    existing.setFormData(payload.getFormData());
                    existing.setDueDate(payload.getDueDate());
                    existing.setCompletedAt(payload.getCompletedAt());

                    UserTask saved = userTaskRepository.save(existing);
                    return ResponseEntity.ok(saved);
                })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTask(@PathVariable @NonNull Long id) {
        if (!userTaskRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }

        userTaskRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}