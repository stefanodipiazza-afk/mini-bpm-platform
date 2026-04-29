package com.bpm.dto;

import java.time.LocalDateTime;

public class FormDefinitionDTO {
    public Long id;
    public String name;
    public Integer version;
    public String schema;
    public String description;
    public LocalDateTime createdAt;
    public LocalDateTime updatedAt;

    public FormDefinitionDTO() {}
}
