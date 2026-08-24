# 🧠 Digital Twin AI – Personal Life Simulation & Decision Assistant

An intelligent personal decision-support platform that builds a personalized digital representation of a user based on financial activity, study patterns, daily habits, goals, and lifestyle data. Powered by Machine Learning, Statistical Forecasting, and Conversational AI.

---

## 📋 Features

- **Digital Twin** — AI-powered personal representation with health scores
- **Finance Module** — Income/expense tracking, budget management, savings goals
- **Financial Forecasting** — ML-powered 30-day expense/income predictions
- **Study Tracker** — Session logging, productivity scoring, subject analysis
- **Habit Tracker** — Daily/weekly tracking with streak calculation
- **Goals Module** — Personal, academic, fitness, career, financial goals
- **Decision Simulation** — What-if analysis with multi-scenario comparison
- **Recommendation Engine** — Personalized AI recommendations
- **AI Assistant** — Conversational AI with full user context awareness
- **Analytics Dashboard** — Detailed metrics, charts, and trend analysis
- **Dark/Light Theme** — Toggle between themes
- **Responsive Design** — Works on desktop and mobile

---

## 🏗️ Architecture

```
React Frontend (Vite + TypeScript)
        ↓
Node/Express Backend (TypeScript)
        ↓
PostgreSQL (Prisma ORM)
        ↓
Python FastAPI AI/ML Service
        ↓
Forecasting / Simulation / Recommendation Engines
        ↓
Gemini / OpenAI (Optional LLM)
        ↓
React Dashboard
```

---

## 🛠️ Technology Stack

| Layer | Technologies |
|-------|-------------|
| Frontend | React, TypeScript, Vite, React Router, Recharts, Axios, Lucide Icons |
| Backend | Node.js, Express.js, TypeScript, JWT, bcrypt, Zod, Helmet, Rate Limiting |
| Database | PostgreSQL, Prisma ORM |
| AI/ML | Python, FastAPI, NumPy, Pandas, Scikit-learn, XGBoost, Prophet |
| LLM | Gemini API (primary), OpenAI (fallback) |
| DevOps | Docker, Docker Compose |

---

## 📁 Folder Structure

```
digital-twin-ai/
├── frontend/                  # React + TypeScript + Vite
│   ├── src/
│   │   ├── components/        # Sidebar, ProtectedRoute, ChatAssistant
│   │   ├── contexts/          # AuthContext
│   │   ├── pages/             # All page components
│   │   ├── services/          # API client (Axios)
│   │   └── index.css          # Global styles + dark mode
│   └── package.json
│
├── backend/                   # Express + TypeScript
│   ├── src/
│   │   ├── controllers/       # API request handlers
│   │   ├── services/          # Business logic
│   │   ├── repositories/      # Database queries
│   │   ├── routes/            # Express route definitions
│   │   ├── middleware/        # JWT auth middleware
│   │   ├── validators/        # Zod schemas
│   │   ├── config/            # Configuration
│   │   ├── database/          # Prisma client
│   │   └── server.ts          # Express server entry
│   ├── prisma/
│   │   ├── schema.prisma      # Database schema
│   │   └── seed.ts            # Seed data
│   └── package.json
│
├── ai-service/                # FastAPI Python service
│   ├── app/
│   │   ├── routes/            # API endpoints
│   │   ├── services/          # ML pipeline
│   │   └── main.py            # FastAPI entry
│   └── requirements.txt
│
├── docker-compose.yml
└── README.md
```

---

## 🚀 Installation & Running

### Prerequisites
- Node.js 18+
- Python 3.10+
- PostgreSQL 14+
- (Optional) Docker & Docker Compose

### Local Development (Without Docker)

#### 1. Database Setup
```bash
# Create PostgreSQL database
createdb ai_digital_twin

# Or using psql
psql -U postgres -c "CREATE DATABASE ai_digital_twin;"
```

#### 2. Backend
```bash
cd backend
cp .env.example .env
# Edit .env with your DATABASE_URL and JWT_SECRET

npm install
npx prisma migrate dev --name init
npx prisma db seed
npm run dev
```
Backend runs at `http://localhost:5000`

#### 3. AI Service
```bash
cd ai-service
cp .env.example .env
# Edit .env with your API keys (optional)

python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
AI Service runs at `http://localhost:8000`

#### 4. Frontend
```bash
cd frontend
cp .env.example .env

npm install
npm run dev
```
Frontend runs at `http://localhost:5173`

### Docker Development
```bash
docker-compose up --build
```
All services start automatically with database migration and seeding.

---

## 🔑 Demo Credentials

| Account | Email | Password |
|---------|-------|----------|
| **Demo User** | demo@digitaltwin.ai | Demo@123 |
| Secondary User | alex.carter@example.com | Password123! |

The demo account comes pre-loaded with 12 months of realistic financial data, 6 months of study sessions, 180 days of habit logs, goals, budgets, recommendations, and a saved decision simulation.

---

## 📡 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/register` | Register new user |
| POST | `/api/login` | Login and get JWT |
| GET | `/api/auth/me` | Get current user info |

### Profile
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/profile` | Get user profile |
| PUT | `/api/profile` | Update profile |
| DELETE | `/api/profile` | Delete account |

### Finance
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/transactions` | List transactions |
| POST | `/api/transactions` | Add transaction |
| PUT | `/api/transactions/:id` | Update transaction |
| DELETE | `/api/transactions/:id` | Delete transaction |
| GET | `/api/transactions/summary` | Monthly summary |
| GET | `/api/finance/budgets` | List budgets |
| POST | `/api/finance/budgets` | Create budget |
| GET | `/api/finance/goals` | List financial goals |
| POST | `/api/finance/goals` | Create financial goal |

### Study
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/study` | List study sessions |
| POST | `/api/study` | Add study session |
| PUT | `/api/study/:id` | Update session |
| DELETE | `/api/study/:id` | Delete session |
| GET | `/api/study/total-hours` | Total hours |

### Habits
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/habits` | List habits |
| POST | `/api/habits` | Create habit |
| PUT | `/api/habits/:id` | Update habit |
| DELETE | `/api/habits/:id` | Delete habit |

### Goals
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/goals` | List goals |
| POST | `/api/goals` | Create goal |
| PUT | `/api/goals/:id` | Update goal |
| DELETE | `/api/goals/:id` | Delete goal |

### Digital Twin
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/digital-twin` | Get twin state |
| POST | `/api/digital-twin/sync` | Sync twin |

### Simulations
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/decision-simulations/run` | Run simulation |
| POST | `/api/decision-simulations` | Save simulation |
| GET | `/api/decision-simulations` | List simulations |
| GET | `/api/decision-simulations/:id` | Get simulation |

### AI Chat
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/chat` | Send message |
| GET | `/api/chat/conversations` | List conversations |
| GET | `/api/chat/conversations/:id` | Get conversation |

### Analytics
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/predict/finance` | Financial prediction |
| POST | `/predict/study` | Study prediction |
| POST | `/predict/habits` | Habit prediction |
| GET | `/analytics/dashboard` | Analytics dashboard |

### Recommendations
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/recommendations` | Get recommendations |
| GET | `/api/recommendations/v2` | AI-generated recommendations |

---

## 🧪 AI Service Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| POST | `/predict/finance` | ML financial forecasting |
| POST | `/predict/study` | ML study forecasting |
| POST | `/predict/habits` | ML habit analysis |
| POST | `/simulate/decision` | Decision simulation |
| POST | `/recommend` | Personalized recommendations |
| POST | `/chat` | Conversational AI |
| POST | `/analytics/dashboard` | Full analytics |

---

## 🗄️ Database Schema

Key models:
- **User** — Authentication and account data
- **Profile** — Extended user profile with targets
- **FinancialTransaction** — Income and expense records
- **StudySession** — Study session logs
- **Habit** — Daily habit tracking
- **Goal** — Personal/academic/fitness/career goals
- **FinancialGoal** — Savings goals with targets
- **Budget** — Category budget limits
- **DigitalTwinState** — Twin scores and status
- **DecisionSimulation** — What-if simulation results
- **ChatConversation / ChatMessage** — AI chat history
- **AiRecommendation** — Personalized recommendations
- **AnalyticsSummary** — Aggregated analytics scores

---

## 🔒 Security

- JWT authentication with 7-day expiry
- bcrypt password hashing (10 salt rounds)
- Protected routes with auth middleware
- CORS configuration
- Rate limiting (10,000 req/15min)
- Helmet security headers
- Input validation with Zod schemas
- User data isolation (all queries filtered by userId)
- Environment variables for secrets

---

## 📊 ML/AI Capabilities

### Financial Forecasting
- Linear Regression, Random Forest, XGBoost model comparison
- Daily expense prediction for 30 days
- Budget utilization and overspending probability
- Financial health scoring

### Study Analytics
- Productivity score calculation
- Focus time analysis
- Consistency metrics
- Burnout risk detection

### Habit Analysis
- Streak calculation
- Completion rate tracking
- ML-based completion probability
- Pattern recognition

### Decision Simulation
- Multi-scenario comparison (Current Path vs. Decision vs. Alternative)
- Financial impact projection
- Goal impact assessment
- Risk level evaluation
- AI recommendation generation

### Conversational AI
- Gemini API integration with structured context
- Rule-based fallback when no API key
- Full user context pipeline (profile + finance + study + habits + goals)
- Persistent chat history

---

## 🧪 Testing

### Backend
```bash
cd backend
npm test
```

### AI Service
```bash
cd ai-service
python -m pytest tests/
```

---

## 🚢 Deployment

### Production Environment Variables
```env
# Backend
DATABASE_URL=postgresql://user:pass@host:5432/ai_digital_twin
JWT_SECRET=<strong-random-secret>
AI_SERVICE_URL=http://ai-service:8000
NODE_ENV=production

# AI Service
JWT_SECRET=<same-as-backend>
GEMINI_API_KEY=<your-key>
```

### Docker Production
```bash
docker-compose -f docker-compose.yml up --build -d
```

---

## 📝 License

This project is for educational and demonstration purposes.

---

Built with ❤️ using React, Express, PostgreSQL, and Python FastAPI.
