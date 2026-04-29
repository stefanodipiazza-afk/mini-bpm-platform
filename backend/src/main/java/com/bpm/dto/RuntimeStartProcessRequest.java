package com.bpm.dto;

import java.util.Map;

public class RuntimeStartProcessRequest {
    public String businessKey;
    public Map<String, Object> variables;

    public RuntimeStartProcessRequest() {}
}
