'use client';

import { useState } from 'react';
import { useForms } from '@/hooks/useApi';
import { Plus, Trash2 } from 'lucide-react';
import { formApi } from '@/lib/api';
import DynamicFormRenderer from '@/components/DynamicFormRenderer';

export default function FormsPage() {
  const { forms, loading, error, refetch } = useForms();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    schema: '{"title":"","description":"","fields":[]}',
  });

  const handleCreateForm = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await formApi.createFormDefinition(formData);
      setFormData({
        name: '',
        description: '',
        schema: '{"title":"","description":"","fields":[]}',
      });
      setShowCreateForm(false);
      refetch();
    } catch (err) {
      console.error('Error creating form:', err);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure?')) {
      try {
        await formApi.deleteFormDefinition(id);
        refetch();
      } catch (err) {
        console.error('Error deleting form:', err);
      }
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-bold">Form Definitions</h1>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <Plus size={20} /> New Form
        </button>
      </div>

      {showCreateForm && (
        <form
          onSubmit={handleCreateForm}
          className="bg-white rounded-lg shadow p-6 mb-8"
        >
          <h2 className="text-xl font-bold mb-4">Create New Form</h2>
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Form Name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
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
              rows={2}
            />
            <div>
              <p className="text-sm font-semibold mb-2">JSON Schema</p>
              <textarea
                placeholder='{"title":"","description":"","fields":[]}'
                value={formData.schema}
                onChange={(e) =>
                  setFormData({ ...formData, schema: e.target.value })
                }
                className="w-full border border-gray-300 rounded px-3 py-2 font-mono text-sm"
                rows={8}
              />
              <p className="text-xs text-gray-600 mt-2">
                Define form fields as JSON with name, label, type, and optional validation.
              </p>
            </div>
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

      {loading && <div className="text-center py-12">Loading forms...</div>}
      {error && <div className="text-red-600 text-center py-12">Error: {error}</div>}

      <div className="grid gap-6">
        {forms.map((form) => (
          <div
            key={form.id}
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-bold text-slate-900">{form.name}</h3>
                <p className="text-gray-600 text-sm">{form.description}</p>
                <p className="text-gray-500 text-xs mt-2">
                  Version {form.version} • Created{' '}
                  {new Date(form.createdAt).toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={() => handleDelete(form.id)}
                className="p-2 hover:bg-red-50 rounded text-red-600"
              >
                <Trash2 size={20} />
              </button>
            </div>
            <pre className="bg-gray-50 p-3 rounded text-xs mt-4 overflow-auto">
              {form.schema.slice(0, 240)}...
            </pre>
            <div className="mt-4 rounded border border-slate-200 p-4">
              <p className="mb-3 text-sm font-semibold text-slate-700">Preview</p>
              <DynamicFormRenderer key={form.schema} schema={form.schema} disabled />
            </div>
          </div>
        ))}
      </div>

      {forms.length === 0 && !loading && (
        <div className="text-center py-12 text-gray-500">
          No forms yet. Create one to get started.
        </div>
      )}
    </div>
  );
}
