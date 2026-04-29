'use client';

import { useEffect } from 'react';
import { useDashboardStats } from '@/hooks/useApi';
import { Activity, CheckCircle, AlertCircle, Inbox, BookOpen } from 'lucide-react';

export default function Dashboard() {
  const { stats, loading, error, refetch } = useDashboardStats();

  useEffect(() => {
    const interval = setInterval(refetch, 5000);
    return () => clearInterval(interval);
  }, [refetch]);

  if (loading && !stats) {
    return <div className="text-center py-12">Loading dashboard...</div>;
  }

  if (error && !stats) {
    return <div className="text-center py-12 text-red-600">Error: {error}</div>;
  }

  return (
    <div>
      <h1 className="text-4xl font-bold mb-8">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {/* Total Processes */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Processes</p>
              <p className="text-3xl font-bold text-slate-900">
                {stats?.totalProcesses || 0}
              </p>
            </div>
            <BookOpen className="text-blue-500" size={32} />
          </div>
        </div>

        {/* Active Instances */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Active Instances</p>
              <p className="text-3xl font-bold text-slate-900">
                {stats?.activeInstances || 0}
              </p>
            </div>
            <Activity className="text-green-500" size={32} />
          </div>
        </div>

        {/* Completed Instances */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Completed</p>
              <p className="text-3xl font-bold text-slate-900">
                {stats?.completedInstances || 0}
              </p>
            </div>
            <CheckCircle className="text-emerald-500" size={32} />
          </div>
        </div>

        {/* Failed Instances */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Failed</p>
              <p className="text-3xl font-bold text-slate-900">
                {stats?.failedInstances || 0}
              </p>
            </div>
            <AlertCircle className="text-red-500" size={32} />
          </div>
        </div>

        {/* Pending Tasks */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Pending Tasks</p>
              <p className="text-3xl font-bold text-slate-900">
                {stats?.pendingTasks || 0}
              </p>
            </div>
            <Inbox className="text-orange-500" size={32} />
          </div>
        </div>
      </div>

      {/* Info Cards */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-bold text-blue-900 mb-2">Getting Started</h3>
          <p className="text-blue-700 text-sm">
            Create your first process workflow by going to the Workflows section.
          </p>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
          <h3 className="font-bold text-purple-900 mb-2">Design Forms</h3>
          <p className="text-purple-700 text-sm">
            Create reusable forms for your tasks in the Forms section.
          </p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <h3 className="font-bold text-green-900 mb-2">Monitor Progress</h3>
          <p className="text-green-700 text-sm">
            Track active processes and tasks in real-time from your dashboard.
          </p>
        </div>
      </div>
    </div>
  );
}
