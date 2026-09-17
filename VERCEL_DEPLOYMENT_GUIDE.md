# 🚀 Vercel Deployment & Production Setup Guide

This guide walks you through deploying the **AI-Based Visual Risk and Compliance Intelligence System** (Digital Twin) to production with **Vercel** and managed cloud services.

---

## 🏗️ Production Architecture Overview

The system consists of three complementary components:
1. **Frontend**: React (Vite + TypeScript + React Router SPA + Recharts/Plotly).
2. **Backend**: Node.js + Express + TypeScript + Prisma ORM.
3. **AI Service**: Python + FastAPI + Scikit-Learn/XGBoost/Prophet ML models.
4. **Database**: Managed PostgreSQL (e.g., Neon, Supabase, Railway, or Vercel Postgres).

```
   ┌─────────────────────────────────────────────────────────┐
   │                    VERCEL EDGE CDN                      │
   │  Frontend React SPA (Vite + TS)                         │
   │  - Handles UI, Dashboards, Twin State, Realtime Charts  │
   └────────────────────────┬────────────────────────────────┘
                            │ API Calls (VITE_API_URL)
                            ▼
   ┌─────────────────────────────────────────────────────────┐
   │                  BACKEND (Express API)                  │
   │  Hosted on Render / Railway / Vercel Serverless         │
   │  - Auth, Transactions, Habits, Simulations, Digital Twin│
   └────────────┬─────────────────────────────┬──────────────┘
                │                             │
    Prisma ORM  ▼                 HTTP / JSON ▼
   ┌─────────────────────────┐   ┌───────────────────────────┐
   │   Managed PostgreSQL    │   │  AI Microservice (Python) │
   │  Neon / Supabase / etc. │   │  Render / Railway / Fly   │
   └─────────────────────────┘   └───────────────────────────┘
```

---

## ⚡ Option 1: Deploy Frontend on Vercel (Recommended)

This is the standard and most resilient production pattern.

### Step 1: Push Your Code to GitHub
Ensure all your latest changes are pushed to your GitHub repository:
```bash
git add .
git commit -m "Configure project for Vercel deployment"
git push origin main
```

### Step 2: Import into Vercel
1. Log in to [vercel.com](https://vercel.com) and click **"Add New..." ➔ "Project"**.
2. Connect your GitHub account and select your repository: `AI-Driven-Digital-Twin` (or your repo name).

### Step 3: Configure Project Settings in Vercel
- **Framework Preset**: `Vite` (Auto-detected)
- **Root Directory**:
  - *Option A (Default)*: Keep `./` (our root `vercel.json` automatically builds `frontend/`).
  - *Option B*: Click **Edit** and choose `frontend`.
- **Build and Output Settings**:
  - Build Command: `npm run build`
  - Output Directory: `dist`
  - Install Command: `npm install`

### Step 4: Add Environment Variables
In the **Environment Variables** section on Vercel, add:

| Key | Example Value | Description |
| :--- | :--- | :--- |
| `VITE_API_URL` | `https://your-backend-api.onrender.com/api` | The public URL of your deployed Express backend API |

> [!TIP]
> Vite requires the `VITE_` prefix for client-exposed environment variables. The frontend will automatically read `import.meta.env.VITE_API_URL`.

### Step 5: Click Deploy! 🎉
Vercel will build and assign you a production URL (e.g., `https://ai-digital-twin.vercel.app`).
SPA routing is pre-configured via `vercel.json` so refreshing pages like `/dashboard`, `/finance`, `/twin`, `/chat` will work seamlessly.

---

## 🗄️ Setting Up Managed PostgreSQL & Backend

### 1. Create a Free PostgreSQL Database
You can use any cloud PostgreSQL provider:
- **[Neon.tech](https://neon.tech)** (Recommended — Instant serverless Postgres)
- **[Supabase](https://supabase.com)** (Free tier Postgres)
- **[Railway](https://railway.app)** or **[Render](https://render.com)**

Copy your connection string:
```
postgresql://<user>:<password>@<host>:5432/<database>?sslmode=require
```

### 2. Run Database Migrations
Run Prisma migrations to initialize all tables in your cloud database:
```bash
# In your local terminal or CI/CD:
cd backend
DATABASE_URL="your-cloud-postgresql-url" npx prisma db push
```

*(Optional) Seed the database with demo data:*
```bash
DATABASE_URL="your-cloud-postgresql-url" npm run prisma:seed
```

### 3. Deploy Express Backend (Render / Railway / VPS)
Deploy the `backend` folder to a Node host (e.g. Render Web Service):
- **Root Directory**: `backend`
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`
- **Environment Variables**:
  ```env
  PORT=5000
  NODE_ENV=production
  DATABASE_URL=postgresql://<user>:<password>@<host>:5432/<database>?sslmode=require
  JWT_SECRET=your-super-secret-jwt-key-change-in-production
  AI_SERVICE_URL=https://your-ai-service.onrender.com
  FRONTEND_URL=https://your-project.vercel.app
  ```

---

## 🧠 Setting Up the Python AI Microservice

Deploy the `ai-service` folder to **Render**, **Railway**, **Fly.io**, or **HuggingFace Spaces**:
- **Root Directory**: `ai-service`
- **Environment**: Python 3.10+
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- **Environment Variables**:
  ```env
  GEMINI_API_KEY=your_gemini_api_key_here
  AI_SERVICE_PORT=8000
  ```

---

## 🛠️ Summary of Pre-Configured Vercel Files

| File | Purpose |
| :--- | :--- |
| [`frontend/vercel.json`](file:///c:/Ai%20Digital%20Twin/frontend/vercel.json) | Configures SPA rewrites for React Router and asset caching when deploying from `frontend` subfolder. |
| [`vercel.json`](file:///c:/Ai%20Digital%20Twin/vercel.json) | Root-level monorepo configuration so importing the root repository in Vercel automatically builds `frontend` without errors. |
| [`package.json`](file:///c:/Ai%20Digital%20Twin/package.json) | Added `"build"`, `"build:frontend"`, and `"build:backend"` scripts for automated CI/CD. |
| [`backend/prisma/schema.prisma`](file:///c:/Ai%20Digital%20Twin/backend/prisma/schema.prisma) | Configured cross-platform `binaryTargets` for Prisma Client (`native`, Linux OpenSSL 1.x/3.x, Windows). |
| [`backend/src/database/prismaClient.ts`](file:///c:/Ai%20Digital%20Twin/backend/src/database/prismaClient.ts) | Added global singleton connection pooling to eliminate connection leaks in serverless/cloud environments. |
| [`backend/src/server.ts`](file:///c:/Ai%20Digital%20Twin/backend/src/server.ts) | Exported Express `app` and added serverless guards + dynamic CORS support. |

---

## 🔍 Verification Checklist

- [x] **Frontend Builds Cleanly**: `npm --prefix frontend run build` completes with exit code 0.
- [x] **Backend Builds Cleanly**: `npm --prefix backend run build` completes with exit code 0.
- [x] **Prisma Client Generates Cleanly**: Includes native and cloud binary targets.
- [x] **SPA Routing Configured**: No 404 on page refresh on Vercel.
- [x] **CORS Configured**: Dynamic origin detection supports all `*.vercel.app` preview branches and custom domains.
