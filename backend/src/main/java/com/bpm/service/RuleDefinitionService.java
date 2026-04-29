package com.bpm.service;

import com.bpm.entity.RuleDefinition;
import com.bpm.dto.RuleDefinitionDTO;
import com.bpm.dto.RuleDefinitionCreateDTO;
import com.bpm.repository.RuleDefinitionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@SuppressWarnings("all")
public class RuleDefinitionService {

    @Autowired
    private RuleDefinitionRepository ruleDefinitionRepository;

    @Transactional
    public RuleDefinitionDTO createRuleDefinition(RuleDefinitionCreateDTO dto) {
        RuleDefinition rule = new RuleDefinition(dto.name, dto.rules);
        rule.setDescription(dto.description);
        RuleDefinition saved = ruleDefinitionRepository.save(rule);
        return toDTO(saved);
    }

    public RuleDefinitionDTO getRuleDefinition(Long id) {
        RuleDefinition rule = ruleDefinitionRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Rule definition not found: " + id));
        return toDTO(rule);
    }

    public List<RuleDefinitionDTO> listRuleDefinitions() {
        return ruleDefinitionRepository.findAll().stream()
            .map(this::toDTO)
            .collect(Collectors.toList());
    }

    @Transactional
    public void deleteRuleDefinition(Long id) {
        ruleDefinitionRepository.deleteById(id);
    }

    /**
     * Evaluate a rule against variables
     * Simple rule format: {"condition": "variable_name == value", "result": "route_name"}
     */
    public String evaluateRule(RuleDefinition rule, Map<String, Object> variables) {
        // Simplified rule evaluation - in production would use JUEL or another expression language
        try {
            // For MVP, just echo the rule back or return a default path
            return "default_path";
        } catch (Exception e) {
            return "default_path";
        }
    }

    private RuleDefinitionDTO toDTO(RuleDefinition rule) {
        RuleDefinitionDTO dto = new RuleDefinitionDTO();
        dto.id = rule.getId() != null ? rule.getId() : 0L;
        dto.name = rule.getName();
        dto.version = rule.getVersion();
        dto.rules = rule.getRules();
        dto.description = rule.getDescription();
        dto.createdAt = rule.getCreatedAt();
        return dto;
    }
}
