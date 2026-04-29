# Mini BPM Platform - Architecture Guide

## Overview

The Mini BPM Platform is a single-tenant, low-code business process management system designed for pragmatic MVP development. It combines Flowable BPMN engine on the backend with a modern Next.js frontend for process design, execution, and monitoring.

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (Next.js)                      │
│  Dashboard │ Workflows │ Instances │ Tasks │ Forms │ Rules  │
│                    React + TypeScript                        │
└──────────────────────────┬──────────────────────────────────┘
                           │ REST API
                    HTTP/JSON (CORS)
┌──────────────────────────┴──────────────────────────────────┐
│                 Backend (Spring Boot)                        │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              REST Controllers                          │ │
│  │  Processes │ Instances │ Tasks │ Forms │ Rules │ Admin │ │
│  └─────────┬──────────────────────────────────────────────┘ │
│            │                                                  │
│  ┌─────────▼──────────────────────────────────────────────┐ │
│  │         Service Layer (Business Logic)                │ │
│  │ ProcessDefinitionService  ProcessInstanceService      │ │
│  │ UserTaskService           FormDefinitionService       │ │
│  │ RuleDefinitionService     DashboardService            │ │
│  └─────────┬──────────────────────────────────────────────┘ │
│            │                                                  │
│  ┌─────────▼──────────────────────────────────────────────┐ │
│  │         Data Access Layer (Repositories)              │ │
│  │ JPA Repositories for all entities                     │ │
│  └─────────┬──────────────────────────────────────────────┘ │
│            │                                                  │
│  ┌─────────▼──────────────────────────────────────────────┐ │
│  │      Flowable Engine Integration                      │ │
│  │ Process Deployment │ Process Execution │ Task Mgmt    │ │
│  └─────────┬──────────────────────────────────────────────┘ │
└────────────┼──────────────────────────────────────────────────┘
             │
    ┌────────┴────────┬──────────────────┐
    │                 │                  │
┌───▼──────┐  ┌──────▼─────┐  ┌────────▼───────┐
│  MySQL   │  │ Flowable   │  │   Email        │
│  (BPM)   │  │   DB       │  │   Service      │
└──────────┘  └────────────┘  └────────────────┘
```

## Backend Components

### 1. Controllers (`com.bpm.controller`)

REST API entry points handling HTTP requests/responses:

- **ProcessController**: Process definition CRUD and instance management
- **ProcessInstanceController**: Instance queries and history
- **UserTaskController**: Task operations (list, claim, complete)
- **FormController**: Form definition CRUD
- **RuleController**: Rule CRUD
- **DashboardController**: KPI statistics

**Key Pattern**: Controllers delegate to Services

### 2. Services (`com.bpm.service`)

Business logic and orchestration:

- **ProcessDefinitionService**: Process lifecycle (create, publish, deploy)
- **ProcessInstanceService**: Instance management and variable handling
- **UserTaskService**: Task claim, complete, list
- **FormDefinitionService**: Form CRUD and schema validation
- **RuleDefinitionService**: Rule CRUD and evaluation
- **DashboardService**: Dashboard stats aggregation

**Key Pattern**: Services use Repositories and Flowable API

### 3. Data Access (`com.bpm.repository`)

JPA repositories for database operations:

```java
// Example repository
public interface ProcessInstanceRepository extends JpaRepository<ProcessInstance, Long> {
    List<ProcessInstance> findByStatus(ProcessInstance.InstanceStatus status);
    Optional<ProcessInstance> findByFlowableProcessInstanceId(String id);
}
```

### 4. Entities (`com.bpm.entity`)

JPA domain objekter mapping to database:

```
ProcessDefinition ──────────┐
                            │
                      ProcessInstance ──────────┬─┬──→ UserTask
                                               │ │
                                    ExecutionLog │
                                                │
FormDefinition                  RuleDefinition ─┘
```

### 5. DTOs (`com.bpm.dto`)

Data Transfer Objects for API serialization:

- Separate request/response concerns from domain entities
- Prevent circular dependencies and lazy loading issues
- Enable versioning and evolution

### 6. Flowable Integration

**Process Deployment Flow**:
```
ProcessDefinition (JSON)
    ↓
Generate BPMN XML
    ↓
Flowable RepositoryService.deploy()
    ↓
Stored in Flowable DB
    ↓
Available for instantiation
```

**Process Execution Flow**:
```
RuntimeService.startProcessInstanceByKey()
    ↓
Creates Execution in Flowable
    ↓
Task instances created for User Tasks
    ↓
BusinessProcessInstance record created
    ↓
ExecutionLog entries tracked
    ↓
Task completion triggers process progression
```

## Frontend Architecture

### File Structure

```
src/
├── app/                          # Next.js App Router pages
│   ├── layout.tsx               # Root layout with nav
│   ├── page.tsx                 # Dashboard
│   ├── workflows/               # Process management
│   │   ├── page.tsx            # List
│   │   └── [id]/designer/page.tsx # Designer
│   ├── instances/               # Instance monitoring
│   │   ├── page.tsx            # List
│   │   └── [id]/page.tsx       # Detail
│   ├── tasks/                   # Task management
│   │   ├── page.tsx            # Inbox
│   │   └── [id]/page.tsx       # Task form
│   └── forms/                   # Form builder
│       └── page.tsx            # List/Create
│
├── components/                  # Reusable React components
├── lib/                         # Utilities and clients
│   ├── api.ts                  # REST client (axios)
│   ├── types.ts                # TypeScript interfaces
│   └── validation.ts           # Zod schemas
├── hooks/                      # Custom React hooks
│   └── useApi.ts              # API integration hooks
└── styles/                     # CSS (Tailwind)
```

### Key Concepts

**API Client** (`lib/api.ts`):
```typescript
export const processApi = {
  createProcessDefinition: (data) => apiClient.post('/processes', data),
  listProcessDefinitions: () => apiClient.get('/processes'),
  publishProcessDefinition: (id) => apiClient.post(`/processes/${id}/publish`, {}),
  // ...
}
```

**Custom Hooks** (`hooks/useApi.ts`):
```typescript
export const useProcesses = () => {
  const [processes, setProcesses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    fetchProcesses();
  }, []);
  
  return { processes, loading, error, refetch };
}
```

**Page Components**:
```typescript
export default function WorkflowsPage() {
  const { processes, loading, error, refetch } = useProcesses();
  // Render UI using data from hook
}
```

## Data Models

### Process Definition
```json
{
  "id": 1,
  "name": "Purchase Request",
  "version": 1,
  "status": "PUBLISHED",
  "definition": "{ BPMN JSON }",
  "bpmnXml": "<?xml BPMN 2.0 ?>",
  "createdAt": "2024-04-13T10:00:00Z"
}
```

### Process Instance
```json
{
  "id": 42,
  "processDefinitionId": 1,
  "flowableProcessInstanceId": "abc123",
  "status": "ACTIVE",
  "variables": {"requestedAmount": 500},
  "startedAt": "2024-04-13T10:30:00Z"
}
```

### User Task
```json
{
  "id": 99,
  "processInstanceId": 42,
  "taskName": "Manager Approval",
  "assignedTo": "john@company.com",
  "status": "PENDING",
  "formSchema": "{ form definition }",
  "formData": null,
  "createdAt": "2024-04-13T10:31:00Z"
}
```

## Request/Response Flow Example

### Create and Start a Process

**Client Request**:
```javascript
// 1. Create process definition
POST /api/processes
{
  "name": "Purchase Request",
  "definition": {"nodes": [], "edges": []}
}
// Response: ProcessDefinitionDTO { id: 1, status: 'DRAFT' }

// 2. Publish process
POST /api/processes/1/publish
// Response: ProcessDefinitionDTO { id: 1, status: 'PUBLISHED' }

// 3. Start instance
POST /api/processes/1/start
{"requestAmount": 500, "submitter": "jane@company.com"}
// Response: ProcessInstanceDTO { id: 42, status: 'ACTIVE' }

// 4. List tasks for instance
GET /api/tasks?processInstanceId=42
// Response: [UserTaskDTO { id: 99, taskName: 'Manager Approval' }]

// 5. Get task details
GET /api/tasks/99
// Response: UserTaskDTO with form schema

// 6. Complete task
POST /api/tasks/99/complete
{"formData": JSON.stringify({approved: true, comments: "OK"})}
// Response: UserTaskDTO { id: 99, status: 'COMPLETED' }
```

## Database Schema

**Key Tables**:

```sql
process_definitions
├── id (PK)
├── name
├── version
├── status (DRAFT/PUBLISHED/ARCHIVED)
├── definition (BPMN JSON)
└── bpmn_xml (BPMN 2.0 XML)

process_instances
├── id (PK)
├── process_definition_id (FK)
├── flowable_process_instance_id (unique)
├── status (ACTIVE/COMPLETED/FAILED)
├── variables (JSON)
└── started_at, completed_at

user_tasks
├── id (PK)
├── process_instance_id (FK)
├── flowable_task_id (unique)
├── task_name
├── assigned_to
├── status (PENDING/COMPLETED)
├── form_schema
├── form_data
└── due_date

form_definitions
├── id (PK)
├── name
├── version
├── schema (JSON)
└── created_at

rule_definitions
├── id (PK)
├── name
├── version
├── rules (JSON)
└── created_at

execution_logs
├── id (PK)
├── process_instance_id (FK)
├── event_type
├── event_data
└── timestamp
```

## Request Lifecycle

```
HTTP Request
    ↓
@RestController
    ↓
Request Mapping (@PostMapping, etc.)
    ↓
Validation (if needed)
    ↓
Service Layer
    ↓
Repository / Flowable API
    ↓
Database / Process Engine
    ↓
Response DTO
    ↓
@ResponseBody (JSON)
    ↓
HTTP Response
```

## Configuration

**Spring Boot** (`application.yml`):
- Database connection (MySQL)
- Flowable configuration
- Mail configuration
- Logging levels

**Flyway**: Database schema versioning and migrations

**Frontend** (`.env.local`):
- `NEXT_PUBLIC_API_URL`: Backend API endpoint

## Key Design Decisions

### 1. JSON-Based Process Definitions
- Process designers export JSON which is converted to BPMN XML
- Simpler for MVP than full BPMN editor
- Can evolve to visual designer later

### 2. Separate Business & Flowable DB
- Business tables (process_definitions, user_tasks) in MySQL
- Flowable maintains its own tables (acts_ru_process_instance, etc.)
- Allows independent scaling and debugging

### 3. Service Layer for All Business Logic
- Controllers are thin, just routing and validation
- Services contain orchestration logic
- Easy to test and reuse

### 4. DTOs for API Serialization
- Domain entities never directly exposed
- Prevents N+1 queries and circular refs
- Enables API versioning

### 5. React Hooks for Data Fetching
- `useProcesses()`, `useTasks()`, etc. encapsulate API calls
- Composable with loading/error states
- Easy to add caching later

## Scalability Considerations

### Current Limitations (MVP)
- Single backend instance
- Single database
- No process instance sharding
- No async processing beyond Flowable's job executor

### Future Enhancements
- Horizontal scaling via load balancer
- Database read replicas
- Process instance partitioning
- Message queue (RabbitMQ, Kafka) for async tasks
- Caching layer (Redis)

## Security Considerations (Future)

- **Authentication**: OAuth2 / OIDC integration
- **Authorization**: Role-based access control (RBAC)
- **Encryption**: TLS in transit, DB encryption at rest
- **Audit**: All operations logged
- **Rate Limiting**: API rate limits
- **Secrets Management**: Environment-based config

## Deployment Architecture

```
Docker Compose (Development)
└── MySQL + Backend + Frontend + MailHog

Kubernetes (Production)
├── Backend Pod (replicas)
├── Frontend Pod (replicas)
├── MySQL StatefulSet
└── Ingress Controller
```

## Monitoring & Observability

**Logging**:
- Spring Boot logs to stdout
- Next.js logs to stdout
- Docker compose captures and aggregates

**Metrics** (Future):
- Process execution metrics (Prometheus/Micrometer)
- Database metrics (MySQL)
- Frontend performance (Next.js analytics)

**Alerting** (Future):
- Failed process instances
- High task backlog
- Database connection pool exhaustion

## Testing Strategy

**Backend**:
- Unit tests for Services (mock repositories)
- Integration tests for Controllers (with test DB)
- Flowable integration tests

**Frontend**:
- Component tests (React Testing Library)
- Hook tests
- E2E tests (Cypress/Playwright)

## Troubleshooting Guide

**Process won't deploy**:
- Check BPMN XML generation logic
- Verify Flowable has proper database permissions
- Check logs for parsing errors

**Tasks not progressing**:
- Verify task completion API called correctly
- Check process execution flow in BPMN
- Inspect Flowable job executor logs

**Frontend can't reach backend**:
- Check CORS configuration in Spring Boot
- Verify `NEXT_PUBLIC_API_URL` environment variable
- Check network connectivity

---

**See README.md for operational guide**
