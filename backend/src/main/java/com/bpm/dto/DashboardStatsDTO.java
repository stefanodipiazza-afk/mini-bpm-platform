package com.bpm.dto;

public class DashboardStatsDTO {
    public Long totalProcesses;
    public Long activeInstances;
    public Long completedInstances;
    public Long failedInstances;
    public Long pendingTasks;

    public DashboardStatsDTO() {}

    public DashboardStatsDTO(Long totalProcesses, Long activeInstances, Long completedInstances,
                            Long failedInstances, Long pendingTasks) {
        this.totalProcesses = totalProcesses;
        this.activeInstances = activeInstances;
        this.completedInstances = completedInstances;
        this.failedInstances = failedInstances;
        this.pendingTasks = pendingTasks;
    }
}
