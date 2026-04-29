package com.bpm.service;

import com.bpm.dto.DashboardStatsDTO;
import com.bpm.repository.ProcessDefinitionRepository;
import com.bpm.repository.ProcessInstanceRepository;
import com.bpm.repository.UserTaskRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class DashboardService {

    @Autowired
    private ProcessDefinitionRepository processDefinitionRepository;

    @Autowired
    private ProcessInstanceRepository processInstanceRepository;

    @Autowired
    private UserTaskRepository userTaskRepository;

    public DashboardStatsDTO getDashboardStats() {
        Long totalProcesses = processDefinitionRepository.count();
        Long activeInstances = processInstanceRepository.countActive();
        Long completedInstances = processInstanceRepository.countCompleted();
        Long failedInstances = processInstanceRepository.countFailed();
        Long pendingTasks = userTaskRepository.countPending();

        return new DashboardStatsDTO(
            totalProcesses,
            activeInstances,
            completedInstances,
            failedInstances,
            pendingTasks
        );
    }
}
