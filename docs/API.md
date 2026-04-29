# Mini BPM Platform - API Documentation

## Base URL

```
http://localhost:8080/api
```

## Authentication

Currently, no authentication is required (MVP). All endpoints are public.

## Response Format

All responses are JSON. Errors include status codes and messages.

### Success Response
```json
{
  "id": 1,
  "name": "Process Name",
  "status": "PUBLISHED",
  ...
}
```

### Error Response
```json
{
  "timestamp": "2024-04-13T10:00:00Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Invalid process definition"
}
```

## Endpoints

### Process Definitions

#### Create Process Definition
```http
POST /processes
Content-Type: application/json

{
  "name": "Purchase Request",
  "description": "Simple purchase approval",
  "definition": "{\"name\":\"Purchase Request\",\"nodes\":[],\"edges\":[]}"
}
```

**Response**: `201 Created`
```json
{
  "id": 1,
  "name": "Purchase Request",
  "version": 1,
  "status": "DRAFT",
  "description": "Simple purchase approval",
  "createdAt": "2024-04-13T10:00:00Z",
  "updatedAt": "2024-04-13T10:00:00Z"
}
```

#### List All Process Definitions
```http
GET /processes
```

**Response**: `200 OK`
```json
[
  {
    "id": 1,
    "name": "Purchase Request",
    "version": 1,
    "status": "DRAFT",
    ...
  },
  ...
]
```

#### Get Process Definition
```http
GET /processes/{id}
```

**Parameters**:
- `id` (path, required): Process definition ID

**Response**: `200 OK`
```json
{
  "id": 1,
  "name": "Purchase Request",
  "version": 1,
  "status": "DRAFT",
  "definition": "{...}",
  "description": "Simple purchase approval",
  "createdAt": "2024-04-13T10:00:00Z",
  "updatedAt": "2024-04-13T10:00:00Z"
}
```

#### Publish Process Definition
```http
POST /processes/{id}/publish
```

**Parameters**:
- `id` (path, required): Process definition ID

**Response**: `200 OK` - Returns updated ProcessDefinitionDTO with status "PUBLISHED" and Flowable deployment metadata.

```json
{
  "id": 1,
  "name": "Purchase Request",
  "version": 1,
  "status": "PUBLISHED",
  "flowableDeploymentId": "2501",
  "flowableProcessDefinitionId": "purchase_request:1:2504",
  "flowableProcessDefinitionKey": "purchase_request",
  "flowableProcessDefinitionVersion": 1,
  "publishedAt": "2024-04-13T10:15:00Z"
}
```

#### Delete Process Definition
```http
DELETE /processes/{id}
```

**Parameters**:
- `id` (path, required): Process definition ID (must be DRAFT)

**Response**: `204 No Content`

### Process Instances

#### Start Process Instance
```http
POST /processes/{id}/start
Content-Type: application/json

{
  "requestAmount": 500,
  "submitter": "jane@company.com"
}
```

**Parameters**:
- `id` (path, required): Process definition ID (must be PUBLISHED)

**Body**: JSON object with process variables

**Response**: `201 Created`
```json
{
  "id": 42,
  "processDefinitionId": 1,
  "status": "ACTIVE",
  "variables": "{\"requestAmount\":500,\"submitter\":\"jane@company.com\"}",
  "startedAt": "2024-04-13T10:30:00Z",
  "completedAt": null
}
```

#### List Process Instances
```http
GET /processes/{id}/instances
```

**Parameters**:
- `id` (path, required): Process definition ID

**Response**: `200 OK`
```json
[
  {
    "id": 42,
    "processDefinitionId": 1,
    "status": "ACTIVE",
    ...
  },
  ...
]
```

#### Get Process Instance
```http
GET /instances/{id}
```

**Parameters**:
- `id` (path, required): Instance ID

**Response**: `200 OK` - ProcessInstanceDTO

#### Get Execution History
```http
GET /instances/{id}/history
```

**Parameters**:
- `id` (path, required): Instance ID

**Response**: `200 OK`
```json
[
  {
    "eventType": "PROCESS_STARTED",
    "timestamp": "2024-04-13T10:30:00Z",
    "eventData": null
  },
  {
    "eventType": "TASK_CREATED",
    "timestamp": "2024-04-13T10:30:05Z",
    "eventData": "Manager Approval"
  },
  ...
]
```

#### Get Process Variables
```http
GET /instances/{id}/variables
```

**Parameters**:
- `id` (path, required): Instance ID

**Response**: `200 OK`
```json
{
  "requestAmount": 500,
  "submitter": "jane@company.com",
  "approvalStatus": "pending"
}
```

### User Tasks

#### List Pending Tasks
```http
GET /tasks
```

**Query Parameters** (optional):
- `status`: Filter by status (PENDING, COMPLETED, FAILED)
- `assignedTo`: Filter by user

**Response**: `200 OK`
```json
[
  {
    "id": 99,
    "processInstanceId": 42,
    "taskName": "Manager Approval",
    "assignedTo": null,
    "status": "PENDING",
    "formSchema": "{...}",
    "formData": null,
    "dueDate": null,
    "createdAt": "2024-04-13T10:30:05Z",
    "completedAt": null
  },
  ...
]
```

#### Get Task Details
```http
GET /tasks/{id}
```

**Parameters**:
- `id` (path, required): Task ID

**Response**: `200 OK` - UserTaskDTO

#### Claim Task
```http
POST /tasks/{id}/claim
```

**Parameters**:
- `id` (path, required): Task ID
- `userId` (query, required): User ID claiming the task

**Response**: `200 OK` - Returns updated UserTaskDTO with assignedTo set

#### Complete Task
```http
POST /tasks/{id}/complete
Content-Type: application/json

{
  "formData": "{\"approved\":true,\"comments\":\"Looks good\"}"
}
```

**Parameters**:
- `id` (path, required): Task ID

**Body**:
```json
{
  "formData": "JSON string of form response"
}
```

**Response**: `200 OK` - Returns updated UserTaskDTO with status "COMPLETED"

### Admin Identities

These endpoints manage the lightweight application identity registry used by workflow user task assignees and candidate groups. They do not replace Flowable runtime task execution.

#### List Users
```http
GET /admin/users
```

**Response**: `200 OK` - Array of AppUserDTO

#### Create User
```http
POST /admin/users
Content-Type: application/json

{
  "id": "maria.rossi",
  "displayName": "Maria Rossi",
  "email": "maria.rossi@example.local",
  "active": true,
  "groupIds": ["managers"]
}
```

**Response**: `201 Created` - AppUserDTO

#### Update User
```http
PUT /admin/users/{userId}
Content-Type: application/json

{
  "displayName": "Maria Rossi",
  "email": "maria.rossi@example.local",
  "active": true,
  "groupIds": ["finance", "managers"]
}
```

**Response**: `200 OK` - Updated AppUserDTO

#### Delete User
```http
DELETE /admin/users/{userId}
```

**Response**: `204 No Content`

#### List Groups
```http
GET /admin/groups
```

**Response**: `200 OK` - Array of UserGroupDTO

#### Create Group
```http
POST /admin/groups
Content-Type: application/json

{
  "id": "finance",
  "name": "Finance",
  "description": "Finance approval team",
  "active": true
}
```

**Response**: `201 Created` - UserGroupDTO

#### Update Group
```http
PUT /admin/groups/{groupId}
Content-Type: application/json

{
  "name": "Finance",
  "description": "Finance approval team",
  "active": true
}
```

**Response**: `200 OK` - Updated UserGroupDTO

#### Delete Group
```http
DELETE /admin/groups/{groupId}
```

**Response**: `204 No Content`

### Forms

#### Create Form Definition
```http
POST /forms
Content-Type: application/json

{
  "name": "Purchase Request Form",
  "description": "Form for submitting purchase requests",
  "schema": "{\"title\":\"Purchase Request\",\"fields\":[{\"name\":\"description\",\"label\":\"Item Description\",\"type\":\"textarea\",\"required\":true}]}"
}
```

**Response**: `201 Created` - FormDefinitionDTO

#### List Form Definitions
```http
GET /forms
```

**Response**: `200 OK` - Array of FormDefinitionDTO

#### Get Form Definition
```http
GET /forms/{id}
```

**Parameters**:
- `id` (path, required): Form ID

**Response**: `200 OK` - FormDefinitionDTO

#### Update Form Definition
```http
PUT /forms/{id}
Content-Type: application/json

{
  "name": "Updated Name",
  "description": "Updated description",
  "schema": "{...}"
}
```

**Parameters**:
- `id` (path, required): Form ID

**Response**: `200 OK` - Updated FormDefinitionDTO

#### Delete Form Definition
```http
DELETE /forms/{id}
```

**Parameters**:
- `id` (path, required): Form ID

**Response**: `204 No Content`

### Rules

#### Create Rule Definition
```http
POST /rules
Content-Type: application/json

{
  "name": "Amount-Based Routing",
  "description": "Route approval requests based on amount",
  "rules": "{\"rules\":[{\"condition\":\"amount > 500\",\"action\":\"route_to_director\"},{\"condition\":\"amount <= 500\",\"action\":\"route_to_manager\"}]}"
}
```

**Response**: `201 Created` - RuleDefinitionDTO

#### List Rule Definitions
```http
GET /rules
```

**Response**: `200 OK` - Array of RuleDefinitionDTO

#### Get Rule Definition
```http
GET /rules/{id}
```

**Parameters**:
- `id` (path, required): Rule ID

**Response**: `200 OK` - RuleDefinitionDTO

#### Delete Rule Definition
```http
DELETE /rules/{id}
```

**Parameters**:
- `id` (path, required): Rule ID

**Response**: `204 No Content`

### Dashboard

#### Get Dashboard Statistics
```http
GET /dashboard/stats
```

**Response**: `200 OK`
```json
{
  "totalProcesses": 5,
  "activeInstances": 12,
  "completedInstances": 48,
  "failedInstances": 2,
  "pendingTasks": 7
}
```

## Example Workflow

### 1. Create a Process Definition
```bash
curl -X POST http://localhost:8080/api/processes \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Approval Process",
    "description": "Simple approval workflow",
    "definition": "{\"name\":\"Approval\",\"nodes\":[],\"edges\":[]}"
  }'
```

### 2. Publish the Process
```bash
curl -X POST http://localhost:8080/api/processes/1/publish
```

### 3. Start an Instance
```bash
curl -X POST http://localhost:8080/api/processes/1/start \
  -H "Content-Type: application/json" \
  -d '{
    "requester": "john@example.com",
    "amount": 1000
  }'
```

### 4. List Tasks
```bash
curl -X GET http://localhost:8080/api/tasks
```

### 5. Complete a Task
```bash
curl -X POST http://localhost:8080/api/tasks/1/complete \
  -H "Content-Type: application/json" \
  -d '{
    "formData": "{\"decision\":\"approved\",\"reason\":\"Looks good\"}"
  }'
```

## Error Codes

| Code | Meaning |
|------|---------|
| 200  | OK - Request successful |
| 201  | Created - Resource created successfully |
| 204  | No Content - Success with no response body |
| 400  | Bad Request - Invalid input |
| 404  | Not Found - Resource not found |
| 409  | Conflict - Process already published or similar conflict |
| 500  | Internal Server Error - Server error |

## Rate Limiting

Currently, no rate limiting is implemented (MVP).

## Pagination

Currently, no pagination is implemented. All endpoints return full result sets.

## CORS

CORS is enabled for all origins (`@CrossOrigin(origins = "*")`).

## Content Negotiation

All endpoints accept and return `application/json`.

## Versioning

API is currently at version 1 (no version prefix). Future versions may use `/api/v2/...`

---

**For implementation details, see ARCHITECTURE.md**
