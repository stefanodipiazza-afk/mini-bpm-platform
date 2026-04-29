package com.bpm.repository;

import com.bpm.entity.ExecutionLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ExecutionLogRepository extends JpaRepository<ExecutionLog, Long> {
    List<ExecutionLog> findByProcessInstanceIdOrderByTimestampAsc(Long processInstanceId);
    List<ExecutionLog> findByTaskIdOrderByTimestampAsc(Long taskId);
}
