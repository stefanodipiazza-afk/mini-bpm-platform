package com.bpm.repository;

import com.bpm.entity.UserTask;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserTaskRepository extends JpaRepository<UserTask, Long> {
    List<UserTask> findByProcessInstanceId(Long processInstanceId);
    List<UserTask> findByStatus(UserTask.TaskStatus status);
    List<UserTask> findByAssignedTo(String assignedTo);
    Optional<UserTask> findByFlowableTaskId(String flowableTaskId);

    @Query("SELECT COUNT(t) FROM UserTask t WHERE t.status = 'PENDING'")
    Long countPending();
}
