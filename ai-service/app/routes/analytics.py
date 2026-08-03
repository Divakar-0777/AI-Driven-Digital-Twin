from fastapi import APIRouter, Depends, HTTPException, Header
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import os
import jwt

from app.routes.finance import TransactionSchema, FinanceProfileSchema, verify_jwt_auth, predict_finance, FinancePredictPayload
from app.routes.study import StudySessionSchema, StudyProfileSchema, StudyPredictPayload, predict_study
from app.routes.habits import HabitSchema, HabitPredictPayload, predict_habits

router = APIRouter()

class FullAnalyticsPayload(BaseModel):
    transactions: List[TransactionSchema]
    sessions: List[StudySessionSchema]
    habits: List[HabitSchema]
    monthlyIncome: float
    monthlyExpenseTarget: float
    dailyStudyHoursTarget: float

# Helper to execute full calculations locally in Python
def compute_all_metrics(payload: FullAnalyticsPayload, user_id: str):
    # Call individual predictive logic
    finance_res = predict_finance(
        FinancePredictPayload(
            transactions=payload.transactions,
            profile=FinanceProfileSchema(
                monthlyIncome=payload.monthlyIncome,
                monthlyExpenseTarget=payload.monthlyExpenseTarget
            )
        ),
        user_id=user_id
    )

    study_res = predict_study(
        StudyPredictPayload(
            sessions=payload.sessions,
            profile=StudyProfileSchema(
                dailyStudyHoursTarget=payload.dailyStudyHoursTarget
            )
        ),
        user_id=user_id
    )

    habits_res = predict_habits(
        HabitPredictPayload(habits=payload.habits),
        user_id=user_id
    )

    # Compute overall score
    fin_score = finance_res["financial_health_score"]
    prod_score = study_res["productivity_score"]
    habit_score = habits_res["overall_performance_score"]
    
    # Weighted average: 40% Finance, 40% Study, 20% Habit
    overall_score = float(0.4 * fin_score + 0.4 * prod_score + 0.2 * habit_score)

    return {
        "finance": finance_res,
        "study": study_res,
        "habits": habits_res,
        "scores": {
            "financialHealthScore": round(fin_score, 2),
            "productivityScore": round(prod_score, 2),
            "habitScore": round(habit_score, 2),
            "overallAIScore": round(overall_score, 2)
        }
    }

@router.post("/analytics/dashboard")
def post_analytics_dashboard(payload: FullAnalyticsPayload, user_id: str = Depends(verify_jwt_auth)):
    res = compute_all_metrics(payload, user_id)
    return res

@router.get("/analytics/dashboard")
def get_analytics_dashboard(payload: FullAnalyticsPayload, user_id: str = Depends(verify_jwt_auth)):
    res = compute_all_metrics(payload, user_id)
    return res

@router.post("/analytics/recommendations")
def post_analytics_recommendations(payload: FullAnalyticsPayload, user_id: str = Depends(verify_jwt_auth)):
    res = compute_all_metrics(payload, user_id)
    # Combine and categorize all recommendations
    recs = []
    
    for text in res["finance"]["recommendations"]:
        recs.append({
            "category": "FINANCE",
            "recommendationText": text,
            "impactLevel": "HIGH" if "risk" in text.lower() or "warning" in text.lower() else "MEDIUM"
        })
        
    for text in res["study"]["recommendations"]:
        recs.append({
            "category": "STUDY",
            "recommendationText": text,
            "impactLevel": "HIGH" if "burnout" in text.lower() or "risk" in text.lower() else "MEDIUM"
        })
        
    for text in res["habits"]["recommendations"]:
        recs.append({
            "category": "HABITS",
            "recommendationText": text,
            "impactLevel": "MEDIUM" if "miss" in text.lower() else "LOW"
        })

    return recs

@router.get("/analytics/recommendations")
def get_analytics_recommendations(payload: FullAnalyticsPayload, user_id: str = Depends(verify_jwt_auth)):
    return post_analytics_recommendations(payload, user_id)

@router.post("/analytics/trends")
def post_analytics_trends(payload: FullAnalyticsPayload, user_id: str = Depends(verify_jwt_auth)):
    res = compute_all_metrics(payload, user_id)
    
    # Pack up trend lists for charts
    return {
        "finance_forecast": res["finance"]["daily_forecast"],
        "study_forecast": res["study"]["daily_forecast"],
        "scores": res["scores"]
    }

@router.get("/analytics/trends")
def get_analytics_trends(payload: FullAnalyticsPayload, user_id: str = Depends(verify_jwt_auth)):
    return post_analytics_trends(payload, user_id)
