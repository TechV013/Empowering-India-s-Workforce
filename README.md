# WorkNext Backend

Backend for the WorkNext React/Vite frontend.

## Stack
- Node.js + Express
- PostgreSQL
- Prisma ORM
- JWT authentication
- bcryptjs password hashing
- Multer resume uploads

## 1. Requirements
Install:
- Node.js 18+
- PostgreSQL 14+
- Git

## 2. Setup

```bash
cd backend
npm install
```

Create `.env` from `.env.example` and set your PostgreSQL password.

Create the database in PostgreSQL:

```sql
CREATE DATABASE worknext;
```

Then:

```bash
npx prisma generate
npx prisma migrate dev --name init
npm run seed
npm run dev
```

API runs at:
http://localhost:5000

## 3. Important
Never upload `.env`, passwords, JWT secrets, or API keys to GitHub.

## 4. Main API endpoints

POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me

GET    /api/jobs
GET    /api/jobs/:id
POST   /api/jobs                 (login required)
PUT    /api/jobs/:id             (login + recruiter/admin)
DELETE /api/jobs/:id             (login + recruiter/admin)

GET    /api/profile
PUT    /api/profile

GET    /api/applications/my
POST   /api/applications/:jobId
PATCH  /api/applications/:id     (recruiter/admin)

POST   /api/resumes
GET    /api/resumes
DELETE /api/resumes/:id

POST   /api/saved-jobs/:jobId
DELETE /api/saved-jobs/:jobId
GET    /api/saved-jobs

## 5. Frontend
Copy `frontend-api.js` into the React project as `src/api.js` (or rename it).
It contains ready-to-use functions for your friend.

## 6. Test
Open:
http://localhost:5000/health

Expected:
{"status":"ok","service":"WorkNext API"}
