package com.bpm.service;

import com.bpm.entity.UserTask;
import com.bpm.entity.ProcessInstance;
import com.bpm.dto.UserTaskDTO;
import com.bpm.dto.UserTaskCompleteDTO;
import com.bpm.repository.UserTaskRepository;
import com.bpm.repository.ProcessInstanceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@SuppressWarnings("all")
public class UserTaskService {

    @Autowired
    private UserTaskRepository userTaskRepository;

    @Autowired
    private ProcessInstanceRepository processInstanceRepository;

    public UserTaskDTO getTask(Long id) {
        UserTask task = userTaskRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Task not found: " + id));
        return toDTO(task);
    }

    public List<UserTaskDTO> listTasks() {
        return userTaskRepository.findByStatus(UserTask.TaskStatus.PENDING).stream()
            .map(this::toDTO)
            .collect(Collectors.toList());
    }

    public List<UserTaskDTO> listTasksForUser(String userId) {
        return userTaskRepository.findByAssignedTo(userId).stream()
            .map(this::toDTO)
            .collect(Collectors.toList());
    }

    public List<UserTaskDTO> listTasksForProcess(Long processInstanceId) {
        return userTaskRepository.findByProcessInstanceId(processInstanceId).stream()
            .map(this::toDTO)
            .collect(Collectors.toList());
    }

    @Transactional
    public UserTaskDTO claimTask(Long taskId, String userId) {
        UserTask task = userTaskRepository.findById(taskId)
            .orElseThrow(() -> new RuntimeException("Task not found: " + taskId));

        task.setAssignedTo(userId);
        UserTask saved = userTaskRepository.save(task);
        return toDTO(saved);
    }

    @Transactional
    public UserTaskDTO completeTask(Long taskId, UserTaskCompleteDTO dto) {
        UserTask task = userTaskRepository.findById(taskId)
            .orElseThrow(() -> new RuntimeException("Task not found: " + taskId));

        task.setFormData(dto.formData);
        task.setStatus(UserTask.TaskStatus.COMPLETED);
        task.setCompletedAt(LocalDateTime.now());

        UserTask saved = userTaskRepository.save(task);

        // Update process instance progress (simplified - in production would check for other pending tasks)
        ProcessInstance pi = processInstanceRepository.findById(task.getProcessInstanceId())
            .orElseThrow();

        // Check if all tasks are completed
        List<UserTask> pendingTasks = userTaskRepository.findByProcessInstanceId(pi.getId()).stream()
            .filter(t -> t.getStatus() == UserTask.TaskStatus.PENDING)
            .collect(Collectors.toList());

        if (pendingTasks.isEmpty()) {
            pi.setStatus(ProcessInstance.InstanceStatus.COMPLETED);
            pi.setCompletedAt(LocalDateTime.now());
            processInstanceRepository.save(pi);
        }

        return toDTO(saved);
    }

    private UserTaskDTO toDTO(UserTask task) {
        UserTaskDTO dto = new UserTaskDTO();
        dto.id = task.getId() != null ? task.getId() : 0L;
        dto.processInstanceId = task.getProcessInstanceId() != null ? task.getProcessInstanceId() : 0L;
        dto.taskName = task.getTaskName();
        dto.assignedTo = task.getAssignedTo();
        dto.status = task.getStatus().name();
        dto.formSchema = task.getFormSchema();
        dto.formData = task.getFormData();
        dto.dueDate = task.getDueDate();
        dto.createdAt = task.getCreatedAt();
        dto.completedAt = task.getCompletedAt();
        return dto;
    }
}
