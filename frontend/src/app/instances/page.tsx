'use client';

import { useProcesses } from '@/hooks/useApi';
import { useProcessInstances } from '@/hooks/useApi';
import { useState } from 'react';
import Link from 'next/link';
import { Activity, CheckCircle, AlertCircle } from 'lucide-react';

export default function InstancesPage() {
  const { processes, loading: processesLoading } = useProcesses();
  const [selectedProcessId, setSelectedProcessId] = useState<number | null>(null);
  const selectedProcess =
    processes.find((p) => p.id === selectedProcessId) ||
    (processes.length > 0 ? processes[0] : null);

  const { instances, loading: instancesLoading } = useProcessInstances(
    selectedProcess?.id || 0
  );

  const statusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Activity size={20} className="text-blue-500" />;
      case 'COMPLETED':
        return <CheckCircle size={20} className="text-green-500" />;
      case 'FAILED':
        return <AlertCircle size={20} className="text-red-500" />;
      default:
        return null;
    }
  };

  if (processesLoading) {
    return <div className="text-center py-12">Loading processes...</div>;
  }

  return (
    <div>
      <h1 className="text-4xl font-bold mb-8">Process Instances</h1>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar: Process List */}
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="font-bold text-lg mb-4">Processes</h2>
          <div className="space-y-2">
            {processes.map((process) => (
              <button
                key={process.id}
                onClick={() => setSelectedProcessId(process.id)}
                className={`w-full text-left px-4 py-2 rounded transition ${
                  selectedProcess?.id === process.id
                    ? 'bg-blue-600 text-white'
                    : 'hover:bg-gray-100'
                }`}
              >
                <p className="text-sm font-semibold">{process.name}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Main: Instance List */}
        <div className="lg:col-span-3">
          {selectedProcess ? (
            <div>
              <h2 className="text-2xl font-bold mb-4">{selectedProcess.name}</h2>
              {instancesLoading && <div className="text-center py-12">Loading instances...</div>}

              <div className="space-y-4">
                {instances.map((instance) => (
                  <Link
                    key={instance.id}
                    href={`/instances/${instance.id}`}
                  >
                    <div className="bg-white rounded-lg shadow p-4 hover:shadow-lg cursor-pointer transition">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {statusIcon(instance.status)}
                          <div>
                            <p className="font-bold text-slate-900">
                              Instance #{instance.id}
                            </p>
                            <p className="text-sm text-gray-600">
                              Started: {new Date(instance.startedAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            instance.status === 'ACTIVE'
                              ? 'bg-blue-100 text-blue-800'
                              : instance.status === 'COMPLETED'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {instance.status}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {instances.length === 0 && !instancesLoading && (
                <div className="text-center py-12 text-gray-500">
                  No instances found for this process.
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              No processes available.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
