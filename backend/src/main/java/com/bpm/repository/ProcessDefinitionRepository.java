package com.bpm.repository;

import com.bpm.entity.ProcessDefinition;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProcessDefinitionRepository extends JpaRepository<ProcessDefinition, Long> {
    Optional<ProcessDefinition> findByNameAndVersion(String name, Integer version);
    List<ProcessDefinition> findByStatus(ProcessDefinition.ProcessStatus status);
}
