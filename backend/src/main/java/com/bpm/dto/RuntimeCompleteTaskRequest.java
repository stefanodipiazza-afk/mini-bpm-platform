package com.bpm.dto;

import java.util.Map;

public class RuntimeCompleteTaskRequest {
    public String userId;
    public Map<String, Object> variables;
    public Map<String, Object> formData;

    public RuntimeCompleteTaskRequest() {}
}
