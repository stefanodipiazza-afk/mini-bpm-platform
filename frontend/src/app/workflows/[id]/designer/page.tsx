'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { adminIdentityApi, processApi } from '@/lib/api';
import { AppUser, ProcessDefinition, UserGroup } from '@/lib/types';
import ReactFlow, { Background, Connection, Controls, Edge, Node } from 'reactflow';
import 'reactflow/dist/style.css';

type WorkflowGraphView = {
  nodes: Node[];
  edges: Edge[];
  issues: string[];
};

type PaletteNodeType = 'startEvent' | 'userTask' | 'exclusiveGateway' | 'endEvent';

const nodePalette: { type: PaletteNodeType; label: string }[] = [
  { type: 'startEvent', label: 'Start Event' },
  { type: 'userTask', label: 'User Task' },
  { type: 'exclusiveGateway', label: 'Exclusive Gateway' },
  { type: 'endEvent', label: 'End Event' },
];

const defaultNodeLabels: Record<PaletteNodeType, string> = {
  startEvent: 'Start',
  userTask: 'User Task',
  exclusiveGateway: 'Exclusive Gateway',
  endEvent: 'End',
};

const nodeTypeOptions: { value: PaletteNodeType; label: string }[] = nodePalette.map((item) => ({
  value: item.type,
  label: item.label,
}));

const createNodeId = (type: PaletteNodeType, existingIds: Set<string>) => {
  let index = 1;
  let id = `${type}_${index}`;

  while (existingIds.has(id)) {
    index += 1;
    id = `${type}_${index}`;
  }

  return id;
};

const createEdgeId = (source: string, target: string, existingIds: Set<string>) => {
  let index = 1;
  let id = `edge_${source}_${target}`;

  while (existingIds.has(id)) {
    index += 1;
    id = `edge_${source}_${target}_${index}`;
  }

  return id;
};

const createFormSnapshot = (data: {
  name: string;
  description: string;
  definition: string;
}) => JSON.stringify(data);

const getApiErrorMessage = (err: any, fallback: string) =>
  err.response?.data?.message || err.message || fallback;

const isStartNodeType = (type: unknown) =>
  typeof type === 'string' && ['start', 'startevent'].includes(type.toLowerCase());

const isEndNodeType = (type: unknown) =>
  typeof type === 'string' && ['end', 'endevent'].includes(type.toLowerCase());

const isUserTaskNodeType = (type: unknown) =>
  typeof type === 'string' && ['usertask', 'user_task'].includes(type.toLowerCase());

const validateWorkflowBeforeSave = (definition: any) => {
  const errors: string[] = [];
  const nodes = Array.isArray(definition?.nodes) ? definition.nodes : [];
  const edges = Array.isArray(definition?.edges) ? definition.edges : [];
  const nodeIds = new Set<string>();
  const connectedNodeIds = new Set<string>();
  const edgeKeys = new Set<string>();
  const duplicateEdges = new Set<string>();

  nodes.forEach((node: any) => {
    if (node?.id != null && String(node.id).trim()) {
      nodeIds.add(String(node.id).trim());
    }
  });

  const startCount = nodes.filter((node: any) => isStartNodeType(node?.type)).length;
  const endCount = nodes.filter((node: any) => isEndNodeType(node?.type)).length;

  if (startCount !== 1) {
    errors.push('Workflow must have exactly one start node.');
  }

  if (endCount < 1) {
    errors.push('Workflow must have at least one end node.');
  }

  edges.forEach((edge: any) => {
    const source = edge?.source != null ? String(edge.source).trim() : '';
    const target = edge?.target != null ? String(edge.target).trim() : '';

    if (!source || !target) {
      return;
    }

    connectedNodeIds.add(source);
    connectedNodeIds.add(target);

    const edgeKey = `${source}->${target}`;
    if (edgeKeys.has(edgeKey)) {
      duplicateEdges.add(edgeKey);
    }
    edgeKeys.add(edgeKey);
  });

  const orphanNodeIds = nodes
    .map((node: any) => (node?.id != null ? String(node.id).trim() : ''))
    .filter((id: string) => id && nodeIds.has(id) && !connectedNodeIds.has(id));

  if (orphanNodeIds.length > 0) {
    errors.push(`Workflow has orphan nodes: ${orphanNodeIds.join(', ')}.`);
  }

  if (duplicateEdges.size > 0) {
    errors.push(`Workflow has duplicate edges: ${Array.from(duplicateEdges).join(', ')}.`);
  }

  return errors;
};

const parseWorkflowDefinition = (definition?: string) => {
  if (!definition) {
    return { parsed: null, formatted: null };
  }

  try {
    const parsed = JSON.parse(definition);
    return {
      parsed,
      formatted: JSON.stringify(parsed, null, 2),
    };
  } catch {
    return {
      parsed: null,
      formatted: definition,
    };
  }
};

const buildWorkflowGraph = (parsedDefinition: any, definition?: string): WorkflowGraphView => {
  if (!definition) {
    return {
      nodes: [],
      edges: [],
      issues: ['No workflow definition available for this process.'],
    };
  }

  if (!parsedDefinition) {
    return {
      nodes: [],
      edges: [],
      issues: ['Workflow definition is not valid JSON.'],
    };
  }

  const rawNodes = Array.isArray(parsedDefinition?.nodes) ? parsedDefinition.nodes : [];
  const rawEdges = Array.isArray(parsedDefinition?.edges) ? parsedDefinition.edges : [];
  const issues: string[] = [];

  if (!Array.isArray(parsedDefinition?.nodes)) {
    issues.push('Workflow JSON does not include a valid nodes array.');
  }

  if (!Array.isArray(parsedDefinition?.edges)) {
    issues.push('Workflow JSON does not include a valid edges array.');
  }

  const nodes: Node[] = rawNodes.map((node: any, index: number) => {
    const id = String(node?.id ?? `node-${index + 1}`);
    const positionX =
      typeof node?.position?.x === 'number' ? node.position.x : 80 + (index % 3) * 220;
    const positionY =
      typeof node?.position?.y === 'number' ? node.position.y : 80 + Math.floor(index / 3) * 140;

    if (node?.id == null) {
      issues.push(`Node ${index + 1} is missing an id; generated ${id}.`);
    }

    return {
      id,
      type: undefined,
      position: { x: positionX, y: positionY },
      data: {
        ...(node?.data ?? {}),
        workflowType: typeof node?.type === 'string' ? node.type : undefined,
        label:
          node?.data?.label ??
          node?.label ??
          node?.name ??
          `Node ${index + 1}`,
      },
    };
  });

  const validNodeIds = new Set(nodes.map((node) => node.id));
  const edges: Edge[] = rawEdges.flatMap((edge: any, index: number) => {
    const source = edge?.source != null ? String(edge.source) : '';
    const target = edge?.target != null ? String(edge.target) : '';

    if (!source || !target) {
      issues.push(`Edge ${index + 1} is missing source or target and was skipped.`);
      return [];
    }

    if (!validNodeIds.has(source) || !validNodeIds.has(target)) {
      issues.push(`Edge ${index + 1} references unknown nodes and was skipped.`);
      return [];
    }

    return [{
      id: String(edge?.id ?? `edge-${source}-${target}-${index + 1}`),
      source,
      target,
      label:
        typeof edge?.condition === 'string'
          ? edge.condition
          : typeof edge?.label === 'string'
          ? edge.label
          : undefined,
      type: typeof edge?.type === 'string' ? edge.type : undefined,
    }];
  });

  return { nodes, edges, issues };
};

export default function WorkflowDesignerPage() {
  const params = useParams<{ id: string }>();
  const workflowId = params.id;
  const [process, setProcess] = useState<ProcessDefinition | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    definition: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [lastSavedSnapshot, setLastSavedSnapshot] = useState<string>('');
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [groups, setGroups] = useState<UserGroup[]>([]);

  const workflowDefinition = parseWorkflowDefinition(formData.definition);
  const workflowGraph = buildWorkflowGraph(
    workflowDefinition.parsed,
    formData.definition
  );
  const canRenderGraph = workflowGraph.nodes.length > 0;
  const canEditWorkflow = process?.status === 'DRAFT';
  const isDeployed = Boolean(process?.flowableDeploymentId);
  const currentSnapshot = createFormSnapshot(formData);
  const isDirty = currentSnapshot !== lastSavedSnapshot;
  const saveStatus = saving
    ? 'Saving...'
    : saveError
    ? 'Save failed'
    : isDirty
    ? 'Unsaved changes'
    : lastSavedAt
    ? `Saved ${lastSavedAt}`
    : 'Saved';
  const selectedWorkflowNode = Array.isArray(workflowDefinition.parsed?.nodes)
    ? workflowDefinition.parsed.nodes.find((node: any) => String(node?.id) === selectedNodeId)
    : null;
  const selectedWorkflowEdge = Array.isArray(workflowDefinition.parsed?.edges)
    ? workflowDefinition.parsed.edges.find((edge: any, index: number) => {
        const edgeId = edge?.id != null
          ? String(edge.id)
          : `edge-${String(edge?.source)}-${String(edge?.target)}-${index + 1}`;
        return edgeId === selectedEdgeId;
      })
    : null;
  const selectedNodeType = selectedWorkflowNode?.type != null ? String(selectedWorkflowNode.type) : '';
  const selectedNodeTypeOptions = selectedNodeType && !nodeTypeOptions.some((option) => option.value === selectedNodeType)
    ? [{ value: selectedNodeType, label: selectedNodeType }, ...nodeTypeOptions]
    : nodeTypeOptions;

  useEffect(() => {
    const fetchProcess = async () => {
      const processId = Number(workflowId);

      if (!Number.isFinite(processId)) {
        setError('Invalid workflow id.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await processApi.getProcessDefinition(processId);
        setProcess(response.data);
        setFormData({
          name: response.data.name,
          description: response.data.description || '',
          definition: response.data.definition || '',
        });
        setLastSavedSnapshot(createFormSnapshot({
          name: response.data.name,
          description: response.data.description || '',
          definition: response.data.definition || '',
        }));
        setLastSavedAt(null);
      } catch (err: any) {
        setError(getApiErrorMessage(err, 'Error fetching workflow'));
      } finally {
        setLoading(false);
      }
    };

    fetchProcess();
  }, [workflowId]);

  useEffect(() => {
    const fetchIdentities = async () => {
      try {
        const [usersResponse, groupsResponse] = await Promise.all([
          adminIdentityApi.listUsers(),
          adminIdentityApi.listGroups(),
        ]);
        setUsers(usersResponse.data.filter((user) => user.active));
        setGroups(groupsResponse.data.filter((group) => group.active));
      } catch {
        setUsers([]);
        setGroups([]);
      }
    };

    fetchIdentities();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!process) {
      return;
    }

    setSaving(true);
    setSaveError(null);

    try {
      let parsedDefinition;

      try {
        parsedDefinition = JSON.parse(formData.definition);
        parsedDefinition = {
          ...parsedDefinition,
          name: String(parsedDefinition.name || formData.name).trim(),
        };
      } catch {
        setSaveError('Workflow JSON is not valid.');
        return;
      }

      const validationErrors = validateWorkflowBeforeSave(parsedDefinition);
      if (validationErrors.length > 0) {
        setSaveError(validationErrors.join(' '));
        return;
      }

      const definition = JSON.stringify(parsedDefinition);
      const response = await processApi.updateProcessDefinition(process.id, {
        ...formData,
        definition,
      });
      const savedFormData = {
        name: response.data.name,
        description: response.data.description || '',
        definition: response.data.definition || '',
      };

      setProcess(response.data);
      setFormData(savedFormData);
      setLastSavedSnapshot(createFormSnapshot(savedFormData));
      setLastSavedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    } catch (err: any) {
      setSaveError(getApiErrorMessage(err, 'Error saving workflow'));
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!process || isDirty) {
      return;
    }

    setPublishing(true);
    setPublishError(null);

    try {
      const response = await processApi.publishProcessDefinition(process.id);
      const publishedFormData = {
        name: response.data.name,
        description: response.data.description || '',
        definition: response.data.definition || '',
      };

      setProcess(response.data);
      setFormData(publishedFormData);
      setLastSavedSnapshot(createFormSnapshot(publishedFormData));
      setLastSavedAt(null);
    } catch (err: any) {
      setPublishError(getApiErrorMessage(err, 'Error publishing workflow'));
    } finally {
      setPublishing(false);
    }
  };

  const handleAddNode = (type: PaletteNodeType) => {
    setSaveError(null);

    try {
      const definition = JSON.parse(formData.definition || '{}');
      const nodes = Array.isArray(definition.nodes) ? definition.nodes : [];
      const existingIds = new Set<string>(
        nodes
          .map((node: any) => (node?.id != null ? String(node.id) : ''))
          .filter(Boolean)
      );
      const id = createNodeId(type, existingIds);
      const nextIndex = nodes.length;
      const nextNode = {
        id,
        type,
        label: defaultNodeLabels[type],
        position: {
          x: 80 + (nextIndex % 4) * 180,
          y: 80 + Math.floor(nextIndex / 4) * 120,
        },
      };

      const nextDefinition = {
        ...definition,
        name: String(definition.name || formData.name).trim(),
        nodes: [...nodes, nextNode],
        edges: Array.isArray(definition.edges) ? definition.edges : [],
      };

      setFormData({
        ...formData,
        definition: JSON.stringify(nextDefinition, null, 2),
      });
    } catch {
      setSaveError('Workflow JSON is not valid. Fix it before adding nodes from the palette.');
    }
  };

  const updateWorkflowDefinition = (updater: (definition: any) => any) => {
    try {
      const currentDefinition = JSON.parse(formData.definition || '{}');
      const nextDefinition = updater({
        ...currentDefinition,
        name: String(currentDefinition.name || formData.name).trim(),
        nodes: Array.isArray(currentDefinition.nodes) ? currentDefinition.nodes : [],
        edges: Array.isArray(currentDefinition.edges) ? currentDefinition.edges : [],
      });

      setSaveError(null);
      setFormData({
        ...formData,
        definition: JSON.stringify(nextDefinition, null, 2),
      });
    } catch {
      setSaveError('Workflow JSON is not valid. Fix it before editing edges.');
    }
  };

  const handleConnect = (connection: Connection) => {
    if (!canEditWorkflow || !connection.source || !connection.target) {
      return;
    }

    updateWorkflowDefinition((definition) => {
      const existingEdge = definition.edges.some(
        (edge: any) => edge?.source === connection.source && edge?.target === connection.target
      );

      if (existingEdge) {
        return definition;
      }

      const existingIds = new Set<string>(
        definition.edges
          .map((edge: any) => (edge?.id != null ? String(edge.id) : ''))
          .filter(Boolean)
      );

      return {
        ...definition,
        edges: [
          ...definition.edges,
          {
            id: createEdgeId(connection.source!, connection.target!, existingIds),
            source: connection.source,
            target: connection.target,
          },
        ],
      };
    });
  };

  const handleEdgesDelete = (deletedEdges: Edge[]) => {
    if (!canEditWorkflow || deletedEdges.length === 0) {
      return;
    }

    const deletedIds = new Set(deletedEdges.map((edge) => edge.id));
    const deletedPairs = new Set(deletedEdges.map((edge) => `${edge.source}->${edge.target}`));

    updateWorkflowDefinition((definition) => ({
      ...definition,
      edges: definition.edges.filter((edge: any, index: number) => {
        const edgeId = edge?.id != null
          ? String(edge.id)
          : `edge-${String(edge?.source)}-${String(edge?.target)}-${index + 1}`;
        const edgePair = `${String(edge?.source)}->${String(edge?.target)}`;
        return !deletedIds.has(edgeId) && !deletedPairs.has(edgePair);
      }),
    }));
    setSelectedEdgeId(null);
  };

const handleUpdateSelectedNode = (changes: Record<string, string>) => {
    if (!selectedNodeId) {
      return;
    }

    updateWorkflowDefinition((definition) => ({
      ...definition,
      nodes: definition.nodes.map((node: any) =>
        String(node?.id) === selectedNodeId ? { ...node, ...changes } : node
      ),
    }));
  };

  const handleUpdateSelectedUserTaskFormKey = (formKey: string) => {
    if (!selectedNodeId) {
      return;
    }

    updateWorkflowDefinition((definition) => ({
      ...definition,
      nodes: definition.nodes.map((node: any) => {
        if (String(node?.id) !== selectedNodeId) {
          return node;
        }

        const nextNode = { ...node };
        if (formKey.trim()) {
          nextNode.formKey = formKey;
          delete nextNode.formId;
        } else {
          delete nextNode.formKey;
          delete nextNode.formId;
        }
        return nextNode;
      }),
    }));
  };

  const handleUpdateSelectedEdge = (changes: Record<string, string>) => {
    if (!selectedEdgeId) {
      return;
    }

    updateWorkflowDefinition((definition) => ({
      ...definition,
      edges: definition.edges.map((edge: any, index: number) => {
        const edgeId = edge?.id != null
          ? String(edge.id)
          : `edge-${String(edge?.source)}-${String(edge?.target)}-${index + 1}`;
        return edgeId === selectedEdgeId ? { ...edge, ...changes } : edge;
      }),
    }));
  };

  if (loading) {
    return <div className="text-center py-12">Loading workflow...</div>;
  }

  if (error) {
    return <div className="text-red-600 text-center py-12">Error: {error}</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Workflow Designer</h1>
      <div className="bg-white rounded-lg shadow p-6">
        <form onSubmit={handleSave} className="mb-6 space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">{process?.name}</h2>
              <p className="text-gray-600 mt-2">Process ID: {workflowId}</p>
              <p className="mt-2 text-sm text-gray-600">
                Deployment: {isDeployed ? `Deployed as ${process?.flowableProcessDefinitionKey}` : 'Not deployed'}
              </p>
              {process?.publishedAt && (
                <p className="mt-1 text-xs text-gray-500">
                  Published at {new Date(process.publishedAt).toLocaleString()}
                </p>
              )}
            </div>

            {canEditWorkflow && (
              <button
                type="button"
                onClick={handlePublish}
                disabled={publishing || isDirty}
                className="rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:opacity-60"
                title={isDirty ? 'Save changes before publishing' : 'Publish workflow'}
              >
                {publishing ? 'Publishing...' : 'Publish'}
              </button>
            )}
          </div>
          {publishError && <p className="text-sm text-red-600">{publishError}</p>}

          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            disabled={!canEditWorkflow}
            className="w-full border border-gray-300 rounded px-3 py-2 disabled:bg-gray-100"
            required
          />

          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            disabled={!canEditWorkflow}
            className="w-full border border-gray-300 rounded px-3 py-2 disabled:bg-gray-100"
            rows={3}
          />

          {canEditWorkflow && (
            <div>
              <button
                type="submit"
                disabled={saving || !isDirty}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-60"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
              <span className={`ml-3 text-sm ${saveError ? 'text-red-600' : isDirty ? 'text-amber-700' : 'text-green-700'}`}>
                {saveStatus}
              </span>
              {saveError && <p className="mt-2 text-sm text-red-600">{saveError}</p>}
            </div>
          )}
        </form>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700">
              Workflow Diagram
            </h3>
            <span className="text-xs text-gray-500">
              {canEditWorkflow ? 'Editable draft' : 'Read-only view'}
            </span>
          </div>

          {canEditWorkflow && (
            <div className="mb-3 flex flex-wrap gap-2">
              {nodePalette.map((item) => (
                <button
                  key={item.type}
                  type="button"
                  onClick={() => handleAddNode(item.type)}
                  className="rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                >
                  {item.label}
                </button>
              ))}
            </div>
          )}

          {canRenderGraph ? (
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
              <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
                <div className="h-[420px]">
                  <ReactFlow
                    nodes={workflowGraph.nodes}
                    edges={workflowGraph.edges}
                    fitView
                    nodesDraggable={false}
                    nodesConnectable={canEditWorkflow}
                    elementsSelectable={canEditWorkflow}
                    edgesFocusable={canEditWorkflow}
                    edgesUpdatable={canEditWorkflow}
                    zoomOnDoubleClick={false}
                    panOnDrag
                    onConnect={handleConnect}
                    onEdgesDelete={handleEdgesDelete}
                    onNodeClick={(_, node) => {
                      setSelectedNodeId(node.id);
                      setSelectedEdgeId(null);
                    }}
                    onEdgeClick={(_, edge) => {
                      setSelectedEdgeId(edge.id);
                      setSelectedNodeId(null);
                    }}
                    onPaneClick={() => {
                      setSelectedNodeId(null);
                      setSelectedEdgeId(null);
                    }}
                    deleteKeyCode={canEditWorkflow ? ['Backspace', 'Delete'] : null}
                    proOptions={{ hideAttribution: true }}
                  >
                    <Background color="#e2e8f0" gap={16} />
                    <Controls showInteractive={false} />
                  </ReactFlow>
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <h4 className="text-sm font-semibold text-slate-800">Properties</h4>

                {!selectedWorkflowNode && !selectedWorkflowEdge && (
                  <p className="mt-3 text-sm text-slate-500">Select a node or edge.</p>
                )}

                {selectedWorkflowNode && (
                  <div className="mt-3 space-y-3">
                    <label className="block text-sm text-slate-700">
                      Label
                      <input
                        type="text"
                        value={String(selectedWorkflowNode.label || '')}
                        onChange={(e) => handleUpdateSelectedNode({ label: e.target.value })}
                        disabled={!canEditWorkflow}
                        className="mt-1 w-full rounded border border-slate-300 px-3 py-2 disabled:bg-slate-100"
                      />
                    </label>

                    <label className="block text-sm text-slate-700">
                      Type
                      <select
                        value={String(selectedWorkflowNode.type || '')}
                        onChange={(e) => handleUpdateSelectedNode({ type: e.target.value })}
                        disabled={!canEditWorkflow}
                        className="mt-1 w-full rounded border border-slate-300 px-3 py-2 disabled:bg-slate-100"
                      >
                        {selectedNodeTypeOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>

                    {isUserTaskNodeType(selectedWorkflowNode.type) && (
                      <>
                        <label className="block text-sm text-slate-700">
                          Assignee
                          <select
                            value={String(selectedWorkflowNode.assignee || '')}
                            onChange={(e) => handleUpdateSelectedNode({ assignee: e.target.value })}
                            disabled={!canEditWorkflow}
                            className="mt-1 w-full rounded border border-slate-300 px-3 py-2 disabled:bg-slate-100"
                          >
                            <option value="">Unassigned</option>
                            {users.map((user) => (
                              <option key={user.id} value={user.id}>
                                {user.displayName} ({user.id})
                              </option>
                            ))}
                          </select>
                        </label>

                        <label className="block text-sm text-slate-700">
                          Candidate group
                          <select
                            value={String(selectedWorkflowNode.candidateGroup || '')}
                            onChange={(e) => handleUpdateSelectedNode({ candidateGroup: e.target.value })}
                            disabled={!canEditWorkflow}
                            className="mt-1 w-full rounded border border-slate-300 px-3 py-2 disabled:bg-slate-100"
                          >
                            <option value="">No candidate group</option>
                            {groups.map((group) => (
                              <option key={group.id} value={group.id}>
                                {group.name} ({group.id})
                              </option>
                            ))}
                          </select>
                        </label>

                        <label className="block text-sm text-slate-700">
                          Form key / ID
                          <input
                            type="text"
                            value={String(selectedWorkflowNode.formKey || selectedWorkflowNode.formId || '')}
                            onChange={(e) => handleUpdateSelectedUserTaskFormKey(e.target.value)}
                            disabled={!canEditWorkflow}
                            className="mt-1 w-full rounded border border-slate-300 px-3 py-2 disabled:bg-slate-100"
                          />
                        </label>
                      </>
                    )}
                  </div>
                )}

                {selectedWorkflowEdge && (
                  <div className="mt-3 space-y-3">
                    <label className="block text-sm text-slate-700">
                      Condition
                      <input
                        type="text"
                        value={String(selectedWorkflowEdge.condition || '')}
                        onChange={(e) => handleUpdateSelectedEdge({ condition: e.target.value })}
                        disabled={!canEditWorkflow}
                        className="mt-1 w-full rounded border border-slate-300 px-3 py-2 disabled:bg-slate-100"
                      />
                    </label>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-600">
              Unable to render a workflow graph from the current definition.
            </div>
          )}

          {workflowGraph.issues.length > 0 && (
            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              <p className="font-medium">Fallback details</p>
              <ul className="mt-2 list-disc pl-5">
                {workflowGraph.issues.map((issue) => (
                  <li key={issue}>{issue}</li>
                ))}
              </ul>
            </div>
          )}

          {workflowDefinition.formatted && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700">
                  Workflow JSON
                </h3>
                <span className="text-xs text-gray-500">Source payload</span>
              </div>
              {canEditWorkflow ? (
                <textarea
                  value={formData.definition}
                  onChange={(e) => setFormData({ ...formData, definition: e.target.value })}
                  className="w-full rounded-lg bg-slate-950 p-4 font-mono text-sm leading-6 text-slate-100"
                  rows={14}
                />
              ) : (
                <pre className="overflow-x-auto rounded-lg bg-slate-950 p-4 text-sm leading-6 text-slate-100">
                  <code>{workflowDefinition.formatted}</code>
                </pre>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
