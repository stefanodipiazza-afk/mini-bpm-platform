package com.bpm.repository;

import com.bpm.entity.RuleDefinition;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RuleDefinitionRepository extends JpaRepository<RuleDefinition, Long> {
    Optional<RuleDefinition> findByNameAndVersion(String name, Integer version);
}
