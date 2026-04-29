'use client';

import { useEffect, useState } from 'react';
import { useProcesses } from '@/hooks/useApi';
import { Plus, Trash2, Play, Eye, GitBranch, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { processApi } from '@/lib/api';
import { ProcessDefinition, WorkflowDeployment } from '@/lib/types';

const buildDefaultWorkflowDefinition = (name: string) =>
  JSON.stringify({
    name: name.trim(),
    nodes: [
      { id: 'start', type: 'StartEvent', label: 'Start' },
      { id: 'end', type: 'EndEvent', label: 'End' },
    ],
    edges: [{ source: 'start', target: 'end' }],
  });

const updateWorkflowDefinitionName = (definition: string, name: string) => {
  try {
    return JSON.stringify({ ...JSON.parse(definition), name: name.trim() }, null, 2);
  } catch {
    return buildDefaultWorkflowDefinition(name);
  }
};

const getApiErrorMessage = (err: any, fallback: string) =>
  err.response?.data?.message || err.message || fallback;

const getDeploymentLabel = (workflow: ProcessDefinition) => {
  if (workflow.flowableDeploymentId) {
    return `Deployed ${workflow.flowableProcessDefinitionKey || ''}`.trim();
  }

  if (workflow.status === 'PUBLISHED') {
    return 'Published, deployment metadata missing';
  }

  return 'Not deployed';
};

const formatDate = (value?: string | null) => {
  if (!value) return 'Not set';
  return new Date(value).toLocaleString();
};

function WorkflowDeploymentList({ workflowId }: { workflowId: number }) {
  const [deployments, setDeployments] = useState<WorkflowDeployment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDeployments = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await processApi.listDeploymentHistory(workflowId);
        setDeployments(response.data);
      } catch (err: any) {
        setError(getApiErrorMessage(err, 'Error loading deployment history'));
      } finally {
        setLoading(false);
      }
    };

    fetchDeployments();
  }, [workflowId]);

  return (
    <div className="mt-5 border-t border-slate-200 pt-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-800">
        <GitBranch size={16} className="text-blue-700" />
        Versioni / deployment
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Loader2 size={16} className="animate-spin" />
          Loading deployments...
        </div>
      )}

      {error && (
        <p className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {!loading && !error && deployments.length === 0 && (
        <p className="rounded border border-slate-200 bg-slate-50 p-3 text-sm text-slate-500">
          Nessun deployment Flowable trovato.
        </p>
      )}

      {!loading && !error && deployments.length > 0 && (
        <div className="overflow-hidden rounded border border-slate-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-3 py-2">Versione</th>
                <th className="px-3 py-2">Data deploy</th>
                <th className="px-3 py-2">Stato</th>
                <th className="px-3 py-2">Deployment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {deployments.map((deployment) => (
                <tr key={`${deployment.deploymentId}-${deployment.flowableProcessDefinitionId}`}>
                  <td className="px-3 py-3 font-semibold text-slate-900">
                    v{deployment.flowableProcessDefinitionVersion}
                  </td>
                  <td className="px-3 py-3 text-slate-700">
                    {formatDate(deployment.deployedAt)}
                  </td>
                  <td className="px-3 py-3">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        deployment.suspended
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-green-100 text-green-800'
                      }`}
                    >
                      {deployment.suspended ? 'SUSPENDED' : 'ACTIVE'}
                    </span>
                  </td>
                  <td className="max-w-[260px] break-all px-3 py-3 text-xs text-slate-600">
                    {deployment.deploymentName || deployment.deploymentId}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function WorkflowsPage() {
  const { processes, loading, error, refetch } = useProcesses();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [publishingId, setPublishingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    definition: buildDefaultWorkflowDefinition(''),
  });

  const handleCreateProcess = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    try {
      const parsedDefinition = JSON.parse(formData.definition);
      const definition = JSON.stringify({
        ...parsedDefinition,
        name: String(parsedDefinition.name || formData.name).trim(),
      });

      await processApi.createProcessDefinition({ ...formData, definition });
      setFormData({ name: '', description: '', definition: buildDefaultWorkflowDefinition('') });
      setShowCreateForm(false);
      refetch();
    } catch (err: any) {
      setActionError(getApiErrorMessage(err, 'Error creating workflow'));
    }
  };

  const handlePublish = async (id: number) => {
    setActionError(null);
    setPublishingId(id);
    try {
      await processApi.publishProcessDefinition(id);
      refetch();
    } catch (err: any) {
      setActionError(getApiErrorMessage(err, 'Error publishing workflow'));
    } finally {
      setPublishingId(null);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure?')) {
      try {
        await processApi.deleteProcessDefinition(id);
        refetch();
      } catch (err: any) {
        setActionError(getApiErrorMessage(err, 'Error deleting workflow'));
      }
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-bold">Workflows</h1>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <Plus size={20} /> New Workflow
        </button>
      </div>

      {showCreateForm && (
        <form
          onSubmit={handleCreateProcess}
          className="bg-white rounded-lg shadow p-6 mb-8"
        >
          <h2 className="text-xl font-bold mb-4">Create New Workflow</h2>
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Workflow Name"
              value={formData.name}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  name: e.target.value,
                  definition: updateWorkflowDefinitionName(formData.definition, e.target.value),
                })
              }
              className="w-full border border-gray-300 rounded px-3 py-2"
              required
            />
            <textarea
              placeholder="Description (optional)"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full border border-gray-300 rounded px-3 py-2"
              rows={3}
            />
            <textarea
              placeholder="JSON Definition"
              value={formData.definition}
              onChange={(e) =>
                setFormData({ ...formData, definition: e.target.value })
              }
              className="w-full border border-gray-300 rounded px-3 py-2 font-mono text-sm"
              rows={6}
            />
            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Create
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="bg-gray-300 text-gray-900 px-4 py-2 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      )}

      {loading && <div className="text-center py-12">Loading workflows...</div>}
      {error && <div className="text-red-600 text-center py-12">Error: {error}</div>}
      {actionError && <div className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{actionError}</div>}

      <div className="grid gap-6">
        {processes.map((process) => (
          <div
            key={process.id}
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-xl font-bold text-slate-900">
                  {process.name}
                </h3>
                <p className="text-gray-600 text-sm mt-1">{process.description}</p>
                <div className="mt-2 flex items-center gap-2">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      process.status === 'PUBLISHED'
                        ? 'bg-green-100 text-green-800'
                        : process.status === 'DRAFT'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {process.status}
                  </span>
                  <span className="text-gray-500 text-xs">v{process.version}</span>
                </div>
                <p className="mt-2 text-xs text-gray-500">{getDeploymentLabel(process)}</p>
                {process.publishedAt && (
                  <p className="mt-1 text-xs text-gray-400">
                    Published at {new Date(process.publishedAt).toLocaleString()}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <Link
                  href={`/workflows/${process.id}/designer`}
                  className="p-2 hover:bg-blue-50 rounded text-blue-600"
                  title="Edit"
                >
                  <Eye size={20} />
                </Link>
                {process.status === 'PUBLISHED' && (
                  <Link
                    href={`/workflows/${process.id}/start`}
                    className="p-2 hover:bg-green-50 rounded text-green-600"
                    title="Start"
                  >
                    <Play size={20} />
                  </Link>
                )}
                {process.status === 'DRAFT' && (
                  <button
                    onClick={() => handlePublish(process.id)}
                    disabled={publishingId === process.id}
                    className="p-2 hover:bg-green-50 rounded text-green-600 disabled:opacity-50"
                    title="Publish"
                  >
                    <Play size={20} />
                  </button>
                )}
                {process.status === 'DRAFT' && (
                  <button
                    onClick={() => handleDelete(process.id)}
                    className="p-2 hover:bg-red-50 rounded text-red-600"
                    title="Delete"
                  >
                    <Trash2 size={20} />
                  </button>
                )}
              </div>
            </div>
            <WorkflowDeploymentList
              key={`${process.id}-${process.status}-${process.flowableDeploymentId || 'none'}-${process.flowableProcessDefinitionVersion || 0}`}
              workflowId={process.id}
            />
          </div>
        ))}
      </div>

      {processes.length === 0 && !loading && (
        <div className="text-center py-12 text-gray-500">
          No workflows yet. Create one to get started.
        </div>
      )}
    </div>
  );
}
