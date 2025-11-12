# TaskHive

**MERN Stack · JWT · Redux**

## Project Overview

TaskHive is a full-featured task management platform built with the MERN stack (MongoDB, Express, React, Node.js). It supports team collaboration, role-based access, deadlines and reminders, task assignment, and dynamic dashboards powered by Redux. Authentication uses JWT (JSON Web Tokens).

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
8. [Authentication & Security](#authentication--security)

---

## Features

* User signup / login with secure password hashing and JWT authentication
* Role-based access (Admin, Manager, Member) and team management
* Create, assign, prioritize, comment on, and track tasks
* Deadlines, reminders, and task status (To Do, In Progress, Review, Done)
* Team dashboards and filters (by user, priority, status, due date)
* Redux for predictable client state management
* REST API with clear separation of concerns (controllers, services, models)

---

## Tech Stack

* Frontend: Vite, Redux, React Router, Axios
* Backend: Node.js, Express.js
* Database: MongoDB (Atlas or self-hosted)
* Auth: JWT for stateless authentication

---

## Architecture Overview

The app follows a standard separation of concerns:

* **client/** — React single-page application (UI, components, Redux slices)
* **server/** — Express REST API (routes, controllers, models, middleware)

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
├─ .env.example
├─ .gitignore
└─ README.md
```

---

## Prerequisites

* Node.js >= 18
* npm or yarn
* MongoDB (local or Atlas)

---

## Environment Variables

Create `.env` files in `server/` and `client/` (or at repo root depending on setup).

**Example `server/.env`**

```
PORT=4000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/taskhive
JWT_SECRET=asdlkkjsadklnkas_dsalkjvcasdlksd_dslakljasdfasd
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
git clone https://github.com/HimanshuMNirmal/taskhive.git
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

---




## Authentication & Security

* Passwords hashed with bcrypt (or argon2 if preferred)
* JWT stored in client (in-memory). **Prefer httpOnly cookies** for better XSS protection.
* Rate-limit public endpoints (login, register) and enable account lockout on repeated failed logins
* Validate and sanitize inputs (avoid NoSQL injection)
* Use HTTPS in production

**Auth Flow (short)**

1. User logs in → server validates credentials → server returns access token (JWT).
2. Client stores access token in memory or secure cookie and uses it in `Authorization: Bearer <token>`.

---


Thanks for using TaskHive — a deceptively simple interface to the chaos of team tasks. Ship iteratively, test often, and keep the tokens short (and secure).
