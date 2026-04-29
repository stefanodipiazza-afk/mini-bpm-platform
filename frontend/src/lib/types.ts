// API Types
export interface ProcessDefinition {
  id: number;
  name: string;
  version: number;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  description?: string;
  definition?: string;
  flowableDeploymentId?: string;
  flowableProcessDefinitionId?: string;
  flowableProcessDefinitionKey?: string;
  flowableProcessDefinitionVersion?: number;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowDeployment {
  deploymentId: string;
  deploymentName?: string | null;
  deployedAt?: string | null;
  flowableProcessDefinitionId: string;
  flowableProcessDefinitionKey: string;
  flowableProcessDefinitionName?: string | null;
  flowableProcessDefinitionVersion: number;
  resourceName?: string | null;
  suspended: boolean;
}

export interface ProcessInstance {
  id: number;
  processDefinitionId: number;
  status: 'ACTIVE' | 'COMPLETED' | 'FAILED' | 'SUSPENDED';
  variables?: Record<string, any>;
  startedAt: string;
  completedAt?: string;
}

export interface UserTask {
  id: number;
  processInstanceId: number;
  taskName: string;
  assignedTo?: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REASSIGNED';
  formSchema?: string;
  formData?: string;
  dueDate?: string;
  createdAt: string;
  completedAt?: string;
}

export interface RuntimeTask {
  id?: number | null;
  flowableTaskId: string;
  processInstanceId?: number | null;
  flowableProcessInstanceId: string;
  name: string;
  assignee?: string | null;
  candidateGroups: string[];
  formKey?: string | null;
  formSchema?: string | null;
  status: 'CANDIDATE' | 'ASSIGNED' | 'COMPLETED';
  createdAt?: string | null;
  dueDate?: string | null;
  variables?: Record<string, any>;
}

export interface RuntimeStartProcessRequest {
  businessKey?: string;
  variables?: Record<string, any>;
}

export interface RuntimeProcessInstance {
  id: number;
  flowableProcessInstanceId: string;
  processDefinitionId: number;
  flowableProcessDefinitionId: string;
  businessKey?: string | null;
  status: 'ACTIVE' | 'COMPLETED' | 'FAILED' | 'SUSPENDED' | 'UNKNOWN';
  startedAt: string;
  completedAt?: string | null;
  endedAt?: string | null;
  durationMillis?: number | null;
  variables?: Record<string, any>;
  activeTasks?: RuntimeTask[];
  history?: ExecutionLog[];
  flowableHistory?: RuntimeHistoryEvent[];
  taskHistory?: RuntimeTaskHistory[];
}

export interface RuntimeHistoryEvent {
  type: string;
  label?: string | null;
  activityId?: string | null;
  activityName?: string | null;
  activityType?: string | null;
  taskId?: string | null;
  assignee?: string | null;
  startedAt?: string | null;
  endedAt?: string | null;
  durationMillis?: number | null;
}

export interface RuntimeTaskHistory {
  flowableTaskId: string;
  name?: string | null;
  taskDefinitionKey?: string | null;
  assignee?: string | null;
  owner?: string | null;
  formKey?: string | null;
  deleteReason?: string | null;
  createdAt?: string | null;
  claimTime?: string | null;
  endedAt?: string | null;
  dueDate?: string | null;
  durationMillis?: number | null;
  status: 'ACTIVE' | 'COMPLETED' | 'DELETED' | string;
}

export interface RuntimeClaimTaskRequest {
  userId: string;
}

export interface RuntimeCompleteTaskRequest {
  userId: string;
  variables?: Record<string, any>;
  formData?: Record<string, any>;
}

export interface RuntimeCompleteTaskResponse {
  taskId?: number | null;
  flowableTaskId: string;
  processInstanceId?: number | null;
  completed: boolean;
  processInstanceStatus: string;
}

export interface UserGroup {
  id: string;
  name: string;
  description?: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AppUser {
  id: string;
  displayName: string;
  email?: string | null;
  active: boolean;
  groupIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface UserGroupSaveRequest {
  id?: string;
  name: string;
  description?: string;
  active?: boolean;
}

export interface AppUserSaveRequest {
  id?: string;
  displayName: string;
  email?: string;
  active?: boolean;
  groupIds: string[];
}

export interface FormDefinition {
  id: number;
  name: string;
  version: number;
  schema: string;
  description?: string;
  createdAt: string;
}

export interface RuleDefinition {
  id: number;
  name: string;
  version: number;
  rules: string;
  description?: string;
  createdAt: string;
}

export interface ExecutionLog {
  eventType: string;
  eventData?: string;
  timestamp: string;
}

export interface DashboardStats {
  totalProcesses: number;
  activeInstances: number;
  completedInstances: number;
  failedInstances: number;
  pendingTasks: number;
}

// Form Schema Types
export interface FormField {
  id?: string;
  name: string;
  label: string;
  type: 'text' | 'number' | 'email' | 'select' | 'checkbox' | 'date' | 'textarea';
  required?: boolean;
  readonly?: boolean;
  placeholder?: string;
  helpText?: string;
  defaultValue?: string | number | boolean | null;
  min?: number;
  max?: number;
  step?: number;
  rows?: number;
  options?: { label: string; value: string }[];
  validation?: {
    minLength?: number;
    maxLength?: number;
    pattern?: string;
  };
}

export interface FormSchema {
  title: string;
  description?: string;
  fields: FormField[];
}

// Rule Types
export interface Rule {
  condition: string;
  action: string;
  result?: string;
}

export interface RuleSet {
  name: string;
  rules: Rule[];
  defaultResult?: string;
}
