package com.bpm.dto;

import java.time.LocalDateTime;
import java.util.List;

public class AppUserDTO {
    public String id;
    public String displayName;
    public String email;
    public Boolean active;
    public List<String> groupIds;
    public LocalDateTime createdAt;
    public LocalDateTime updatedAt;
}
