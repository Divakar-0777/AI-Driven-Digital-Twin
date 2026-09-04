import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

from app.routes import finance, study, habits, analytics, chat, decision_simulation
from app.routes import recommend

app = FastAPI(
    title="AI-Based Visual Risk and Compliance Intelligence System - AI Microservice",
    description="Python FastAPI service handling Machine Learning risk forecasts, regression models, time-series, and compliance recommendation analytics.",
    version="1.0.0"
)

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(finance.router, tags=["Finance"])
app.include_router(study.router, tags=["Study"])
app.include_router(habits.router, tags=["Habits"])
app.include_router(analytics.router, tags=["Analytics"])
app.include_router(chat.router, tags=["Chat"])
app.include_router(decision_simulation.router, tags=["Decision Simulation"])
app.include_router(recommend.router, tags=["Recommendations"])

@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": "AI Microservice",
        "framework": "FastAPI",
        "models": ["LinearRegression", "RandomForest", "XGBoost", "Prophet"]
    }

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "AI Microservice",
        "version": "1.0.0"
    }

if __name__ == "__main__":
    import uvicorn
    # Read port from env, default to 8000
    port = int(os.getenv("AI_SERVICE_PORT", 8000))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=True)
