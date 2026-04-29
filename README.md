<<<<<<< HEAD
# Mini BPM Platform - Low-Code Business Process Management

A pragmatic, single-tenant BPM platform MVP inspired by Appian. Features process designer, execution engine, task management, form builder, and rule engine.

## Features

- **Process Management**
  - Visual designer for workflow definition (React Flow-based)
  - BPMN 2.0-inspired process execution via Flowable
  - Process versioning and publishing
  - Execution history and audit logs

- **Task Orchestration**
  - User task inbox with filtering
  - Form-based task completion
  - Task assignment and claims
  - Minimal admin registry for users and groups
  - Execution timeline monitoring

- **Form Builder**
  - JSON schema-based forms
  - Multiple field types (text, email, number, select, date, etc.)
  - Built-in validation (Zod)
  - Live form preview

- **Rules Engine**
  - JSON-based rule definitions
  - Expression-based routing
  - Conditional task routing

- **Monitoring**
  - Real-time dashboard with KPIs
  - Process instance monitoring
  - Execution history
  - Variable inspection

## Architecture

```
mini-bpm-platform/
├── backend/              # Java 21 + Spring Boot + Flowable
├── frontend/             # Next.js + React + TypeScript
├── docker-compose.yml    # Local development environment
├── seed-data/            # Sample processes and forms
└── docs/                 # Architecture and API documentation
```

### Tech Stack

**Backend:**
- Java 21 + Spring Boot 3.3
- Flowable 7.0 (BPMN 2.0 engine)
- JPA/Hibernate + MySQL 8.0
- Maven, Flyway migrations

**Frontend:**
- Next.js 14 (App Router)
- React + TypeScript
- React Hook Form + Zod (validation)
- React Flow (process designer)
- Tailwind CSS

**Infrastructure:**
- Docker & Docker Compose
- MySQL for process/task data
- Flowable's internal DB (H2 or shared MySQL)

## Quick Start

### Prerequisites

- Docker & Docker Compose
- OR: Java 21, Node.js 20+, MySQL 8.0

### Option 1: Docker Compose (Recommended)

```bash
# Clone or download the project
cd mini-bpm-platform

# Start all services
docker-compose up -d

# Access the platform
- Frontend: http://localhost:3000
- Backend API: http://localhost:8080/api
- Mail UI: http://localhost:8025

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Stop services
docker-compose down
```

### Option 2: Local Development

**Backend:**
```bash
cd backend

# Install dependencies and build
mvn clean install

# Configure database in src/main/resources/application.yml
# Update spring.datasource properties

# Run
mvn spring-boot:run
# Backend available at http://localhost:8080
```

**Frontend:**
```bash
cd frontend

# Install dependencies
npm install

# Set API URL (optional, defaults to http://localhost:8080/api)
export NEXT_PUBLIC_API_URL=http://localhost:8080/api

# Run dev server
npm run dev
# Frontend available at http://localhost:3000
```

## API Endpoints

### Process Definitions
```
POST   /api/processes                 Create process definition
GET    /api/processes                 List all processes
GET    /api/processes/{id}            Get process details
POST   /api/processes/{id}/publish    Publish a draft process
DELETE /api/processes/{id}            Delete draft process
POST   /api/processes/{id}/start      Start new instance
```

### Process Instances
```
POST   /api/instances                 (via /api/processes/{id}/start)
GET    /api/instances/{id}            Get instance details
GET    /api/instances/{id}/history    Get execution history
GET    /api/instances/{id}/variables  Get process variables
```

### User Tasks
```
GET    /api/tasks                     List pending tasks
GET    /api/tasks/{id}                Get task details
POST   /api/tasks/{id}/claim          Claim task for user
POST   /api/tasks/{id}/complete       Complete task with form data
```

### Admin Identities
```
GET    /api/admin/users               List application users
POST   /api/admin/users               Create user
PUT    /api/admin/users/{userId}      Update user
DELETE /api/admin/users/{userId}      Delete user
GET    /api/admin/groups              List groups
POST   /api/admin/groups              Create group
PUT    /api/admin/groups/{groupId}    Update group
DELETE /api/admin/groups/{groupId}    Delete group
```

### Forms
```
POST   /api/forms                     Create form definition
GET    /api/forms                     List forms
GET    /api/forms/{id}                Get form definition
PUT    /api/forms/{id}                Update form
DELETE /api/forms/{id}                Delete form
```

### Rules
```
POST   /api/rules                     Create rule definition
GET    /api/rules                     List rules
GET    /api/rules/{id}                Get rule definition
DELETE /api/rules/{id}                Delete rule
```

### Dashboard
```
GET    /api/dashboard/stats           Get dashboard statistics
```

## Use Cases

### 1. Purchase Request Approval

Create a purchase request process with approval routing based on amount:
- User submits request via form
- Rules engine routes to appropriate approver
- Approver reviews and accepts/rejects
- Automated email notification

**Process:** See `seed-data/processes/purchase_approval.json`

### 2. API Data Synchronization

Orchestrate external API calls with error handling:
- Accept data via REST task
- Transform via script task
- Call external API
- Handle failures with retry logic
- Update database on completion

### 3. Customer Onboarding

Multi-step human workflow with form validation:
- Collect customer data (form)
- Verify information (manual task)
- Setup account (service task)
- Send welcome email (notification)

## Database Schema

Key tables:
- `process_definitions` — Workflow templates
- `process_instances` — Running workflow instances
- `user_tasks` — Human tasks
- `identity_users`, `identity_groups`, `identity_user_groups` — Admin-managed task identities
- `form_definitions` — Reusable form templates
- `rule_definitions` — Decision rules
- `execution_logs` — Audit trail

See `backend/src/main/resources/db/migration/V1__Initial_schema.sql`

## Configuration

### Backend (`application.yml`)
```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/mini_bpm
    username: bpm_user
    password: bpm_password
  mail:
    host: localhost
    port: 1025
```

### Frontend (`.env.local`)
```
NEXT_PUBLIC_API_URL=http://localhost:8080/api
```

## Development

### Adding a New API Endpoint

1. Create DTO in `backend/src/main/java/com/bpm/dto/`
2. Add repository method in `backend/src/main/java/com/bpm/repository/`
3. Create business logic in `backend/src/main/java/com/bpm/service/`
4. Add controller method in `backend/src/main/java/com/bpm/controller/`
5. Update frontend API client in `frontend/src/lib/api.ts`
6. Create frontend page/component

### Adding a New Page

1. Create Next.js page in `frontend/src/app/[page]/page.tsx`
2. Use hooks from `frontend/src/hooks/useApi.ts`
3. Import API clients from `frontend/src/lib/api.ts`
4. Use TypeScript types from `frontend/src/lib/types.ts`
5. Add navigation link to `frontend/src/app/layout.tsx`

## Testing

### Backend
```bash
cd backend
mvn test
```

### Frontend
```bash
cd frontend
npm test
```

## Deployment

### Docker Build & Push
```bash
docker build -t mini-bpm-backend:latest ./backend
docker build -t mini-bpm-frontend:latest ./frontend

docker push your-registry/mini-bpm-backend:latest
docker push your-registry/mini-bpm-frontend:latest
```

### Run in Production
Update `docker-compose.yml` with:
- Production database credentials
- API/frontend URLs
- SSL certificates
- Resource limits

```bash
docker-compose -f docker-compose.yml up -d
```

## Limitations (MVP Scope)

- Single-tenant only
- No multi-user RBAC
- No sub-processes or complex gateways (parallel, inclusive)
- Simple rule engine (not production-grade)
- No workflow versioning beyond basic versioning
- No horizontal scaling for process execution
- Minimal error recovery

## Future Enhancements

- [ ] Visual rule builder UI
- [ ] Drag-drop form designer
- [ ] Process templates and snippets
- [ ] Advanced gateways (parallel, inclusive, loop)
- [ ] Sub-processes
- [ ] Process analytics and heatmaps
- [ ] User management and role-based access
- [ ] Multi-tenancy support
- [ ] REST/webhook notifications
- [ ] Attachment support in tasks
- [ ] Process simulation and what-if analysis
- [ ] GraphQL API

## Troubleshooting

### Backend won't connect to MySQL
- Ensure MySQL is running and accessible
- Check credentials in `application.yml`
- Verify database `mini_bpm` exists

### Frontend can't reach backend
- Check backend is running on `localhost:8080`
- Update `NEXT_PUBLIC_API_URL` environment variable
- Verify CORS is enabled in controllers

### Flyway migration fails
- Check MySQL user has DDL permissions
- Ensure `db/migration` files are in classpath
- Check SQL syntax in migration files

### Tasks not appearing in inbox
- Ensure process instance is running and waiting on a user task
- Check the assignee or candidate group configured on the workflow user task
- Configure users and groups from `Admin -> Identity Admin`
- Use the Task Inbox filters for the same user or group

## Support

For issues, questions, or contributions:
1. Check existing issues
2. Create detailed bug reports with reproduction steps
3. Submit pull requests with tests

## License

MIT License - See LICENSE file

## Architecture Overview

See `docs/ARCHITECTURE.md` for detailed design decisions and component interactions.
=======
# mini-bpm-platform
Lightweight BPM platform inspired by Appian, built with Spring Boot, React and Docker.
>>>>>>> 6e3bd05c5a788260824136c1d04ed2ab7e3480fa
