package com.bpm.controller;

import com.bpm.dto.AppUserDTO;
import com.bpm.dto.AppUserSaveDTO;
import com.bpm.dto.UserGroupDTO;
import com.bpm.dto.UserGroupSaveDTO;
import com.bpm.service.IdentityAdminService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
public class IdentityAdminController {
    private final IdentityAdminService identityAdminService;

    public IdentityAdminController(IdentityAdminService identityAdminService) {
        this.identityAdminService = identityAdminService;
    }

    @GetMapping("/users")
    public ResponseEntity<List<AppUserDTO>> listUsers() {
        return ResponseEntity.ok(identityAdminService.listUsers());
    }

    @PostMapping("/users")
    public ResponseEntity<AppUserDTO> createUser(@RequestBody AppUserSaveDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(identityAdminService.createUser(dto));
    }

    @PutMapping("/users/{userId}")
    public ResponseEntity<AppUserDTO> updateUser(@PathVariable String userId,
                                                 @RequestBody AppUserSaveDTO dto) {
        return ResponseEntity.ok(identityAdminService.updateUser(userId, dto));
    }

    @DeleteMapping("/users/{userId}")
    public ResponseEntity<Void> deleteUser(@PathVariable String userId) {
        identityAdminService.deleteUser(userId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/groups")
    public ResponseEntity<List<UserGroupDTO>> listGroups() {
        return ResponseEntity.ok(identityAdminService.listGroups());
    }

    @PostMapping("/groups")
    public ResponseEntity<UserGroupDTO> createGroup(@RequestBody UserGroupSaveDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(identityAdminService.createGroup(dto));
    }

    @PutMapping("/groups/{groupId}")
    public ResponseEntity<UserGroupDTO> updateGroup(@PathVariable String groupId,
                                                    @RequestBody UserGroupSaveDTO dto) {
        return ResponseEntity.ok(identityAdminService.updateGroup(groupId, dto));
    }

    @DeleteMapping("/groups/{groupId}")
    public ResponseEntity<Void> deleteGroup(@PathVariable String groupId) {
        identityAdminService.deleteGroup(groupId);
        return ResponseEntity.noContent().build();
    }
}
