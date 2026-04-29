package com.bpm.service.bpmn;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;

import java.util.HashSet;
import java.util.Set;

@Component
public class WorkflowBpmnConverter {

    private final ObjectMapper objectMapper;

    public WorkflowBpmnConverter(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public String convert(String workflowDefinitionJson) {
        try {
            if (workflowDefinitionJson == null || workflowDefinitionJson.isBlank()) {
                throw new IllegalArgumentException("Workflow definition JSON is required");
            }

            JsonNode workflow = objectMapper.readTree(workflowDefinitionJson);
            JsonNode nodes = workflow.path("nodes");
            JsonNode edges = workflow.path("edges");

            if (!nodes.isArray()) {
                throw new IllegalArgumentException("Workflow nodes must be an array");
            }

            if (!edges.isMissingNode() && !edges.isArray()) {
                throw new IllegalArgumentException("Workflow edges must be an array");
            }

            String processId = sanitizeId(requiredText(workflow, "name"));
            String processName = textOrDefault(workflow, "title", requiredText(workflow, "name"));

            StringBuilder xml = new StringBuilder();
            xml.append("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n");
            xml.append("<definitions xmlns=\"http://www.omg.org/spec/BPMN/20100524/MODEL\"\n");
            xml.append("    xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\"\n");
            xml.append("    xmlns:flowable=\"http://flowable.org/bpmn\"\n");
            xml.append("    targetNamespace=\"http://mini-bpm.com\">\n");
            xml.append("  <process id=\"").append(escapeXml(processId)).append("\" name=\"")
                    .append(escapeXml(processName)).append("\" isExecutable=\"true\">\n");

            for (JsonNode node : nodes) {
                appendNode(xml, node);
            }

            Set<String> edgeIds = new HashSet<>();
            int edgeIndex = 1;
            if (edges.isArray()) {
                for (JsonNode edge : edges) {
                    appendSequenceFlow(xml, edge, edgeIds, edgeIndex++);
                }
            }

            xml.append("  </process>\n");
            xml.append("</definitions>");
            return xml.toString();
        } catch (Exception e) {
            throw new IllegalArgumentException("Failed to convert workflow JSON to BPMN XML: " + e.getMessage(), e);
        }
    }

    private void appendNode(StringBuilder xml, JsonNode node) {
        String id = requiredText(node, "id");
        String type = requiredText(node, "type");
        String label = textOrDefault(node, "label", id);

        if (isStartEvent(type)) {
            xml.append("    <startEvent id=\"").append(escapeXml(id)).append("\" name=\"")
                    .append(escapeXml(label)).append("\"/>\n");
        } else if (isUserTask(type)) {
            xml.append("    <userTask id=\"").append(escapeXml(id)).append("\" name=\"")
                    .append(escapeXml(label)).append("\"");

            String assignee = textOrDefault(node, "assignee", "");
            if (!assignee.isBlank()) {
                xml.append(" flowable:assignee=\"").append(escapeXml(assignee)).append("\"");
            }

            String candidateGroup = textOrDefault(node, "candidateGroup", "");
            if (!candidateGroup.isBlank()) {
                xml.append(" flowable:candidateGroups=\"").append(escapeXml(candidateGroup)).append("\"");
            }

            String formKey = textOrNumberOrDefault(node, "formKey", textOrNumberOrDefault(node, "formId", ""));
            if (!formKey.isBlank()) {
                xml.append(" flowable:formKey=\"").append(escapeXml(formKey)).append("\"");
            }

            xml.append("/>\n");
        } else if (isExclusiveGateway(type)) {
            xml.append("    <exclusiveGateway id=\"").append(escapeXml(id)).append("\" name=\"")
                    .append(escapeXml(label)).append("\"/>\n");
        } else if (isEndEvent(type)) {
            xml.append("    <endEvent id=\"").append(escapeXml(id)).append("\" name=\"")
                    .append(escapeXml(label)).append("\"/>\n");
        } else {
            throw new IllegalArgumentException("Unsupported workflow node type: " + type);
        }
    }

    private void appendSequenceFlow(StringBuilder xml, JsonNode edge, Set<String> edgeIds, int edgeIndex) {
        String source = requiredText(edge, "source");
        String target = requiredText(edge, "target");
        String id = textOrDefault(edge, "id", "flow_" + source + "_" + target);
        id = uniqueId(sanitizeId(id), edgeIds, edgeIndex);
        String condition = textOrDefault(edge, "condition", "");

        if (condition.isBlank()) {
            xml.append("    <sequenceFlow id=\"").append(escapeXml(id)).append("\" sourceRef=\"")
                    .append(escapeXml(source)).append("\" targetRef=\"").append(escapeXml(target)).append("\"/>\n");
            return;
        }

        xml.append("    <sequenceFlow id=\"").append(escapeXml(id)).append("\" sourceRef=\"")
                .append(escapeXml(source)).append("\" targetRef=\"").append(escapeXml(target)).append("\">\n");
        xml.append("      <conditionExpression xsi:type=\"tFormalExpression\"><![CDATA[")
                .append(escapeCdata(condition)).append("]]></conditionExpression>\n");
        xml.append("    </sequenceFlow>\n");
    }

    private String requiredText(JsonNode node, String fieldName) {
        String value = textOrDefault(node, fieldName, "");
        if (value.isBlank()) {
            throw new IllegalArgumentException("Missing required field: " + fieldName);
        }
        return value;
    }

    private String textOrDefault(JsonNode node, String fieldName, String defaultValue) {
        JsonNode value = node.path(fieldName);
        if (!value.isTextual()) {
            return defaultValue;
        }
        return value.asText().trim();
    }

    private String textOrNumberOrDefault(JsonNode node, String fieldName, String defaultValue) {
        JsonNode value = node.path(fieldName);
        if (value.isTextual()) {
            return value.asText().trim();
        }
        if (value.isNumber()) {
            return value.asText();
        }
        return defaultValue;
    }

    private String uniqueId(String id, Set<String> usedIds, int fallbackIndex) {
        String uniqueId = id.isBlank() ? "flow_" + fallbackIndex : id;
        int index = 2;

        while (!usedIds.add(uniqueId)) {
            uniqueId = id + "_" + index++;
        }

        return uniqueId;
    }

    private String sanitizeId(String value) {
        String sanitized = value.trim().replaceAll("[^A-Za-z0-9_]", "_");
        if (sanitized.isBlank()) {
            return "workflow";
        }
        if (!Character.isLetter(sanitized.charAt(0)) && sanitized.charAt(0) != '_') {
            return "id_" + sanitized;
        }
        return sanitized;
    }

    private boolean isStartEvent(String type) {
        return "start".equalsIgnoreCase(type) || "startEvent".equalsIgnoreCase(type);
    }

    private boolean isUserTask(String type) {
        return "userTask".equalsIgnoreCase(type) || "user_task".equalsIgnoreCase(type);
    }

    private boolean isExclusiveGateway(String type) {
        return "exclusiveGateway".equalsIgnoreCase(type) || "gateway".equalsIgnoreCase(type);
    }

    private boolean isEndEvent(String type) {
        return "end".equalsIgnoreCase(type) || "endEvent".equalsIgnoreCase(type);
    }

    private String escapeXml(String value) {
        return value
                .replace("&", "&amp;")
                .replace("\"", "&quot;")
                .replace("'", "&apos;")
                .replace("<", "&lt;")
                .replace(">", "&gt;");
    }

    private String escapeCdata(String value) {
        return value.replace("]]>", "]]]]><![CDATA[>");
    }
}
