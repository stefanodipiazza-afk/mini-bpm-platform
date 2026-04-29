# Quick Start Guide

Get the Mini BPM Platform up and running in 5 minutes.

## Option 1: Docker Compose (Easiest - Recommended)

### Prerequisites
- Docker and Docker Compose installed
- 5 GB free disk space

### Steps

```bash
# 1. Navigate to project directory
cd /path/to/mini-bpm-platform

# 2. Start all services
docker-compose up -d

# 3. Wait for services to be healthy (~30-60 seconds)
docker-compose ps

# 4. Access the platform
- Frontend: http://localhost:3000
- Backend API: http://localhost:8080/api  
- Mail UI: http://localhost:8025 (test emails)

# 5. View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# 6. Stop services when done
docker-compose down
```

### Troubleshooting

**Port already in use?**
```bash
# Change ports in docker-compose.yml
# Then restart
docker-compose down
docker-compose up -d
```

**Backend not connected to MySQL?**
```bash
# Check MySQL health
docker-compose ps mysql

# Restart MySQL
docker-compose restart mysql
docker-compose restart backend
```

## Option 2: Local Development Setup

### Prerequisites

**Backend:**
- Java 21 JDK
- Maven 3.9+
- MySQL 8.0

**Frontend:**
- Node.js 20+
- npm

### Backend Setup

```bash
cd backend

# 1. Edit src/main/resources/application.yml
# Update MySQL connection details:
#   spring.datasource.url: jdbc:mysql://localhost:3306/mini_bpm
#   spring.datasource.username: YOUR_USERNAME
#   spring.datasource.password: YOUR_PASSWORD

# 2. Create database
mysql -u root -e "CREATE DATABASE mini_bpm;"
mysql -u root -e "CREATE USER 'bpm_user'@'localhost' IDENTIFIED BY 'bpm_password';"
mysql -u root -e "GRANT ALL PRIVILEGES ON mini_bpm.* TO 'bpm_user'@'localhost';"

# 3. Build and run
mvn clean install
mvn spring-boot:run

# Backend available at http://localhost:8080
# Swagger available at http://localhost:8080/swagger-ui.html (if added)
```

### Frontend Setup

```bash
cd frontend

# 1. Install dependencies
npm install

# 2. Create .env.local (optional)
echo "NEXT_PUBLIC_API_URL=http://localhost:8080/api" > .env.local

# 3. Run development server
npm run dev

# Frontend available at http://localhost:3000
```

## Creating Your First Workflow

### 1. Create a Process Definition

Visit http://localhost:3000/workflows and click "New Workflow"

```json
{
  "name": "Simple Approval",
  "description": "A simple approval process",
  "definition": {
    "name": "Simple Approval",
    "nodes": [
      {"id": "start", "type": "StartEvent", "label": "Start"},
      {"id": "approve", "type": "UserTask", "label": "Approve Request"},
      {"id": "end", "type": "EndEvent", "label": "End"}
    ],
    "edges": [
      {"source": "start", "target": "approve"},
      {"source": "approve", "target": "end"}
    ]
  }
}
```

Click "Create"

### 2. Publish the Process

In the workflows list, click the "Publish" button (play icon) on your new process.

Status changes from "DRAFT" to "PUBLISHED"

### 3. Create a Form

Visit http://localhost:3000/forms and click "New Form"

```json
{
  "name": "Approval Form",
  "description": "Simple approval decision",
  "schema": {
    "title": "Approval",
    "fields": [
      {
        "name": "decision",
        "label": "Do you approve?",
        "type": "select",
        "required": true,
        "options": [
          {"label": "I approve", "value": "approved"},
          {"label": "Needs revision", "value": "revision"},
          {"label": "I reject", "value": "rejected"}
        ]
      },
      {
        "name": "comments",
        "label": "Comments",
        "type": "textarea",
        "required": false
      }
    ]
  }
}
```

Click "Create"

### 4. Start a Process Instance

Visit http://localhost:3000/workflows

Click the workflow you created. You'll see a "Start" button.

Click it to start a new instance.

### 5. Complete a Task

Visit http://localhost:3000/tasks

You'll see a pending "Approve Request" task.

Click "Open" and fill out the form.

Click "Complete Task"

### 6. Monitor Progress

Visit http://localhost:3000/instances

Select your workflow and see the instance details.

View execution history and process variables.

## Common Tasks

### Check Backend Logs

**Docker:**
```bash
docker-compose logs -f backend
```

**Local:**
```bash
# Terminal where you ran `mvn spring-boot:run`
# Logs display in real-time
```

### Access Database

**Docker:**
```bash
docker exec -it mini-bpm-platform_mysql_1 mysql -u bpm_user -p mini_bpm
```

**Local:**
```bash
mysql -u bpm_user -p mini_bpm
```

### Reset Database

**Docker:**
```bash
docker-compose down -v  # -v removes volumes
docker-compose up -d    # Fresh start with clean DB
```

**Local:**
```bash
# Drop and recreate database
mysql -u root -e "DROP DATABASE mini_bpm; CREATE DATABASE mini_bpm;"
# Restart backend to run migrations
```

### View Test Emails

Mailhog UI: http://localhost:8025

(Only in Docker setup)

## API Quick Test

### Create Process
```bash
curl -X POST http://localhost:8080/api/processes \
  -H "Content-Type: application/json" \
  -d '{
    "name":"Test Process",
    "definition":"{\"name\":\"Test\",\"nodes\":[],\"edges\":[]}"
  }'
# Returns: {"id": 1, "status": "DRAFT", ...}
```

### List Processes
```bash
curl http://localhost:8080/api/processes
# Returns: [{"id": 1, "name": "Test Process", ...}]
```

### Get Dashboard Stats
```bash
curl http://localhost:8080/api/dashboard/stats
# Returns: {"totalProcesses": 1, "activeInstances": 0, ...}
```

## Next Steps

1. **Explore the UI**: Visit each page (Dashboard, Workflows, Tasks, Instances)
2. **Create more workflows**: Try multi-step processes
3. **Read the docs**: Check ARCHITECTURE.md and API.md
4. **Customize forms**: Create complex forms with validation
5. **Deploy**: Use docker-compose in production-like environment

## Stopping Services

```bash
# Docker
docker-compose down

# Local (Ctrl+C in each terminal)
# Backend: Stop the `mvn spring-boot:run` process
# Frontend: Stop the `npm run dev` process
```

## Further Help

- **README.md**: Full project documentation
- **docs/ARCHITECTURE.md**: System design and components
- **docs/API.md**: Complete API reference
- **Backend logs**: Check Spring Boot logs for errors
- **Frontend console**: Open browser DevTools (F12) for errors

---

Enjoy building workflows! 🚀
