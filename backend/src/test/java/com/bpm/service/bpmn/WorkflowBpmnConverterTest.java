package com.bpm.service.bpmn;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class WorkflowBpmnConverterTest {

    private final WorkflowBpmnConverter converter = new WorkflowBpmnConverter(new ObjectMapper());

    @Test
    void convertsSimpleStartUserTaskEndWorkflow() {
        String bpmn = converter.convert("""
                {
                  "name": "simple_approval",
                  "nodes": [
                    {"id": "start", "type": "startEvent", "label": "Start"},
                    {"id": "review", "type": "userTask", "label": "Review"},
                    {"id": "end", "type": "endEvent", "label": "End"}
                  ],
                  "edges": [
                    {"source": "start", "target": "review"},
                    {"source": "review", "target": "end"}
                  ]
                }
                """);

        assertThat(bpmn).contains("<process id=\"simple_approval\" name=\"simple_approval\" isExecutable=\"true\">");
        assertThat(bpmn).contains("<startEvent id=\"start\" name=\"Start\"/>");
        assertThat(bpmn).contains("<userTask id=\"review\" name=\"Review\"/>");
        assertThat(bpmn).contains("<endEvent id=\"end\" name=\"End\"/>");
        assertThat(bpmn).contains("<sequenceFlow id=\"flow_start_review\" sourceRef=\"start\" targetRef=\"review\"/>");
        assertThat(bpmn).contains("<sequenceFlow id=\"flow_review_end\" sourceRef=\"review\" targetRef=\"end\"/>");
    }

    @Test
    void convertsSupportedWorkflowNodesAndEdges() {
        String bpmn = converter.convert("""
                {
                  "name": "purchase approval",
                  "nodes": [
                    {"id": "start", "type": "startEvent", "label": "Start"},
                    {"id": "review", "type": "userTask", "label": "Review", "assignee": "manager.user", "candidateGroup": "managers", "formKey": "approval_form"},
                    {"id": "decision", "type": "exclusiveGateway", "label": "Decision"},
                    {"id": "approved", "type": "endEvent", "label": "Approved"}
                  ],
                  "edges": [
                    {"source": "start", "target": "review"},
                    {"source": "review", "target": "decision"},
                    {"source": "decision", "target": "approved", "condition": "${approved == true}"}
                  ]
                }
                """);

        assertThat(bpmn).contains("<process id=\"purchase_approval\" name=\"purchase approval\" isExecutable=\"true\">");
        assertThat(bpmn).contains("<startEvent id=\"start\" name=\"Start\"/>");
        assertThat(bpmn).contains("<userTask id=\"review\" name=\"Review\" flowable:assignee=\"manager.user\" flowable:candidateGroups=\"managers\" flowable:formKey=\"approval_form\"/>");
        assertThat(bpmn).contains("<exclusiveGateway id=\"decision\" name=\"Decision\"/>");
        assertThat(bpmn).contains("<endEvent id=\"approved\" name=\"Approved\"/>");
        assertThat(bpmn).contains("<sequenceFlow id=\"flow_start_review\" sourceRef=\"start\" targetRef=\"review\"/>");
        assertThat(bpmn).contains("<conditionExpression xsi:type=\"tFormalExpression\"><![CDATA[${approved == true}]]></conditionExpression>");
    }

    @Test
    void rejectsUnsupportedNodeTypes() {
        assertThatThrownBy(() -> converter.convert("""
                {
                  "name": "unsupported",
                  "nodes": [
                    {"id": "start", "type": "startEvent"},
                    {"id": "service", "type": "serviceTask"},
                    {"id": "end", "type": "endEvent"}
                  ],
                  "edges": []
                }
                """))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Unsupported workflow node type");
    }
}
