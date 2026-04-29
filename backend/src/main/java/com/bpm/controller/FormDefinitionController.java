package com.bpm.controller;

import com.bpm.dto.FormDefinitionCreateDTO;
import com.bpm.dto.FormDefinitionDTO;
import com.bpm.service.FormDefinitionService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/forms")
public class FormDefinitionController {

    private final FormDefinitionService formDefinitionService;

    public FormDefinitionController(FormDefinitionService formDefinitionService) {
        this.formDefinitionService = formDefinitionService;
    }

    @GetMapping
    public ResponseEntity<List<FormDefinitionDTO>> getAllForms() {
        return ResponseEntity.ok(formDefinitionService.listFormDefinitions());
    }

    @GetMapping("/{id}")
    public ResponseEntity<FormDefinitionDTO> getFormById(@PathVariable Long id) {
        return ResponseEntity.ok(formDefinitionService.getFormDefinition(id));
    }

    @PostMapping
    public ResponseEntity<FormDefinitionDTO> createForm(@RequestBody FormDefinitionCreateDTO dto) {
        FormDefinitionDTO saved = formDefinitionService.createFormDefinition(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<FormDefinitionDTO> updateForm(@PathVariable Long id,
                                                        @RequestBody FormDefinitionCreateDTO dto) {
        return ResponseEntity.ok(formDefinitionService.updateFormDefinition(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteForm(@PathVariable Long id) {
        formDefinitionService.deleteFormDefinition(id);
        return ResponseEntity.noContent().build();
    }
}
