'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Play } from 'lucide-react';
import { processApi, runtimeProcessApi } from '@/lib/api';
import type { ProcessDefinition } from '@/lib/types';

const getApiErrorMessage = (err: any, fallback: string) =>
  err.response?.data?.message || err.message || fallback;

export default function StartProcessPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const processDefinitionId = Number(params.id);
  const [processDefinition, setProcessDefinition] = useState<ProcessDefinition | null>(null);
  const [businessKey, setBusinessKey] = useState('');
  const [variablesJson, setVariablesJson] = useState('{\n  \n}');
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProcessDefinition = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await processApi.getProcessDefinition(processDefinitionId);
        setProcessDefinition(response.data);
      } catch (err: any) {
        setError(getApiErrorMessage(err, 'Error loading workflow'));
      } finally {
        setLoading(false);
      }
    };

    if (processDefinitionId) {
      fetchProcessDefinition();
    }
  }, [processDefinitionId]);

  const handleStart = async (event: React.FormEvent) => {
    event.preventDefault();
    setStarting(true);
    setError(null);

    try {
      const variables = variablesJson.trim() ? JSON.parse(variablesJson) : {};
      const response = await runtimeProcessApi.startProcess(processDefinitionId, {
        businessKey: businessKey.trim() || undefined,
        variables,
      });
      router.push(`/instances/${response.data.id}`);
    } catch (err: any) {
      if (err instanceof SyntaxError) {
        setError('Variables must be valid JSON.');
      } else {
        setError(getApiErrorMessage(err, 'Error starting process'));
      }
    } finally {
      setStarting(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading workflow...</div>;
  }

  if (error && !processDefinition) {
    return <div className="text-red-600 text-center py-12">Error: {error}</div>;
  }

  if (!processDefinition) {
    return <div className="text-center py-12">Workflow not found</div>;
  }

  const isPublished = processDefinition.status === 'PUBLISHED';

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/workflows"
          className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700"
        >
          <ArrowLeft size={16} />
          Back to workflows
        </Link>
      </div>

      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-slate-900">Start Process</h1>
          <p className="mt-1 text-slate-600">{processDefinition.name}</p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            isPublished
              ? 'bg-green-100 text-green-800'
              : 'bg-yellow-100 text-yellow-800'
          }`}
        >
          {processDefinition.status}
        </span>
      </div>

      {!isPublished && (
        <div className="mb-6 rounded border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          This workflow must be published before it can be started.
        </div>
      )}

      {error && (
        <div className="mb-6 rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleStart} className="bg-white rounded-lg shadow p-6">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-4">
            <label className="block text-sm font-semibold text-slate-700">
              Business key
              <input
                value={businessKey}
                onChange={(event) => setBusinessKey(event.target.value)}
                placeholder="REQ-2026-0001"
                className="mt-1 w-full rounded border border-slate-300 px-3 py-2 font-normal"
                disabled={!isPublished || starting}
              />
            </label>

            <label className="block text-sm font-semibold text-slate-700">
              Variables JSON
              <textarea
                value={variablesJson}
                onChange={(event) => setVariablesJson(event.target.value)}
                rows={12}
                className="mt-1 w-full rounded border border-slate-300 px-3 py-2 font-mono text-sm font-normal"
                disabled={!isPublished || starting}
              />
            </label>
          </div>

          <aside className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <h2 className="font-bold text-slate-900">Definition</h2>
            <div className="mt-4 space-y-3 text-sm">
              <div>
                <p className="text-xs font-semibold uppercase text-slate-500">Version</p>
                <p className="text-slate-900">v{processDefinition.version}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-slate-500">Flowable key</p>
                <p className="break-all text-slate-900">
                  {processDefinition.flowableProcessDefinitionKey || 'Not deployed'}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-slate-500">Published</p>
                <p className="text-slate-900">
                  {processDefinition.publishedAt
                    ? new Date(processDefinition.publishedAt).toLocaleString()
                    : 'Not published'}
                </p>
              </div>
            </div>
          </aside>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="submit"
            disabled={!isPublished || starting}
            className="inline-flex items-center gap-2 rounded bg-green-600 px-5 py-2 font-semibold text-white hover:bg-green-700 disabled:opacity-60"
          >
            <Play size={18} />
            {starting ? 'Starting...' : 'Start process'}
          </button>
        </div>
      </form>
    </div>
  );
}
