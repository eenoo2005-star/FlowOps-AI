# FlowOps AI

**Enterprise Workflow / BPM / Operations Platform**

FlowOps AI is a full-stack enterprise workflow management platform for internal company requests, approvals, notifications, analytics, permissions, and administration.

It was built as a production-quality portfolio project to demonstrate real business application engineering using Laravel, React, TypeScript, PostgreSQL, Redis, Docker, and role-based access control.

> Portfolio status: feature-complete for presentation. Future enterprise features are listed in the roadmap.

---

## Preview

![FlowOps AI Dashboard](docs/assets/screenshots/01-dashboard-light.png)

![FlowOps AI Internal Request Dialog](docs/assets/screenshots/04-create-request-dialog.png)

![FlowOps AI Administration](docs/assets/screenshots/08-administration.png)

---

## Demo Video

Add the final 60–90 second demo video here after recording.

Suggested filename:

```text
docs/assets/video/flowops-ai-demo.mp4
```

---

## What FlowOps AI Does

FlowOps AI helps organizations replace manual internal approval processes with a structured workflow system.

Employees can create requests, workflows route those requests to the correct approvers, approvers approve or reject from their inbox, notifications keep users informed, and analytics give management operational visibility.

---

## Core Features

- Authentication
- Departments management
- Employees management
- Request types
- Workflow builder
- Internal request creation
- Approval engine
- Approval inbox
- Approve / reject flow
- Notifications and notification bell
- SLA reminders and overdue escalation
- Analytics dashboard
- Workspace search
- Security module
- Enterprise administration
- Roles and permissions
- Audit logs
- Light and dark mode
- Docker production setup
- Health endpoint

---

## Tech Stack

### Frontend

- React
- TypeScript
- Vite
- Tailwind CSS
- React Router
- React Query
- Framer Motion
- Lucide Icons

### Backend

- Laravel 12
- PostgreSQL
- Redis
- Docker
- Queue worker
- Scheduler
- JWT authentication
- Spatie Permission

---

## Architecture Overview

```text
React + TypeScript Frontend
        ↓
Laravel REST API
        ↓
PostgreSQL Database
        ↓
Redis Queue / Scheduler
        ↓
Notifications, SLA reminders, analytics and workflow automation
```

---

## Main Workflow

```text
Employee
  ↓
Create Request
  ↓
Workflow Engine
  ↓
Approval Tasks
  ↓
Approval Inbox
  ↓
Approve / Reject
  ↓
Completed / Rejected
```

---

## Enterprise Administration

FlowOps AI includes an administration area for managing:

- Roles
- Permissions
- Audit logs
- System and workspace settings placeholders

This demonstrates enterprise access-control thinking and prepares the project for larger SaaS-style expansion.

---

## Local Setup

```powershell
git clone <your-repository-url>
cd FlowOps-AI
docker compose up -d --build
```

Health check:

```text
http://localhost:8080/api/health
```

---

## Verification

Run the portfolio verification script:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\portfolio\verify-portfolio.ps1
```

---

## Portfolio Notes

This project demonstrates:

- Full-stack product engineering
- Enterprise workflow modeling
- Permission-based system design
- Frontend state management
- Backend API development
- Dockerized deployment
- Debugging and production-readiness discipline
- Professional documentation and presentation

---

## Roadmap

These features are intentionally kept as future scope so the portfolio version stays focused:

- Advanced BPM
- AI assistant
- Reporting center
- Multi-workspace tenancy
- API tokens
- Advanced session management
- Feature flags
- Branding system

---

## Author

**Shaheen Idris**  
Software Engineer — Libya  
Full-stack development, Laravel, React, TypeScript, Docker, PostgreSQL, enterprise systems, workflow automation.
