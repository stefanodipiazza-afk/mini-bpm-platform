package com.bpm.dto;

import jakarta.validation.constraints.NotBlank;

public class ProcessDefinitionUpdateDTO {
    @NotBlank
    public String name;

    public String description;

    @NotBlank
    public String definition;
}
