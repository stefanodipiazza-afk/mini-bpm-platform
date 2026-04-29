'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Activity,
  AlertCircle,
  CheckCircle,
  Clock,
  ListChecks,
  RefreshCw,
  ScrollText,
} from 'lucide-react';
import { runtimeProcessApi } from '@/lib/api';
import type {
  RuntimeProcessInstance,
  RuntimeTask,
  RuntimeTaskHistory,
} from '@/lib/types';

const getApiErrorMessage = (err: any, fallback: string) =>
  err.response?.data?.message || err.message || fallback;

const formatDate = (value?: string | null) => {
  if (!value) return 'Not set';
  return new Date(value).toLocaleString();
};

const formatDuration = (durationMillis?: number | null) => {
  if (!durationMillis) return 'Not set';
  const totalSeconds = Math.round(durationMillis / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
};

const formatVariableValue = (value: any) => {
  if (value === null || value === undefined) return 'null';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
};

const statusClasses = (status: string) => {
  switch (status) {
    case 'ACTIVE':
      return 'bg-blue-100 text-blue-800';
    case 'COMPLETED':
      return 'bg-green-100 text-green-800';
    case 'FAILED':
      return 'bg-red-100 text-red-800';
    case 'SUSPENDED':
      return 'bg-amber-100 text-amber-800';
    default:
      return 'bg-slate-100 text-slate-700';
  }
};

const StatusIcon = ({ status }: { status: string }) => {
  if (status === 'COMPLETED') return <CheckCircle size={22} />;
  if (status === 'FAILED') return <AlertCircle size={22} />;
  if (status === 'ACTIVE') return <Activity size={22} />;
  return <Clock size={22} />;
};

const TaskRow = ({
  name,
  status,
  assignee,
  date,
  taskId,
}: {
  name?: string | null;
  status: string;
  assignee?: string | null;
  date?: string | null;
  taskId?: string | number | null;
}) => (
  <div className="rounded border border-slate-200 p-4">
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="font-semibold text-slate-900">{name || 'Unnamed task'}</p>
        <p className="mt-1 text-sm text-slate-600">
          Assignee: {assignee || 'Unassigned'}
        </p>
        <p className="mt-1 break-all text-xs text-slate-500">Task ID: {taskId || 'N/A'}</p>
      </div>
      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClasses(status)}`}>
        {status}
      </span>
    </div>
    <p className="mt-3 text-xs text-slate-500">Date: {formatDate(date)}</p>
  </div>
);

export default function InstanceDetailPage() {
  const params = useParams<{ id: string }>();
  const instanceId = Number(params.id);
  const [instance, setInstance] = useState<RuntimeProcessInstance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const variables = useMemo(
    () => Object.entries(instance?.variables || {}),
    [instance?.variables]
  );

  const currentTasks: RuntimeTask[] = instance?.activeTasks || [];
  const completedTasks: RuntimeTaskHistory[] = useMemo(
    () => (instance?.taskHistory || []).filter((task) => task.status === 'COMPLETED'),
    [instance?.taskHistory]
  );
  const auditEvents = instance?.history || [];

  const fetchInstance = async () => {
    if (!Number.isFinite(instanceId)) {
      setError('Invalid instance id');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await runtimeProcessApi.getProcessInstance(instanceId);
      setInstance(response.data);
    } catch (err: any) {
      setError(getApiErrorMessage(err, 'Error loading instance'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInstance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [instanceId]);

  if (loading) return <div className="py-12 text-center">Loading instance...</div>;
  if (error) return <div className="py-12 text-center text-red-600">Error: {error}</div>;
  if (!instance) return <div className="py-12 text-center">Instance not found.</div>;

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link href="/instances" className="text-sm font-semibold text-blue-700 hover:text-blue-900">
            Back to instances
          </Link>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">
            Process Instance #{instance.id}
          </h1>
          <p className="mt-1 break-all text-sm text-slate-600">
            Flowable ID: {instance.flowableProcessInstanceId}
          </p>
        </div>
        <button
          type="button"
          onClick={fetchInstance}
          className="inline-flex items-center gap-2 rounded bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700"
        >
          <RefreshCw size={18} />
          Refresh
        </button>
      </div>

      <section className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-lg bg-white p-5 shadow">
          <div className={`mb-3 inline-flex rounded-full p-2 ${statusClasses(instance.status)}`}>
            <StatusIcon status={instance.status} />
          </div>
          <p className="text-sm font-semibold uppercase text-slate-500">Stato</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{instance.status}</p>
        </div>
        <div className="rounded-lg bg-white p-5 shadow">
          <p className="text-sm font-semibold uppercase text-slate-500">Task correnti</p>
          <p className="mt-3 text-3xl font-bold text-slate-900">{currentTasks.length}</p>
          <p className="mt-1 text-sm text-slate-600">Task ancora attive nel runtime.</p>
        </div>
        <div className="rounded-lg bg-white p-5 shadow">
          <p className="text-sm font-semibold uppercase text-slate-500">Task completate</p>
          <p className="mt-3 text-3xl font-bold text-slate-900">{completedTasks.length}</p>
          <p className="mt-1 text-sm text-slate-600">Da Flowable history.</p>
        </div>
        <div className="rounded-lg bg-white p-5 shadow">
          <p className="text-sm font-semibold uppercase text-slate-500">Durata</p>
          <p className="mt-3 text-2xl font-bold text-slate-900">
            {formatDuration(instance.durationMillis)}
          </p>
          <p className="mt-1 text-sm text-slate-600">
            Started: {formatDate(instance.startedAt)}
          </p>
        </div>
      </section>

      <section className="mb-8 grid gap-4 md:grid-cols-3">
        <div className="rounded-lg bg-white p-5 shadow">
          <p className="text-sm font-semibold uppercase text-slate-500">Business Key</p>
          <p className="mt-2 break-all text-sm font-semibold text-slate-900">
            {instance.businessKey || 'Not set'}
          </p>
        </div>
        <div className="rounded-lg bg-white p-5 shadow">
          <p className="text-sm font-semibold uppercase text-slate-500">Started</p>
          <p className="mt-2 text-sm text-slate-900">{formatDate(instance.startedAt)}</p>
        </div>
        <div className="rounded-lg bg-white p-5 shadow">
          <p className="text-sm font-semibold uppercase text-slate-500">Ended</p>
          <p className="mt-2 text-sm text-slate-900">
            {formatDate(instance.endedAt || instance.completedAt)}
          </p>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="space-y-6">
          <section className="rounded-lg bg-white p-6 shadow">
            <div className="mb-4 flex items-center gap-2">
              <Activity size={20} className="text-blue-700" />
              <h2 className="text-xl font-bold text-slate-900">Task correnti</h2>
            </div>
            <div className="space-y-3">
              {currentTasks.map((task) => (
                <TaskRow
                  key={task.flowableTaskId}
                  name={task.name}
                  status={task.status}
                  assignee={task.assignee}
                  date={task.createdAt}
                  taskId={task.id || task.flowableTaskId}
                />
              ))}
              {currentTasks.length === 0 && (
                <p className="rounded border border-slate-200 p-4 text-sm text-slate-500">
                  Nessuna task corrente.
                </p>
              )}
            </div>
          </section>

          <section className="rounded-lg bg-white p-6 shadow">
            <div className="mb-4 flex items-center gap-2">
              <ListChecks size={20} className="text-green-700" />
              <h2 className="text-xl font-bold text-slate-900">Task completate</h2>
            </div>
            <div className="space-y-3">
              {completedTasks.map((task) => (
                <TaskRow
                  key={task.flowableTaskId}
                  name={task.name}
                  status={task.status}
                  assignee={task.assignee}
                  date={task.endedAt}
                  taskId={task.flowableTaskId}
                />
              ))}
              {completedTasks.length === 0 && (
                <p className="rounded border border-slate-200 p-4 text-sm text-slate-500">
                  Nessuna task completata.
                </p>
              )}
            </div>
          </section>

          <section className="rounded-lg bg-white p-6 shadow">
            <div className="mb-4 flex items-center gap-2">
              <ScrollText size={20} className="text-slate-700" />
              <h2 className="text-xl font-bold text-slate-900">Audit minimo</h2>
            </div>
            <div className="space-y-3">
              {auditEvents.map((event) => (
                <div
                  key={`${event.eventType}-${event.timestamp}-${event.eventData || ''}`}
                  className="border-l-4 border-blue-500 py-2 pl-4 text-sm"
                >
                  <p className="font-semibold text-slate-900">{event.eventType}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {formatDate(event.timestamp)}
                  </p>
                  {event.eventData && (
                    <p className="mt-1 text-slate-600">{event.eventData}</p>
                  )}
                </div>
              ))}
              {auditEvents.length === 0 && (
                <p className="rounded border border-slate-200 p-4 text-sm text-slate-500">
                  Nessun evento audit disponibile.
                </p>
              )}
            </div>
          </section>
        </div>

        <aside className="rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-bold text-slate-900">Variabili principali</h2>
          {variables.length > 0 ? (
            <div className="overflow-hidden rounded border border-slate-200">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-3 py-2">Nome</th>
                    <th className="px-3 py-2">Valore</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {variables.map(([key, value]) => (
                    <tr key={key}>
                      <td className="max-w-[160px] break-all px-3 py-3 font-semibold text-slate-800">
                        {key}
                      </td>
                      <td className="break-all px-3 py-3 text-slate-700">
                        {formatVariableValue(value)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="rounded border border-slate-200 p-4 text-sm text-slate-500">
              Nessuna variabile disponibile.
            </p>
          )}
        </aside>
      </div>
    </div>
  );
}
