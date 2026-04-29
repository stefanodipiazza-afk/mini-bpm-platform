package com.bpm.service;

import com.bpm.dto.AppUserDTO;
import com.bpm.dto.AppUserSaveDTO;
import com.bpm.dto.UserGroupDTO;
import com.bpm.dto.UserGroupSaveDTO;
import com.bpm.entity.AppUser;
import com.bpm.entity.UserGroup;
import com.bpm.repository.AppUserRepository;
import com.bpm.repository.UserGroupRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
public class IdentityAdminService {
    private static final Pattern ID_PATTERN = Pattern.compile("[A-Za-z0-9._-]+");

    private final AppUserRepository appUserRepository;
    private final UserGroupRepository userGroupRepository;

    public IdentityAdminService(AppUserRepository appUserRepository,
                                UserGroupRepository userGroupRepository) {
        this.appUserRepository = appUserRepository;
        this.userGroupRepository = userGroupRepository;
    }

    public List<AppUserDTO> listUsers() {
        return appUserRepository.findByOrderByIdAsc().stream()
                .map(this::toUserDTO)
                .collect(Collectors.toList());
    }

    public List<UserGroupDTO> listGroups() {
        return userGroupRepository.findByOrderByIdAsc().stream()
                .map(this::toGroupDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public AppUserDTO createUser(AppUserSaveDTO dto) {
        validateUser(dto, true);
        String userId = normalizeIdentifier(dto.id, "userId");
        String displayName = requireText(dto.displayName, "User displayName is required");

        if (appUserRepository.existsById(userId)) {
            throw new IllegalStateException("User already exists: " + userId);
        }

        AppUser user = new AppUser(userId, displayName);
        applyUserFields(user, dto);
        return toUserDTO(appUserRepository.save(user));
    }

    @Transactional
    public AppUserDTO updateUser(String userId, AppUserSaveDTO dto) {
        String normalizedUserId = normalizeIdentifier(userId, "userId");
        validateUser(dto, false);

        AppUser user = appUserRepository.findById(normalizedUserId)
                .orElseThrow(() -> new EntityNotFoundException("User not found: " + normalizedUserId));
        applyUserFields(user, dto);
        user.setUpdatedAt(LocalDateTime.now());
        return toUserDTO(appUserRepository.save(user));
    }

    @Transactional
    public void deleteUser(String userId) {
        String normalizedUserId = normalizeIdentifier(userId, "userId");
        if (!appUserRepository.existsById(normalizedUserId)) {
            throw new EntityNotFoundException("User not found: " + normalizedUserId);
        }
        appUserRepository.deleteById(normalizedUserId);
    }

    @Transactional
    public UserGroupDTO createGroup(UserGroupSaveDTO dto) {
        validateGroup(dto, true);
        String groupId = normalizeIdentifier(dto.id, "groupId");
        String name = requireText(dto.name, "Group name is required");

        if (userGroupRepository.existsById(groupId)) {
            throw new IllegalStateException("Group already exists: " + groupId);
        }

        UserGroup group = new UserGroup(groupId, name);
        applyGroupFields(group, dto);
        return toGroupDTO(userGroupRepository.save(group));
    }

    @Transactional
    public UserGroupDTO updateGroup(String groupId, UserGroupSaveDTO dto) {
        String normalizedGroupId = normalizeIdentifier(groupId, "groupId");
        validateGroup(dto, false);

        UserGroup group = userGroupRepository.findById(normalizedGroupId)
                .orElseThrow(() -> new EntityNotFoundException("Group not found: " + normalizedGroupId));
        applyGroupFields(group, dto);
        group.setUpdatedAt(LocalDateTime.now());
        return toGroupDTO(userGroupRepository.save(group));
    }

    @Transactional
    public void deleteGroup(String groupId) {
        String normalizedGroupId = normalizeIdentifier(groupId, "groupId");
        if (!userGroupRepository.existsById(normalizedGroupId)) {
            throw new EntityNotFoundException("Group not found: " + normalizedGroupId);
        }

        for (AppUser user : appUserRepository.findByGroups_Id(normalizedGroupId)) {
            user.getGroups().removeIf(userGroup -> normalizedGroupId.equals(userGroup.getId()));
            user.setUpdatedAt(LocalDateTime.now());
        }
        userGroupRepository.deleteById(normalizedGroupId);
    }

    private void applyUserFields(AppUser user, AppUserSaveDTO dto) {
        user.setDisplayName(requireText(dto.displayName, "User displayName is required"));
        user.setEmail(blankToNull(dto.email));
        user.setActive(dto.active == null || dto.active);
        user.setGroups(resolveGroups(dto.groupIds));
    }

    private void applyGroupFields(UserGroup group, UserGroupSaveDTO dto) {
        group.setName(requireText(dto.name, "Group name is required"));
        group.setDescription(blankToNull(dto.description));
        group.setActive(dto.active == null || dto.active);
    }

    private Set<UserGroup> resolveGroups(List<String> groupIds) {
        Set<UserGroup> groups = new HashSet<>();
        if (groupIds == null) {
            return groups;
        }

        for (String groupId : groupIds) {
            if (groupId == null || groupId.isBlank()) {
                continue;
            }
            String normalizedGroupId = normalizeIdentifier(groupId, "groupId");
            UserGroup group = userGroupRepository.findById(normalizedGroupId)
                    .orElseThrow(() -> new EntityNotFoundException("Group not found: " + normalizedGroupId));
            groups.add(group);
        }
        return groups;
    }

    private void validateUser(AppUserSaveDTO dto, boolean requireId) {
        if (dto == null) {
            throw new IllegalArgumentException("User payload is required");
        }
        if (requireId) {
            validateIdentifier(dto.id, "userId");
        }
        if (dto.displayName == null || dto.displayName.isBlank()) {
            throw new IllegalArgumentException("User displayName is required");
        }
    }

    private void validateGroup(UserGroupSaveDTO dto, boolean requireId) {
        if (dto == null) {
            throw new IllegalArgumentException("Group payload is required");
        }
        if (requireId) {
            validateIdentifier(dto.id, "groupId");
        }
        if (dto.name == null || dto.name.isBlank()) {
            throw new IllegalArgumentException("Group name is required");
        }
    }

    private void validateIdentifier(String value, @NonNull String fieldName) {
        normalizeIdentifier(value, fieldName);
    }

    @NonNull
    private String normalizeIdentifier(String value, @NonNull String fieldName) {
        String normalized = requireText(value, fieldName + " is required");
        if (!ID_PATTERN.matcher(normalized).matches()) {
            throw new IllegalArgumentException(fieldName + " can only contain letters, numbers, dot, dash and underscore");
        }
        return normalized;
    }

    @NonNull
    private String requireText(String value, @NonNull String message) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException(message);
        }
        return Objects.requireNonNull(value.trim());
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private AppUserDTO toUserDTO(AppUser user) {
        AppUserDTO dto = new AppUserDTO();
        dto.id = user.getId();
        dto.displayName = user.getDisplayName();
        dto.email = user.getEmail();
        dto.active = user.getActive();
        dto.groupIds = user.getGroups().stream()
                .map(UserGroup::getId)
                .sorted()
                .collect(Collectors.toList());
        dto.createdAt = user.getCreatedAt();
        dto.updatedAt = user.getUpdatedAt();
        return dto;
    }

    private UserGroupDTO toGroupDTO(UserGroup group) {
        UserGroupDTO dto = new UserGroupDTO();
        dto.id = group.getId();
        dto.name = group.getName();
        dto.description = group.getDescription();
        dto.active = group.getActive();
        dto.createdAt = group.getCreatedAt();
        dto.updatedAt = group.getUpdatedAt();
        return dto;
    }
}
