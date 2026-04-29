package com.bpm.repository;

import com.bpm.entity.AppUser;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AppUserRepository extends JpaRepository<AppUser, String> {
    List<AppUser> findByOrderByIdAsc();
    List<AppUser> findByGroups_Id(String groupId);
}
