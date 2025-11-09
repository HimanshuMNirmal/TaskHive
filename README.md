# TaskHive

**MERN Stack · JWT · Redux · Docker · Free-to-start hosting options**

## Project Overview

TaskHive is a full-featured task management platform built with the MERN stack (MongoDB, Express, React, Node.js). It supports team collaboration, role-based access, deadlines and reminders, task assignment, and dynamic dashboards powered by Redux. Authentication uses JWT (JSON Web Tokens). The application is containerized with Docker and prepared for production deployment on AWS EC2.

This README documents how the project is structured, how to set it up locally and for production, what architectural decisions were made, and recommended next steps for scaling or extension.

---

## Table of Contents

1. [Features](#features)
2. [Tech Stack](#tech-stack)
3. [Architecture Overview](#architecture-overview)
4. [Repository Structure](#repository-structure)
5. [Prerequisites](#prerequisites)
6. [Environment Variables](#environment-variables)
7. [Local Development Setup (Dev)](#local-development-setup-dev)
8. [Running Tests](#running-tests)
9. [Docker Setup (Production-ready)](#docker-setup-production-ready)
10. [Free-to-start hosting options (no EC2 required)](#free-to-start-hosting-options-no-ec2-required)
11. [Authentication & Security](#authentication--security)
12. [Redux and Frontend Patterns](#redux-and-frontend-patterns)
13. [API Endpoints](#api-endpoints)
14. [Database Schema (Collections)](#database-schema-collections)
15. [Monitoring, Logging, and Backups](#monitoring-logging-and-backups)
16. [Troubleshooting & Tips](#troubleshooting--tips)
17. [Contributing](#contributing)
18. [License](#license)

---

## Features

* User signup / login with secure password hashing and JWT authentication
* Role-based access (Admin, Manager, Member) and team management
* Create, assign, prioritize, comment on, and track tasks
* Deadlines, reminders, and task status (To Do, In Progress, Review, Done)
* Team dashboards and filters (by user, priority, status, due date)
* Real-time UI refresh (polling or WebSocket option)
* Redux for predictable client state management
* REST API with clear separation of concerns (controllers, services, models)
* Dockerized for consistent deployment

---

## Tech Stack

* Frontend: React (Create React App or Vite), Redux, React Router, Axios
* Backend: Node.js, Express.js
* Database: MongoDB (Atlas or self-hosted)
* Auth: JWT for stateless authentication
* Containerization: Docker, Docker Compose
* Hosting: Free-to-start providers for quick deployment (Vercel, Netlify for frontend; Render, Fly, Railway for backend). Optionally AWS EC2 for full control.
* Dev Tools: ESLint, Prettier, Jest (frontend & backend tests), Supertest

---

## Architecture Overview

The app follows a standard separation of concerns:

* **client/** — React single-page application (UI, components, Redux slices)
* **server/** — Express REST API (routes, controllers, models, middleware)
* **infra/** — Dockerfiles, docker-compose, deployment helpers, nginx config

Flow:

1. Client makes HTTP requests to the server (protected routes include Authorization header with `Bearer <token>`).
2. Server verifies JWT and authorizes requests.
3. Server accesses MongoDB to read/write tasks, users, teams.
4. Server responds with JSON; client updates Redux store.

---

## Repository Structure

```
/ (root)
├─ client/                 # React app
│  ├─ public/
│  └─ src/
│     ├─ components/
│     ├─ features/         # Redux slices (RTK) grouped by domain
│     ├─ pages/
│     ├─ app/              # store configuration, rootReducer
│     └─ utils/
├─ server/
│  ├─ src/
│  │  ├─ controllers/
│  │  ├─ routes/
│  │  ├─ models/          # Mongoose schemas
│  │  ├─ services/        # Business logic
│  │  ├─ middleware/      # auth, error handlers
│  │  ├─ config/
│  │  └─ index.js
│  └─ Dockerfile
├─ infra/
│  ├─ docker-compose.yml
│  └─ nginx.conf
├─ .env.example
├─ .gitignore
└─ README.md
```

---

## Prerequisites

* Node.js >= 18
* npm or yarn
* Docker & Docker Compose (for containerized setup)
* MongoDB (local or Atlas)
* An AWS account (for EC2 deployment)

---

## Environment Variables

Create `.env` files in `server/` and `client/` (or at repo root depending on setup).

**Example `server/.env`**

```
PORT=4000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/taskhive
JWT_SECRET=your_very_strong_secret_here
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:3000
```

**Example `client/.env` (prefix `REACT_APP_` for Create React App)**

```
REACT_APP_API_URL=http://localhost:4000/api
```

> Never commit `.env` with secrets. Use `.env.example` to document required variables.

---

## Local Development Setup (Dev)

### 1) Clone repo

```bash
git clone https://github.com/<your-username>/taskhive.git
cd taskhive
```

### 2) Backend setup

```bash
cd server
cp .env.example .env   # then edit .env
npm install
npm run dev             # nodemon for development
```

Server default: `http://localhost:4000`

### 3) Frontend setup

```bash
cd ../client
cp .env.example .env   # set REACT_APP_API_URL
npm install
npm start               # runs at http://localhost:3000
```

### 4) Seed admin user (optional)

Place a script in `server/scripts/seedAdmin.js` to create an admin account and run:

```bash
node scripts/seedAdmin.js
```

---

## Running Tests

Use Jest and Supertest for backend integration tests and React Testing Library for frontend.

**Server tests**

```bash
cd server
npm test
```

**Client tests**

```bash
cd client
npm test
```

Add CI integration with GitHub Actions to run tests on each PR.

---

## Docker Setup (Production-ready)

This repo includes Dockerfiles for `server` and `client` and an `infra/docker-compose.yml` for local multi-container testing.

**server/Dockerfile (example)**

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
ENV NODE_ENV=production
CMD ["node", "dist/index.js"]
```

**client/Dockerfile (example)**

```dockerfile
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:stable-alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY infra/nginx.conf /etc/nginx/conf.d/default.conf
```

**docker-compose.yml (example for dev/prod mix)**

```yaml
version: '3.8'
services:
  mongo:
    image: mongo:6
    volumes:
      - mongo_data:/data/db
  server:
    build: ./server
    env_file:
      - ./server/.env
    ports:
      - '4000:4000'
    depends_on:
      - mongo
  client:
    build: ./client
    ports:
      - '80:80'
    depends_on:
      - server

volumes:
  mongo_data:
```

Build and run:

```bash
docker-compose up --build -d
```

---

## Free-to-start hosting options (no EC2 required)

If you'd rather avoid provisioning an EC2 VM and want a totally free (to start) option, here are practical alternatives that let you deploy quickly with minimal cost and maintenance.

- Frontend (static React build)
  - Vercel — great for React/Vite apps; connects to GitHub and auto-deploys. Free for hobby projects and includes automatic HTTPS.
  - Netlify — similar feature set and free tier for static sites.
  - GitHub Pages — free for static sites (good for single-page apps if you configure a 404 fallback for client-side routing).

Quick steps (example using Vercel):
1. Push your repo to GitHub.
2. Create a Vercel account and "Import Project" → select the repo.
3. Set the build command (e.g. `npm run build`) and the output directory (`build` or `dist` for Vite).
4. Add environment variables (e.g. `REACT_APP_API_URL`) in the Vercel dashboard.
5. Deploy — Vercel provides an HTTPS URL automatically.

- Backend & database
  - MongoDB Atlas — free tier cluster (M0) for development and testing.
  - Render — supports Git deploys and Docker; offers free starter plans for small services.
  - Fly.io — runs containers close to users and has a free allowance for small apps.
  - Railway — quick one-click deploys and free starter credits (subject to provider limits).

Quick steps (example using Render):
1. Create a free Render account.
2. New → Web Service → Connect your GitHub repo.
3. Choose Node environment or Docker, and set build/start commands.
4. Add environment variables (MONGO_URI, JWT_SECRET, etc.) in Render's dashboard.
5. Deploy and point your frontend's API URL to the service endpoint.

- Notes on DNS and TLS
Most of the providers above include automatic TLS (HTTPS) and easy domain configuration in their dashboard — no manual Nginx or Certbot setup required.

- Local & hybrid workflows
Keep using the provided Dockerfiles and `infra/docker-compose.yml` for local development and staging. This is a convenient way to test the full stack before deploying to a free host.

- When to consider EC2
EC2 and other IaaS offerings are useful when you need full control, custom networking, or instance-level features. For many hobby projects and MVPs, the free-to-start providers above are faster, cheaper, and simpler to operate.

---

## Authentication & Security

* Passwords hashed with bcrypt (or argon2 if preferred)
* JWT stored in client (in-memory or secure httpOnly cookie). **Prefer httpOnly cookies** for better XSS protection.
* Use refresh tokens or short-lived access tokens for security
* Rate-limit public endpoints (login, register) and enable account lockout on repeated failed logins
* Validate and sanitize inputs (avoid NoSQL injection)
* Use HTTPS in production

**Auth Flow (short)**

1. User logs in → server validates credentials → server returns access token (JWT) and refresh token.
2. Client stores access token in memory or secure cookie and uses it in `Authorization: Bearer <token>`.
3. When access token expires, client calls refresh endpoint to get a new access token.

---

## Redux and Frontend Patterns

* Use Redux Toolkit (RTK) with `createSlice`, `createAsyncThunk` for async REST calls
* Structure features by domain (e.g., `tasks/`, `users/`, `teams/`), each with its slice and selectors
* Use `RTK Query` if you want auto-caching and simpler data fetching
* Keep UI state (form inputs, open modals) in local component state; persistent app data in Redux

**Example slice** (`client/src/features/tasks/tasksSlice.js`)

```js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../utils/api'

export const fetchTasks = createAsyncThunk('tasks/fetchAll', async () => {
  const res = await api.get('/tasks')
  return res.data
})

const tasksSlice = createSlice({
  name: 'tasks',
  initialState: { items: [], status: 'idle', error: null },
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(fetchTasks.pending, state => { state.status = 'loading' })
      .addCase(fetchTasks.fulfilled, (state, action) => { state.status = 'succeeded'; state.items = action.payload })
      .addCase(fetchTasks.rejected, (state, action) => { state.status = 'failed'; state.error = action.error.message })
  }
})

export default tasksSlice.reducer
```

---

## API Endpoints (example)

**Auth**

* `POST /api/auth/register` — register
* `POST /api/auth/login` — login
* `POST /api/auth/refresh` — refresh token
* `POST /api/auth/logout` — logout

**Users / Teams**

* `GET /api/users` — list users (admin)
* `GET /api/teams` — list teams
* `POST /api/teams` — create team

**Tasks**

* `GET /api/tasks` — list tasks (with query params for filters)
* `POST /api/tasks` — create task
* `GET /api/tasks/:id` — task details
* `PUT /api/tasks/:id` — update task
* `DELETE /api/tasks/:id` — remove task
* `POST /api/tasks/:id/comments` — comment on task

All protected routes require a valid JWT in `Authorization` header.

---

## Database Schema (Collections)

**Users**

```js
{
  _id: ObjectId,
  name: String,
  email: String (unique),
  password: String (hashed),
  role: String (['admin','manager','member']),
  teamIds: [ObjectId],
  avatarUrl: String,
  settings: {
    notifications: Boolean,
    emailPreferences: Object
  },
  createdAt, updatedAt
}
```

**Tasks**

```js
{
  _id: ObjectId,
  title: String,
  description: String,
  creatorId: ObjectId,
  assigneeId: ObjectId,
  teamId: ObjectId,
  priority: String (['low','medium','high','critical']),
  status: String (['todo','inprogress','review','done']),
  dueDate: Date,
  startDate: Date,
  estimatedHours: Number,
  actualHours: Number,
  comments: [{ 
    authorId: ObjectId,
    text: String,
    createdAt: Date,
    updatedAt: Date,
    attachments: [{ name: String, url: String }]
  }],
  attachments: [{ 
    name: String,
    url: String,
    type: String,
    size: Number,
    uploadedBy: ObjectId,
    uploadedAt: Date
  }],
  tags: [String],
  dependencies: [ObjectId], // References other task IDs
  createdAt, updatedAt
}
```

**Teams**

```js
{
  _id: ObjectId,
  name: String,
  description: String,
  ownerId: ObjectId,
  members: [{
    userId: ObjectId,
    role: String (['admin','manager','member']),
    joinedAt: Date
  }],
  settings: {
    defaultAssigneeId: ObjectId,
    isPrivate: Boolean,
    customStatuses: [{
      name: String,
      color: String
    }]
  },
  createdAt, updatedAt
}
```

**Notifications**

```js
{
  _id: ObjectId,
  userId: ObjectId,
  type: String (['task_assigned','deadline_approaching','mention','comment','status_change']),
  title: String,
  message: String,
  reference: {
    type: String (['task','comment','team']),
    id: ObjectId
  },
  isRead: Boolean,
  createdAt, updatedAt,
  scheduledFor: Date,  // For reminders
  dismissedAt: Date
}
```

**ActivityLog**

```js
{
  _id: ObjectId,
  entityType: String (['task','team','user']),
  entityId: ObjectId,
  action: String (['created','updated','deleted','status_changed','assigned','commented']),
  userId: ObjectId,  // Who performed the action
  details: {
    field: String,    // Which field changed
    oldValue: Mixed,  // Previous value
    newValue: Mixed   // New value
  },
  createdAt: Date
}
```

---

## Monitoring, Logging, and Backups

* Use Winston or Pino for server logging and log rotation
* Use PM2 for process monitoring (if not fully containerized)
* For Docker: centralize logs to CloudWatch / ELK stack
* Back up MongoDB regularly (Atlas has automated backups)

---

## Troubleshooting & Tips

* 500 errors: check server logs (container logs: `docker-compose logs server`)
* CORS issues: ensure server includes `Access-Control-Allow-Origin` or configure proxy in development
* JWT `TokenExpiredError`: ensure token expiry handling and refresh flow
* Docker permission errors on Linux: add user to `docker` group or use `sudo`

---

## Contributing

1. Fork repository
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Commit changes with clear messages
4. Create PR with description and testing steps

Follow coding standards (ESLint + Prettier). Write tests for new features.

---

## Future Enhancements (Roadmap)

* WebSockets for real-time collaboration (task updates, presence)
* File attachments to tasks (S3 or similar)
* Full-text search with ElasticSearch or MongoDB Atlas Search
* Role-based permissions with a fine-grained RBAC policy
* Mobile app (React Native)
* Multi-tenant support

---

## License

This project is licensed under the MIT License. See `LICENSE` for details.

---

## Quick Start Checklist

* [ ] Create MongoDB instance and configure `MONGO_URI`
* [ ] Set `JWT_SECRET` and other env vars
* [ ] `npm install` in server and client
* [ ] Seed an admin account
* [ ] `docker-compose up --build` for containerized run
 * [ ] Configure domain, Nginx and SSL on your chosen host (or use provider-managed TLS)

---

Thanks for building TaskHive — a deceptively simple interface to the chaos of team tasks. Ship iteratively, test often, and keep the tokens short (and secure). Happy coding!
