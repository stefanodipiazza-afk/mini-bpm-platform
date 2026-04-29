package com.bpm.service;

import com.bpm.entity.ProcessDefinition;
import com.bpm.service.bpmn.WorkflowBpmnConverter;
import org.flowable.engine.RepositoryService;
import org.flowable.engine.repository.Deployment;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class WorkflowPublishService {

    private final RepositoryService flowableRepositoryService;
    private final WorkflowBpmnConverter workflowBpmnConverter;

    public WorkflowPublishService(RepositoryService flowableRepositoryService,
                                  WorkflowBpmnConverter workflowBpmnConverter) {
        this.flowableRepositoryService = flowableRepositoryService;
        this.workflowBpmnConverter = workflowBpmnConverter;
    }

    public void publish(ProcessDefinition processDefinition) {
        try {
            if (processDefinition == null) {
                throw new WorkflowPublishException("Workflow definition is required for publish", null);
            }
            if (processDefinition.getDefinition() == null || processDefinition.getDefinition().isBlank()) {
                throw new WorkflowPublishException("Workflow definition JSON is required for publish", null);
            }
            if (processDefinition.getName() == null || processDefinition.getName().isBlank()) {
                throw new WorkflowPublishException("Workflow name is required for publish", null);
            }

            String bpmnXml = workflowBpmnConverter.convert(processDefinition.getDefinition());
            String resourceName = processDefinition.getName() + "_v" + processDefinition.getVersion() + ".bpmn20.xml";

            Deployment deployment = flowableRepositoryService.createDeployment()
                    .name(processDefinition.getName() + " v" + processDefinition.getVersion())
                    .addString(resourceName, bpmnXml)
                    .deploy();

            org.flowable.engine.repository.ProcessDefinition flowableDefinition =
                    flowableRepositoryService.createProcessDefinitionQuery()
                            .deploymentId(deployment.getId())
                            .singleResult();

            if (flowableDefinition == null) {
                throw new WorkflowPublishException("Flowable deployment did not create a process definition", null);
            }

            processDefinition.setBpmnXml(bpmnXml);
            processDefinition.setFlowableDeploymentId(deployment.getId());
            processDefinition.setFlowableProcessDefinitionId(flowableDefinition.getId());
            processDefinition.setFlowableProcessDefinitionKey(flowableDefinition.getKey());
            processDefinition.setFlowableProcessDefinitionVersion(flowableDefinition.getVersion());
            processDefinition.setPublishedAt(LocalDateTime.now());
            processDefinition.setStatus(ProcessDefinition.ProcessStatus.PUBLISHED);
        } catch (WorkflowPublishException e) {
            throw e;
        } catch (Exception e) {
            throw new WorkflowPublishException("Failed to publish workflow to Flowable: " + e.getMessage(), e);
        }
    }
}
