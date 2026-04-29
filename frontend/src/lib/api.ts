import axios, { AxiosInstance } from 'axios';
import * as Types from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Process Definitions
export const processApi = {
  createProcessDefinition: (data: {
    name: string;
    description?: string;
    definition: string;
  }) => apiClient.post('/workflows', data),

  listProcessDefinitions: () =>
    apiClient.get<Types.ProcessDefinition[]>('/workflows'),

  getProcessDefinition: (id: number) =>
    apiClient.get<Types.ProcessDefinition>(`/workflows/${id}`),

  updateProcessDefinition: (
    id: number,
    data: {
      name: string;
      description?: string;
      definition: string;
    }
  ) => apiClient.put<Types.ProcessDefinition>(`/workflows/${id}`, data),

  publishProcessDefinition: (id: number) =>
    apiClient.post<Types.ProcessDefinition>(`/workflows/${id}/publish`, {}),

  deleteProcessDefinition: (id: number) =>
    apiClient.delete(`/processes/${id}`),

  startProcessInstance: (
    id: number,
    variables?: Record<string, any>
  ) =>
    apiClient.post<Types.ProcessInstance>(
      `/processes/${id}/start`,
      variables || {}
    ),

  listProcessInstances: (processDefinitionId: number) =>
    apiClient.get<Types.ProcessInstance[]>(
      `/processes/${processDefinitionId}/instances`
    ),

  listDeploymentHistory: (processDefinitionId: number) =>
    apiClient.get<Types.WorkflowDeployment[]>(
      `/workflows/${processDefinitionId}/deployments`
    ),
};

// Process Instances
export const instanceApi = {
  getProcessInstance: (id: number) =>
    apiClient.get<Types.ProcessInstance>(`/instances/${id}`),

  getExecutionHistory: (id: number) =>
    apiClient.get<Types.ExecutionLog[]>(`/instances/${id}/history`),

  getProcessVariables: (id: number) =>
    apiClient.get<Record<string, any>>(`/instances/${id}/variables`),
};

// Runtime Processes
export const runtimeProcessApi = {
  startProcess: (
    processDefinitionId: number,
    payload: Types.RuntimeStartProcessRequest
  ) =>
    apiClient.post<Types.RuntimeProcessInstance>(
      `/runtime/processes/${processDefinitionId}/start`,
      payload
    ),

  getProcessInstance: (processInstanceId: number) =>
    apiClient.get<Types.RuntimeProcessInstance>(
      `/runtime/instances/${processInstanceId}`
    ),

  getInstanceHistory: (processInstanceId: number) =>
    apiClient.get<Types.RuntimeHistoryEvent[]>(
      `/runtime/instances/${processInstanceId}/history`
    ),

  getTaskHistory: (processInstanceId: number) =>
    apiClient.get<Types.RuntimeTaskHistory[]>(
      `/runtime/instances/${processInstanceId}/task-history`
    ),
};

// User Tasks
export const taskApi = {
  listTasks: () => apiClient.get<Types.UserTask[]>('/tasks'),

  getTask: (id: number) => apiClient.get<Types.UserTask>(`/tasks/${id}`),

  claimTask: (id: number, userId: string) =>
    apiClient.post<Types.UserTask>(`/tasks/${id}/claim?userId=${userId}`, {}),

  completeTask: (id: number, formData: string) =>
    apiClient.post<Types.UserTask>(`/tasks/${id}/complete`, { formData }),
};

// Runtime Tasks
export const runtimeTaskApi = {
  listMyTasks: (userId: string) =>
    apiClient.get<Types.RuntimeTask[]>('/runtime/tasks/my', {
      params: { userId },
    }),

  listGroupTasks: (groupIds: string[]) =>
    apiClient.get<Types.RuntimeTask[]>('/runtime/tasks/group', {
      params: { groupIds: groupIds.join(',') },
    }),

  getTask: (taskId: string) =>
    apiClient.get<Types.RuntimeTask>(`/runtime/tasks/${taskId}`),

  claimTask: (taskId: string, userId: string) =>
    apiClient.post<Types.RuntimeTask>(`/runtime/tasks/${taskId}/claim`, {
      userId,
    }),

  completeTask: (
    taskId: string,
    payload: Types.RuntimeCompleteTaskRequest
  ) =>
    apiClient.post<Types.RuntimeCompleteTaskResponse>(
      `/runtime/tasks/${taskId}/complete`,
      payload
    ),
};

// Admin identities
export const adminIdentityApi = {
  listUsers: () => apiClient.get<Types.AppUser[]>('/admin/users'),

  createUser: (data: Types.AppUserSaveRequest) =>
    apiClient.post<Types.AppUser>('/admin/users', data),

  updateUser: (id: string, data: Types.AppUserSaveRequest) =>
    apiClient.put<Types.AppUser>(`/admin/users/${encodeURIComponent(id)}`, data),

  deleteUser: (id: string) =>
    apiClient.delete(`/admin/users/${encodeURIComponent(id)}`),

  listGroups: () => apiClient.get<Types.UserGroup[]>('/admin/groups'),

  createGroup: (data: Types.UserGroupSaveRequest) =>
    apiClient.post<Types.UserGroup>('/admin/groups', data),

  updateGroup: (id: string, data: Types.UserGroupSaveRequest) =>
    apiClient.put<Types.UserGroup>(`/admin/groups/${encodeURIComponent(id)}`, data),

  deleteGroup: (id: string) =>
    apiClient.delete(`/admin/groups/${encodeURIComponent(id)}`),
};

// Forms
export const formApi = {
  createFormDefinition: (data: {
    name: string;
    description?: string;
    schema: string;
  }) => apiClient.post<Types.FormDefinition>('/forms', data),

  listFormDefinitions: () =>
    apiClient.get<Types.FormDefinition[]>('/forms'),

  getFormDefinition: (id: number) =>
    apiClient.get<Types.FormDefinition>(`/forms/${id}`),

  updateFormDefinition: (id: number, data: any) =>
    apiClient.put<Types.FormDefinition>(`/forms/${id}`, data),

  deleteFormDefinition: (id: number) =>
    apiClient.delete(`/forms/${id}`),
};

// Rules
export const ruleApi = {
  createRuleDefinition: (data: {
    name: string;
    description?: string;
    rules: string;
  }) => apiClient.post<Types.RuleDefinition>('/rules', data),

  listRuleDefinitions: () =>
    apiClient.get<Types.RuleDefinition[]>('/rules'),

  getRuleDefinition: (id: number) =>
    apiClient.get<Types.RuleDefinition>(`/rules/${id}`),

  deleteRuleDefinition: (id: number) =>
    apiClient.delete(`/rules/${id}`),
};

// Dashboard
export const dashboardApi = {
  getDashboardStats: () =>
    apiClient.get<Types.DashboardStats>('/dashboard/stats'),
};

export default apiClient;
