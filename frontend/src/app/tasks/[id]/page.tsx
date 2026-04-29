'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle } from 'lucide-react';
import { adminIdentityApi, runtimeTaskApi } from '@/lib/api';
import type { AppUser, RuntimeTask } from '@/lib/types';
import DynamicFormRenderer from '@/components/DynamicFormRenderer';

const getApiErrorMessage = (err: any, fallback: string) =>
  err.response?.data?.message || err.message || fallback;

export default function TaskDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [task, setTask] = useState<RuntimeTask | null>(null);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [userId, setUserId] = useState('');
  const [completionJson, setCompletionJson] = useState('{\n  \n}');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTask = async () => {
      setLoading(true);
      setError(null);
      try {
        const [taskResponse, usersResponse] = await Promise.all([
          runtimeTaskApi.getTask(params.id),
          adminIdentityApi.listUsers(),
        ]);
        const loadedUsers = usersResponse.data.filter((user) => user.active);
        const fallbackUser = loadedUsers[0]?.id || '';

        setUsers(loadedUsers);
        setTask(taskResponse.data);
        setUserId(taskResponse.data.assignee || fallbackUser);
      } catch (err: any) {
        setError(getApiErrorMessage(err, 'Error loading task'));
      } finally {
        setLoading(false);
      }
    };

    fetchTask();
  }, [params.id]);

  const completeWithPayload = async (completionPayload: Record<string, any>) => {
    setSubmitting(true);
    setError(null);

    try {
      await runtimeTaskApi.completeTask(params.id, {
        userId,
        variables: completionPayload,
        formData: completionPayload,
      });
      router.push('/tasks');
    } catch (err: any) {
      setError(getApiErrorMessage(err, 'Error completing task'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleComplete = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await completeWithPayload(completionJson.trim() ? JSON.parse(completionJson) : {});
    } catch (err: any) {
      if (err instanceof SyntaxError) {
        setError('Completion payload must be valid JSON.');
      } else {
        setError(getApiErrorMessage(err, 'Error completing task'));
      }
    }
  };

  if (loading) return <div className="text-center py-12">Loading task...</div>;
  if (error && !task) return <div className="text-red-600 text-center py-12">Error: {error}</div>;
  if (!task) return <div className="text-center py-12">Task not found</div>;

  const canComplete = task.status === 'ASSIGNED' && task.assignee === userId;

  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold">{task.name}</h1>

      {error && (
        <div className="mb-6 rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mb-8 grid gap-6 md:grid-cols-3">
        <div className="rounded-lg bg-white p-4 shadow">
          <p className="text-sm text-gray-600">Status</p>
          <p className="text-lg font-bold text-slate-900">{task.status}</p>
        </div>
        <div className="rounded-lg bg-white p-4 shadow">
          <p className="text-sm text-gray-600">Assigned To</p>
          <p className="text-lg font-bold text-slate-900">
            {task.assignee || 'Unassigned'}
          </p>
        </div>
        <div className="rounded-lg bg-white p-4 shadow">
          <p className="text-sm text-gray-600">Process</p>
          <p className="break-all text-lg font-bold text-slate-900">
            {task.processInstanceId || task.flowableProcessInstanceId}
          </p>
        </div>
      </div>

      {task.variables && (
        <div className="mb-8 rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-bold">Process Variables</h2>
          <pre className="overflow-auto rounded bg-slate-950 p-4 text-sm text-slate-100">
            {JSON.stringify(task.variables, null, 2)}
          </pre>
        </div>
      )}

      {task.formSchema && (
        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-bold">Complete Task</h2>
          <div className="mb-4">
            <label className="block text-sm font-semibold text-slate-700">
              User
              <select
                value={userId}
                onChange={(event) => setUserId(event.target.value)}
                className="mt-1 w-full rounded border border-slate-300 px-3 py-2 font-normal"
              >
                <option value="">Select user</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.displayName} ({user.id})
                  </option>
                ))}
              </select>
            </label>
          </div>
          <DynamicFormRenderer
            schema={task.formSchema}
            initialValues={task.variables as Record<string, string | number | boolean | null>}
            disabled={submitting || !canComplete}
            submitLabel={submitting ? 'Completing...' : 'Complete Task'}
            onSubmit={(values) => completeWithPayload(values)}
          />
          {!canComplete && (
            <p className="mt-3 text-sm text-amber-700">
              Claim this task as the selected user before completing it.
            </p>
          )}
        </div>
      )}

      {!task.formSchema && (
        <form onSubmit={handleComplete} className="rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-bold">Complete Task</h2>
          <div className="space-y-4">
            <label className="block text-sm font-semibold text-slate-700">
              User
              <select
                value={userId}
                onChange={(event) => setUserId(event.target.value)}
                className="mt-1 w-full rounded border border-slate-300 px-3 py-2 font-normal"
              >
                <option value="">Select user</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.displayName} ({user.id})
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm font-semibold text-slate-700">
              Completion payload
              <textarea
                value={completionJson}
                onChange={(event) => setCompletionJson(event.target.value)}
                className="mt-1 w-full rounded border border-slate-300 px-3 py-2 font-mono text-sm font-normal"
                rows={8}
                disabled={!canComplete}
              />
            </label>

            <button
              type="submit"
              disabled={submitting || !canComplete}
              className="inline-flex items-center gap-2 rounded bg-green-600 px-6 py-2 font-bold text-white hover:bg-green-700 disabled:opacity-60"
            >
              <CheckCircle size={18} />
              {submitting ? 'Completing...' : 'Complete Task'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
