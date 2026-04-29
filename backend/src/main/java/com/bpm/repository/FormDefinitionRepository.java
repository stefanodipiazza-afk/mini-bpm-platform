package com.bpm.repository;

import com.bpm.entity.FormDefinition;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FormDefinitionRepository extends JpaRepository<FormDefinition, Long> {
    List<FormDefinition> findByOrderByCreatedAtDesc();
    Optional<FormDefinition> findFirstByNameOrderByVersionDesc(String name);
}
