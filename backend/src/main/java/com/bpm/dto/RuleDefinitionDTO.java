package com.bpm.dto;

import java.time.LocalDateTime;

public class RuleDefinitionDTO {
    public Long id;
    public String name;
    public Integer version;
    public String rules;
    public String description;
    public LocalDateTime createdAt;

    public RuleDefinitionDTO() {}
}
