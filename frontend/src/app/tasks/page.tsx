'use client';

import { useEffect, useMemo, useState } from 'react';
import { CheckCircle, Clock, RefreshCw, UserCheck, Users } from 'lucide-react';
import { adminIdentityApi, runtimeTaskApi } from '@/lib/api';
import type { AppUser, RuntimeTask, UserGroup } from '@/lib/types';
import DynamicFormRenderer from '@/components/DynamicFormRenderer';

type InboxTab = 'mine' | 'group';

const getTaskKey = (task: RuntimeTask) => task.id?.toString() || task.flowableTaskId;

const formatDate = (value?: string | null) => {
  if (!value) return 'Not set';
  return new Date(value).toLocaleString();
};

export default function TasksPage() {
  const [activeTab, setActiveTab] = useState<InboxTab>('mine');
  const [users, setUsers] = useState<AppUser[]>([]);
  const [groups, setGroups] = useState<UserGroup[]>([]);
  const [userId, setUserId] = useState('');
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
  const [tasks, setTasks] = useState<RuntimeTask[]>([]);
  const [selectedTaskKey, setSelectedTaskKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [identityLoading, setIdentityLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [completionJson, setCompletionJson] = useState('{\n  \n}');

  const activeUsers = useMemo(() => users.filter((user) => user.active), [users]);
  const activeGroups = useMemo(() => groups.filter((group) => group.active), [groups]);

  const selectedUser = useMemo(
    () => users.find((user) => user.id === userId) || null,
    [userId, users]
  );

  const selectedTask = useMemo(
    () => tasks.find((task) => getTaskKey(task) === selectedTaskKey) || null,
    [selectedTaskKey, tasks]
  );

  useEffect(() => {
    setCompletionJson('{\n  \n}');
  }, [selectedTaskKey]);

  const loadIdentities = async () => {
    setIdentityLoading(true);
    setError(null);

    try {
      const [usersResponse, groupsResponse] = await Promise.all([
        adminIdentityApi.listUsers(),
        adminIdentityApi.listGroups(),
      ]);
      const loadedUsers = usersResponse.data;
      const loadedGroups = groupsResponse.data;
      const firstActiveUser = loadedUsers.find((user) => user.active) || loadedUsers[0];

      setUsers(loadedUsers);
      setGroups(loadedGroups);
      setUserId((current) => current || firstActiveUser?.id || '');
      setSelectedGroupIds((current) => {
        if (current.length > 0) return current;
        if (firstActiveUser?.groupIds?.length) return firstActiveUser.groupIds;
        return loadedGroups.filter((group) => group.active).map((group) => group.id);
      });
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Unable to load users and groups');
    } finally {
      setIdentityLoading(false);
    }
  };

  const fetchTasks = async () => {
    if (activeTab === 'mine' && !userId) {
      setTasks([]);
      setSelectedTaskKey(null);
      setNotice('Create or select a user to load personal tasks.');
      return;
    }
    if (activeTab === 'group' && selectedGroupIds.length === 0) {
      setTasks([]);
      setSelectedTaskKey(null);
      setNotice('Select at least one group to load group tasks.');
      return;
    }

    setLoading(true);
    setError(null);
    setNotice(null);

    try {
      const response =
        activeTab === 'mine'
          ? await runtimeTaskApi.listMyTasks(userId)
          : await runtimeTaskApi.listGroupTasks(selectedGroupIds);

      setTasks(response.data);
      setSelectedTaskKey((current) => {
        if (current && response.data.some((task) => getTaskKey(task) === current)) {
          return current;
        }
        return response.data[0] ? getTaskKey(response.data[0]) : null;
      });
    } catch (err: any) {
      setTasks([]);
      setSelectedTaskKey(null);
      setError(err.response?.data?.message || err.message || 'Error loading tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIdentities();
  }, []);

  useEffect(() => {
    if (identityLoading) return;
    fetchTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, identityLoading]);

  useEffect(() => {
    if (!selectedUser || selectedGroupIds.length > 0) return;
    setSelectedGroupIds(selectedUser.groupIds);
  }, [selectedUser, selectedGroupIds.length]);

  const toggleGroup = (groupId: string) => {
    setSelectedGroupIds((current) =>
      current.includes(groupId)
        ? current.filter((item) => item !== groupId)
        : [...current, groupId]
    );
  };

  const handleClaim = async () => {
    if (!selectedTask) return;
    setActionLoading(true);
    setError(null);
    setNotice(null);

    try {
      const response = await runtimeTaskApi.claimTask(getTaskKey(selectedTask), userId);
      setNotice('Task claimed.');
      setTasks((current) =>
        current.map((task) =>
          getTaskKey(task) === getTaskKey(selectedTask) ? response.data : task
        )
      );
      setSelectedTaskKey(getTaskKey(response.data));
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Unable to claim task');
    } finally {
      setActionLoading(false);
    }
  };

  const handleComplete = async () => {
    if (!selectedTask) return;
    try {
      const completionPayload = completionJson.trim()
        ? JSON.parse(completionJson)
        : {};
      await completeSelectedTask(completionPayload);
    } catch (err: any) {
      if (err instanceof SyntaxError) {
        setError('Completion payload must be valid JSON.');
      } else {
        setError(err.response?.data?.message || err.message || 'Unable to complete task');
      }
    }
  };

  const completeSelectedTask = async (completionPayload: Record<string, any>) => {
    if (!selectedTask) return;
    setActionLoading(true);
    setError(null);
    setNotice(null);

    try {
      await runtimeTaskApi.completeTask(getTaskKey(selectedTask), {
        userId,
        variables: completionPayload,
        formData: completionPayload,
      });
      setNotice('Task completed.');
      await fetchTasks();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Unable to complete task');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-slate-900">Task Inbox</h1>
          <p className="mt-1 text-sm text-slate-600">
            Runtime tasks from Flowable.
          </p>
        </div>
        <button
          type="button"
          onClick={fetchTasks}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
        >
          <RefreshCw size={18} />
          Refresh
        </button>
      </div>

      <div className="mb-6 bg-white rounded-lg shadow p-4">
        <div className="mb-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('mine')}
            className={`inline-flex items-center gap-2 rounded px-4 py-2 font-semibold ${
              activeTab === 'mine'
                ? 'bg-blue-600 text-white'
                : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            <UserCheck size={18} />
            Mie task
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('group')}
            className={`inline-flex items-center gap-2 rounded px-4 py-2 font-semibold ${
              activeTab === 'group'
                ? 'bg-blue-600 text-white'
                : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Users size={18} />
            Task di gruppo
          </button>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <label className="block text-sm font-semibold text-slate-700">
            User
            <select
              value={userId}
              onChange={(event) => {
                const nextUserId = event.target.value;
                setUserId(nextUserId);
                const nextUser = users.find((user) => user.id === nextUserId);
                setSelectedGroupIds(nextUser?.groupIds || []);
              }}
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2 font-normal"
            >
              <option value="">Select user</option>
              {activeUsers.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.displayName} ({user.id})
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-semibold text-slate-700">
            Group IDs
            <div className="mt-1 flex min-h-[42px] flex-wrap gap-2 rounded border border-slate-300 px-2 py-2 font-normal">
              {activeGroups.length === 0 && (
                <span className="text-sm text-slate-500">No groups configured.</span>
              )}
              {activeGroups.map((group) => (
                <label
                  key={group.id}
                  className="inline-flex items-center gap-2 rounded border border-slate-200 px-2 py-1 text-sm"
                >
                  <input
                    type="checkbox"
                    checked={selectedGroupIds.includes(group.id)}
                    onChange={() => toggleGroup(group.id)}
                  />
                  {group.id}
                </label>
              ))}
            </div>
          </label>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {notice && (
        <div className="mb-4 rounded border border-green-200 bg-green-50 p-3 text-sm text-green-700">
          {notice}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-4">
          {(loading || identityLoading) && <div className="text-center py-12">Loading tasks...</div>}

          {!loading &&
            !identityLoading &&
            tasks.map((task) => (
              <button
                type="button"
                key={getTaskKey(task)}
                onClick={() => setSelectedTaskKey(getTaskKey(task))}
                className={`w-full rounded-lg bg-white p-5 text-left shadow transition hover:shadow-lg ${
                  selectedTaskKey === getTaskKey(task)
                    ? 'ring-2 ring-blue-500'
                    : ''
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">{task.name}</h2>
                    <p className="mt-1 text-sm text-slate-600">
                      Process instance: {task.processInstanceId || task.flowableProcessInstanceId}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Created: {formatDate(task.createdAt)}
                    </p>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
                      task.status === 'ASSIGNED'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    <Clock size={14} />
                    {task.status}
                  </span>
                </div>
              </button>
            ))}

          {!loading && !identityLoading && tasks.length === 0 && (
            <div className="rounded-lg bg-white p-8 text-center text-slate-500 shadow">
              No tasks found.
            </div>
          )}
        </div>

        <aside className="rounded-lg bg-white p-6 shadow">
          <h2 className="text-xl font-bold text-slate-900">Dettaglio task</h2>

          {!selectedTask && (
            <p className="mt-4 text-sm text-slate-500">Select a task to view details.</p>
          )}

          {selectedTask && (
            <div className="mt-4 space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase text-slate-500">Name</p>
                <p className="text-sm text-slate-900">{selectedTask.name}</p>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs font-semibold uppercase text-slate-500">Status</p>
                  <p className="text-slate-900">{selectedTask.status}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase text-slate-500">Assignee</p>
                  <p className="text-slate-900">{selectedTask.assignee || 'Unassigned'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase text-slate-500">Task ID</p>
                  <p className="break-all text-slate-900">
                    {selectedTask.id || selectedTask.flowableTaskId}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase text-slate-500">Due</p>
                  <p className="text-slate-900">{formatDate(selectedTask.dueDate)}</p>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase text-slate-500">Groups</p>
                <p className="text-sm text-slate-900">
                  {selectedTask.candidateGroups.length > 0
                    ? selectedTask.candidateGroups.join(', ')
                    : 'None'}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase text-slate-500">Variables</p>
                <pre className="mt-2 max-h-56 overflow-auto rounded bg-slate-950 p-3 text-xs text-slate-100">
                  {JSON.stringify(selectedTask.variables || {}, null, 2)}
                </pre>
              </div>

              {selectedTask.formSchema ? (
                <div className="rounded border border-slate-200 p-3">
                  <DynamicFormRenderer
                    key={`${getTaskKey(selectedTask)}-${selectedTask.formKey || ''}`}
                    schema={selectedTask.formSchema}
                    initialValues={selectedTask.variables as Record<string, string | number | boolean | null>}
                    disabled={actionLoading || selectedTask.assignee !== userId}
                    submitLabel={actionLoading ? 'Completing...' : 'Complete'}
                    onSubmit={(values) => completeSelectedTask(values)}
                  />
                </div>
              ) : (
                <label className="block text-sm font-semibold text-slate-700">
                  Completion payload
                  <textarea
                    value={completionJson}
                    onChange={(event) => setCompletionJson(event.target.value)}
                    rows={6}
                    disabled={actionLoading || selectedTask.assignee !== userId}
                    className="mt-2 w-full rounded border border-slate-300 px-3 py-2 font-mono text-xs font-normal disabled:bg-slate-100"
                  />
                </label>
              )}

              <div className="flex flex-wrap gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleClaim}
                  disabled={actionLoading || selectedTask.status !== 'CANDIDATE'}
                  className="inline-flex items-center gap-2 rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  <UserCheck size={16} />
                  Claim
                </button>
                <button
                  type="button"
                  onClick={handleComplete}
                  disabled={actionLoading || selectedTask.assignee !== userId || Boolean(selectedTask.formSchema)}
                  className="inline-flex items-center gap-2 rounded bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-60"
                >
                  <CheckCircle size={16} />
                  Complete
                </button>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
