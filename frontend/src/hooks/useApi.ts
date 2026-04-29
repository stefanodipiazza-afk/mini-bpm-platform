import { useState, useEffect } from 'react';
import { processApi, instanceApi, taskApi, formApi, ruleApi, dashboardApi } from '@/lib/api';
import * as Types from '@/lib/types';

// Processes Hook
export const useProcesses = () => {
  const [processes, setProcesses] = useState<Types.ProcessDefinition[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProcesses = async () => {
    setLoading(true);
    try {
      const response = await processApi.listProcessDefinitions();
      setProcesses(response.data);
    } catch (err: any) {
      setError(err.message || 'Error fetching processes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProcesses();
  }, []);

  return { processes, loading, error, refetch: fetchProcesses };
};

// Process Instances Hook
export const useProcessInstances = (processDefinitionId: number) => {
  const [instances, setInstances] = useState<Types.ProcessInstance[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInstances = async () => {
    setLoading(true);
    try {
      const response = await processApi.listProcessInstances(processDefinitionId);
      setInstances(response.data);
    } catch (err: any) {
      setError(err.message || 'Error fetching instances');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (processDefinitionId) fetchInstances();
  }, [processDefinitionId]);

  return { instances, loading, error, refetch: fetchInstances };
};

// Tasks Hook
export const useTasks = () => {
  const [tasks, setTasks] = useState<Types.UserTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const response = await taskApi.listTasks();
      setTasks(response.data);
    } catch (err: any) {
      setError(err.message || 'Error fetching tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  return { tasks, loading, error, refetch: fetchTasks };
};

// Forms Hook
export const useForms = () => {
  const [forms, setForms] = useState<Types.FormDefinition[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchForms = async () => {
    setLoading(true);
    try {
      const response = await formApi.listFormDefinitions();
      setForms(response.data);
    } catch (err: any) {
      setError(err.message || 'Error fetching forms');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchForms();
  }, []);

  return { forms, loading, error, refetch: fetchForms };
};

// Dashboard Stats Hook
export const useDashboardStats = () => {
  const [stats, setStats] = useState<Types.DashboardStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const response = await dashboardApi.getDashboardStats();
      setStats(response.data);
    } catch (err: any) {
      setError(err.message || 'Error fetching stats');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return { stats, loading, error, refetch: fetchStats };
};
