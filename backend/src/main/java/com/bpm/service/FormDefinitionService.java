package com.bpm.service;

import com.bpm.dto.FormDefinitionCreateDTO;
import com.bpm.dto.FormDefinitionDTO;
import com.bpm.entity.FormDefinition;
import com.bpm.repository.FormDefinitionRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Set;
import java.util.List;
import java.util.stream.Collectors;

@Service
@SuppressWarnings("all")
public class FormDefinitionService {
    private static final Set<String> SUPPORTED_FIELD_TYPES = Set.of(
            "text", "textarea", "number", "date", "select", "checkbox"
    );

    private final FormDefinitionRepository formDefinitionRepository;
    private final ObjectMapper objectMapper;

    public FormDefinitionService(FormDefinitionRepository formDefinitionRepository, ObjectMapper objectMapper) {
        this.formDefinitionRepository = formDefinitionRepository;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public FormDefinitionDTO createFormDefinition(FormDefinitionCreateDTO dto) {
        validateFormDefinition(dto);

        FormDefinition form = new FormDefinition(dto.name, dto.schema);
        form.setDescription(dto.description);
        FormDefinition saved = formDefinitionRepository.save(form);
        return toDTO(saved);
    }

    public FormDefinitionDTO getFormDefinition(Long id) {
        if (id == null) {
            throw new IllegalArgumentException("formDefinitionId is required");
        }

        FormDefinition form = formDefinitionRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Form definition not found: " + id));
        return toDTO(form);
    }

    public List<FormDefinitionDTO> listFormDefinitions() {
        return formDefinitionRepository.findByOrderByCreatedAtDesc().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public FormDefinitionDTO updateFormDefinition(Long id, FormDefinitionCreateDTO dto) {
        if (id == null) {
            throw new IllegalArgumentException("formDefinitionId is required");
        }
        validateFormDefinition(dto);

        FormDefinition form = formDefinitionRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Form definition not found: " + id));

        form.setName(dto.name);
        form.setSchema(dto.schema);
        form.setDescription(dto.description);
        form.setUpdatedAt(LocalDateTime.now());

        FormDefinition saved = formDefinitionRepository.save(form);
        return toDTO(saved);
    }

    @Transactional
    public void deleteFormDefinition(Long id) {
        if (id == null) {
            throw new IllegalArgumentException("formDefinitionId is required");
        }
        if (!formDefinitionRepository.existsById(id)) {
            throw new EntityNotFoundException("Form definition not found: " + id);
        }

        formDefinitionRepository.deleteById(id);
    }

    private void validateFormDefinition(FormDefinitionCreateDTO dto) {
        if (dto == null) {
            throw new IllegalArgumentException("Form definition payload is required");
        }
        if (dto.name == null || dto.name.isBlank()) {
            throw new IllegalArgumentException("Form name is required");
        }
        if (dto.schema == null || dto.schema.isBlank()) {
            throw new IllegalArgumentException("Form schema is required");
        }

        JsonNode root;
        try {
            root = objectMapper.readTree(dto.schema);
        } catch (Exception e) {
            throw new IllegalArgumentException("Form schema must be valid JSON", e);
        }

        if (!root.isObject()) {
            throw new IllegalArgumentException("Form schema must be a JSON object");
        }

        JsonNode fields = root.get("fields");
        if (fields == null || !fields.isArray()) {
            throw new IllegalArgumentException("Form schema must contain a fields array");
        }

        for (JsonNode field : fields) {
            validateField(field);
        }
    }

    private void validateField(JsonNode field) {
        if (!field.isObject()) {
            throw new IllegalArgumentException("Each form field must be a JSON object");
        }

        String id = textValue(field, "id");
        if (id == null || id.isBlank()) {
            id = textValue(field, "name");
        }
        String type = textValue(field, "type");
        String label = textValue(field, "label");

        if (id == null || id.isBlank()) {
            throw new IllegalArgumentException("Each form field must define id or name");
        }
        if (label == null || label.isBlank()) {
            throw new IllegalArgumentException("Field '" + id + "' must define label");
        }
        if (type == null || type.isBlank()) {
            throw new IllegalArgumentException("Field '" + id + "' must define type");
        }
        if (!SUPPORTED_FIELD_TYPES.contains(type)) {
            throw new IllegalArgumentException("Unsupported field type '" + type + "' for field '" + id + "'");
        }
        if ("select".equals(type)) {
            validateSelectOptions(id, field.get("options"));
        }
    }

    private void validateSelectOptions(String fieldId, JsonNode options) {
        if (options == null || !options.isArray() || options.isEmpty()) {
            throw new IllegalArgumentException("Select field '" + fieldId + "' must define a non-empty options array");
        }

        for (JsonNode option : options) {
            if (!option.isObject()) {
                throw new IllegalArgumentException("Each option for select field '" + fieldId + "' must be an object");
            }
            String label = textValue(option, "label");
            JsonNode value = option.get("value");
            if (label == null || label.isBlank()) {
                throw new IllegalArgumentException("Each option for select field '" + fieldId + "' must define label");
            }
            if (value == null || value.isNull()) {
                throw new IllegalArgumentException("Each option for select field '" + fieldId + "' must define value");
            }
        }
    }

    private String textValue(JsonNode node, String fieldName) {
        JsonNode value = node.get(fieldName);
        return value != null && value.isTextual() ? value.asText() : null;
    }

    private FormDefinitionDTO toDTO(FormDefinition form) {
        FormDefinitionDTO dto = new FormDefinitionDTO();
        dto.id = form.getId() != null ? form.getId() : 0L;
        dto.name = form.getName();
        dto.version = form.getVersion();
        dto.schema = form.getSchema();
        dto.description = form.getDescription();
        dto.createdAt = form.getCreatedAt();
        dto.updatedAt = form.getUpdatedAt();
        return dto;
    }
}
