package com.bpm.repository;

import com.bpm.entity.ProcessInstance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProcessInstanceRepository extends JpaRepository<ProcessInstance, Long> {
    List<ProcessInstance> findByProcessDefinitionId(Long processDefinitionId);
    List<ProcessInstance> findByStatus(ProcessInstance.InstanceStatus status);
    Optional<ProcessInstance> findByFlowableProcessInstanceId(String flowableProcessInstanceId);

    @Query("SELECT COUNT(p) FROM ProcessInstance p WHERE p.status = 'ACTIVE'")
    Long countActive();

    @Query("SELECT COUNT(p) FROM ProcessInstance p WHERE p.status = 'COMPLETED'")
    Long countCompleted();

    @Query("SELECT COUNT(p) FROM ProcessInstance p WHERE p.status = 'FAILED'")
    Long countFailed();
}
