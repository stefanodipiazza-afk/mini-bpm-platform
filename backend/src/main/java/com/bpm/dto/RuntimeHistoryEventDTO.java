package com.bpm.dto;

import java.time.LocalDateTime;

public class RuntimeHistoryEventDTO {
    public String type;
    public String label;
    public String activityId;
    public String activityName;
    public String activityType;
    public String taskId;
    public String assignee;
    public LocalDateTime startedAt;
    public LocalDateTime endedAt;
    public Long durationMillis;

    public RuntimeHistoryEventDTO() {}
}
