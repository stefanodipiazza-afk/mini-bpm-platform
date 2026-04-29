'use client';

import { useEffect, useMemo, useState } from 'react';
import { Plus, Trash2, Users, UserPlus } from 'lucide-react';
import { adminIdentityApi } from '@/lib/api';
import type { AppUser, UserGroup } from '@/lib/types';

const emptyUserForm = {
  id: '',
  displayName: '',
  email: '',
  active: true,
  groupIds: [] as string[],
};

const emptyGroupForm = {
  id: '',
  name: '',
  description: '',
  active: true,
};

const getApiErrorMessage = (err: any, fallback: string) =>
  err.response?.data?.message || err.message || fallback;

export default function IdentityAdminPage() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [groups, setGroups] = useState<UserGroup[]>([]);
  const [userForm, setUserForm] = useState(emptyUserForm);
  const [groupForm, setGroupForm] = useState(emptyGroupForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const groupNameById = useMemo(
    () => new Map(groups.map((group) => [group.id, group.name])),
    [groups]
  );

  const loadIdentities = async () => {
    setLoading(true);
    setError(null);
    try {
      const [usersResponse, groupsResponse] = await Promise.all([
        adminIdentityApi.listUsers(),
        adminIdentityApi.listGroups(),
      ]);
      setUsers(usersResponse.data);
      setGroups(groupsResponse.data);
    } catch (err: any) {
      setError(getApiErrorMessage(err, 'Unable to load identities'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIdentities();
  }, []);

  const handleCreateGroup = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      await adminIdentityApi.createGroup(groupForm);
      setGroupForm(emptyGroupForm);
      setNotice('Group created.');
      await loadIdentities();
    } catch (err: any) {
      setError(getApiErrorMessage(err, 'Unable to create group'));
    } finally {
      setSaving(false);
    }
  };

  const handleCreateUser = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      await adminIdentityApi.createUser(userForm);
      setUserForm(emptyUserForm);
      setNotice('User created.');
      await loadIdentities();
    } catch (err: any) {
      setError(getApiErrorMessage(err, 'Unable to create user'));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (!confirm(`Delete group ${groupId}?`)) return;
    setError(null);
    setNotice(null);
    try {
      await adminIdentityApi.deleteGroup(groupId);
      setNotice('Group deleted.');
      await loadIdentities();
    } catch (err: any) {
      setError(getApiErrorMessage(err, 'Unable to delete group'));
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm(`Delete user ${userId}?`)) return;
    setError(null);
    setNotice(null);
    try {
      await adminIdentityApi.deleteUser(userId);
      setNotice('User deleted.');
      await loadIdentities();
    } catch (err: any) {
      setError(getApiErrorMessage(err, 'Unable to delete user'));
    }
  };

  const handleToggleGroupActive = async (group: UserGroup) => {
    setError(null);
    setNotice(null);
    try {
      await adminIdentityApi.updateGroup(group.id, {
        name: group.name,
        description: group.description || '',
        active: !group.active,
      });
      setNotice(group.active ? 'Group disabled.' : 'Group enabled.');
      await loadIdentities();
    } catch (err: any) {
      setError(getApiErrorMessage(err, 'Unable to update group'));
    }
  };

  const handleToggleUserActive = async (user: AppUser) => {
    setError(null);
    setNotice(null);
    try {
      await adminIdentityApi.updateUser(user.id, {
        displayName: user.displayName,
        email: user.email || '',
        active: !user.active,
        groupIds: user.groupIds,
      });
      setNotice(user.active ? 'User disabled.' : 'User enabled.');
      await loadIdentities();
    } catch (err: any) {
      setError(getApiErrorMessage(err, 'Unable to update user'));
    }
  };

  const handleToggleMembership = async (user: AppUser, groupId: string) => {
    const nextGroupIds = user.groupIds.includes(groupId)
      ? user.groupIds.filter((item) => item !== groupId)
      : [...user.groupIds, groupId];

    setError(null);
    setNotice(null);
    try {
      await adminIdentityApi.updateUser(user.id, {
        displayName: user.displayName,
        email: user.email || '',
        active: user.active,
        groupIds: nextGroupIds,
      });
      setNotice('User groups updated.');
      await loadIdentities();
    } catch (err: any) {
      setError(getApiErrorMessage(err, 'Unable to update user groups'));
    }
  };

  const toggleUserGroup = (groupId: string) => {
    setUserForm((current) => ({
      ...current,
      groupIds: current.groupIds.includes(groupId)
        ? current.groupIds.filter((item) => item !== groupId)
        : [...current.groupIds, groupId],
    }));
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-slate-900">Identity Admin</h1>
        <p className="mt-1 text-sm text-slate-600">
          Manage application users and groups used by Flowable task assignments.
        </p>
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

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-lg bg-white p-6 shadow">
          <div className="mb-4 flex items-center gap-2">
            <Users className="text-blue-700" size={22} />
            <h2 className="text-xl font-bold text-slate-900">Groups</h2>
          </div>

          <form onSubmit={handleCreateGroup} className="mb-6 space-y-3">
            <div className="grid gap-3 md:grid-cols-2">
              <input
                value={groupForm.id}
                onChange={(event) => setGroupForm({ ...groupForm, id: event.target.value })}
                placeholder="group id, e.g. finance"
                className="rounded border border-slate-300 px-3 py-2"
                required
              />
              <input
                value={groupForm.name}
                onChange={(event) => setGroupForm({ ...groupForm, name: event.target.value })}
                placeholder="Group name"
                className="rounded border border-slate-300 px-3 py-2"
                required
              />
            </div>
            <input
              value={groupForm.description}
              onChange={(event) => setGroupForm({ ...groupForm, description: event.target.value })}
              placeholder="Description"
              className="w-full rounded border border-slate-300 px-3 py-2"
            />
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
            >
              <Plus size={18} />
              Add group
            </button>
          </form>

          {loading && <p className="py-8 text-center text-slate-500">Loading groups...</p>}
          {!loading && groups.length === 0 && (
            <p className="py-8 text-center text-slate-500">No groups configured.</p>
          )}
          <div className="space-y-3">
            {groups.map((group) => (
              <div key={group.id} className="rounded border border-slate-200 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">{group.name}</p>
                    <p className="font-mono text-xs text-slate-500">{group.id}</p>
                  {group.description && (
                    <p className="mt-1 text-sm text-slate-600">{group.description}</p>
                  )}
                  <p className={`mt-2 text-xs font-semibold ${group.active ? 'text-green-700' : 'text-slate-500'}`}>
                    {group.active ? 'Active' : 'Disabled'}
                  </p>
                </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleGroupActive(group)}
                      className="rounded border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      {group.active ? 'Disable' : 'Enable'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteGroup(group.id)}
                      className="rounded p-2 text-red-600 hover:bg-red-50"
                      title="Delete group"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-lg bg-white p-6 shadow">
          <div className="mb-4 flex items-center gap-2">
            <UserPlus className="text-blue-700" size={22} />
            <h2 className="text-xl font-bold text-slate-900">Users</h2>
          </div>

          <form onSubmit={handleCreateUser} className="mb-6 space-y-3">
            <div className="grid gap-3 md:grid-cols-2">
              <input
                value={userForm.id}
                onChange={(event) => setUserForm({ ...userForm, id: event.target.value })}
                placeholder="user id, e.g. maria.rossi"
                className="rounded border border-slate-300 px-3 py-2"
                required
              />
              <input
                value={userForm.displayName}
                onChange={(event) => setUserForm({ ...userForm, displayName: event.target.value })}
                placeholder="Display name"
                className="rounded border border-slate-300 px-3 py-2"
                required
              />
            </div>
            <input
              type="email"
              value={userForm.email}
              onChange={(event) => setUserForm({ ...userForm, email: event.target.value })}
              placeholder="Email"
              className="w-full rounded border border-slate-300 px-3 py-2"
            />
            <div className="rounded border border-slate-200 p-3">
              <p className="mb-2 text-sm font-semibold text-slate-700">Groups</p>
              {groups.length === 0 && (
                <p className="text-sm text-slate-500">Create a group first.</p>
              )}
              <div className="flex flex-wrap gap-2">
                {groups.map((group) => (
                  <label
                    key={group.id}
                    className="inline-flex items-center gap-2 rounded border border-slate-300 px-3 py-2 text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={userForm.groupIds.includes(group.id)}
                      onChange={() => toggleUserGroup(group.id)}
                    />
                    {group.name}
                  </label>
                ))}
              </div>
            </div>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
            >
              <Plus size={18} />
              Add user
            </button>
          </form>

          {loading && <p className="py-8 text-center text-slate-500">Loading users...</p>}
          {!loading && users.length === 0 && (
            <p className="py-8 text-center text-slate-500">No users configured.</p>
          )}
          <div className="space-y-3">
            {users.map((user) => (
              <div key={user.id} className="rounded border border-slate-200 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">{user.displayName}</p>
                    <p className="font-mono text-xs text-slate-500">{user.id}</p>
                    {user.email && <p className="mt-1 text-sm text-slate-600">{user.email}</p>}
                    <p className={`mt-2 text-xs font-semibold ${user.active ? 'text-green-700' : 'text-slate-500'}`}>
                      {user.active ? 'Active' : 'Disabled'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleUserActive(user)}
                      className="rounded border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      {user.active ? 'Disable' : 'Enable'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteUser(user.id)}
                      className="rounded p-2 text-red-600 hover:bg-red-50"
                      title="Delete user"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {groups.map((group) => (
                    <label
                      key={group.id}
                      className="inline-flex items-center gap-2 rounded border border-slate-300 px-3 py-2 text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={user.groupIds.includes(group.id)}
                        onChange={() => handleToggleMembership(user, group.id)}
                      />
                      {groupNameById.get(group.id) || group.id}
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
