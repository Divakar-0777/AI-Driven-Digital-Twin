from fastapi import APIRouter, Depends, HTTPException, Header
from pydantic import BaseModel
from typing import List, Optional
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import os
import jwt

from app.services.pipeline import MLPipeline, PROPHET_AVAILABLE
from app.routes.finance import verify_jwt_auth

router = APIRouter()

class StudySessionSchema(BaseModel):
    duration: int  # minutes
    productivityRating: int  # 1-5
    date: str
    subject: str

class StudyProfileSchema(BaseModel):
    dailyStudyHoursTarget: float

class StudyPredictPayload(BaseModel):
    sessions: List[StudySessionSchema]
    profile: StudyProfileSchema

@router.post("/predict/study")
def predict_study(payload: StudyPredictPayload, user_id: str = Depends(verify_jwt_auth)):
    sessions = payload.sessions
    profile = payload.profile
    target_hours = profile.dailyStudyHoursTarget or 2.5

    if not sessions:
        return create_study_fallback(target_hours, "No study history found")

    df_raw = pd.DataFrame([s.model_dump() for s in sessions])
    df_raw['date'] = pd.to_datetime(df_raw['date']).dt.tz_localize(None)
    df_raw['duration'] = df_raw['duration'].astype(float)
    df_raw['productivityRating'] = df_raw['productivityRating'].astype(float)

    # Sort
    df_raw = df_raw.sort_values('date')

    # Aggregations
    total_minutes = df_raw['duration'].sum()
    total_hours = total_minutes / 60.0
    avg_rating = df_raw['productivityRating'].mean()

    # Productivity Score (0-100)
    # Scale 1-5 to 0-100: (rating - 1) / 4 * 100
    productivity_score = float((avg_rating - 1.0) / 4.0 * 100.0) if avg_rating >= 1.0 else 0.0

    # Group by date for daily studies
    df_daily = df_raw.groupby(df_raw['date'].dt.normalize()).agg({
        'duration': 'sum',
        'productivityRating': 'mean'
    }).reset_index()
    df_daily['hours'] = df_daily['duration'] / 60.0

    # Complete the date range
    if len(df_daily) >= 2:
        date_range = pd.date_range(start=df_daily['date'].min(), end=df_daily['date'].max(), freq='D')
        df_daily = df_daily.set_index('date').reindex(date_range, fill_value=0.0).reset_index()
        df_daily.columns = ['date', 'duration', 'productivityRating', 'hours']

    # Focus Score: Weighted blend of study hours and ratings
    # Normalize hours to 0-1 relative to target (cap at 1.5x target)
    hours_factor = np.minimum(1.5, df_daily['hours'].mean() / target_hours) if target_hours > 0 else 1.0
    rating_factor = (df_daily[df_daily['productivityRating'] > 0]['productivityRating'].mean() or 3.0) / 5.0
    focus_score = float((0.4 * hours_factor + 0.6 * rating_factor) * 100.0)

    # Consistency Score: percentage of days meeting at least 70% of target hours
    days_met_target = df_daily[df_daily['hours'] >= (target_hours * 0.7)].shape[0]
    total_days = len(df_daily)
    consistency_score = float((days_met_target / total_days * 100.0)) if total_days > 0 else 0.0

    # Best Study Time (by Hour of Day)
    df_raw['hour'] = df_raw['date'].dt.hour
    hourly_stats = df_raw.groupby('hour')['productivityRating'].mean()
    if not hourly_stats.empty:
        best_hour = int(hourly_stats.idxmax())
        best_study_time = f"{best_hour:02d}:00 - {(best_hour+2)%24:02d}:00"
    else:
        best_study_time = "18:00 - 20:00"

    # Weakest Study Day (by Day of Week)
    df_daily['day_name'] = df_daily['date'].dt.day_name()
    day_stats = df_daily.groupby('day_name')['hours'].mean()
    if not day_stats.empty:
        weakest_day = str(day_stats.idxmin())
    else:
        weakest_day = "Sunday"

    # Burnout Risk: High if daily hours > 1.5 * target and ratings are dropping in last 3 sessions
    recent_sessions = df_raw.tail(4)
    burnout_risk = "Low"
    if len(recent_sessions) >= 3:
        recent_ratings = recent_sessions['productivityRating'].values
        is_declining = recent_ratings[-1] < recent_ratings[0]
        avg_recent_hours = df_daily.tail(5)['hours'].mean()
        if avg_recent_hours > target_hours * 1.3 and is_declining:
            burnout_risk = "High"
        elif avg_recent_hours > target_hours * 1.1 or is_declining:
            burnout_risk = "Medium"

    # ML Pipeline for Hours Forecast
    if len(df_daily) < 4:
        return create_study_fallback(target_hours, "Insufficient study history for ML modeling", df_raw)

    df_daily['day_of_week'] = df_daily['date'].dt.dayofweek
    df_daily['day_of_month'] = df_daily['date'].dt.day
    df_daily['month'] = df_daily['date'].dt.month
    df_daily['lag_1'] = df_daily['hours'].shift(1)
    df_daily['lag_7'] = df_daily['hours'].shift(7)
    df_daily['rolling_mean_7'] = df_daily['hours'].shift(1).rolling(window=7, min_periods=1).mean()
    df_daily = df_daily.fillna(0.0)

    features = ['day_of_week', 'day_of_month', 'month', 'lag_1', 'lag_7', 'rolling_mean_7']
    X = df_daily[features]
    y = df_daily['hours']

    model, metrics, model_type = MLPipeline.train_and_select_regressor(X, y, user_id, "study_hours")

    # Predict 30 days
    last_known = df_daily.tail(7).copy()
    predictions = []
    current_date = df_daily['date'].max() + timedelta(days=1)

    for i in range(30):
        day_of_week = current_date.weekday()
        day_of_month = current_date.day
        month = current_date.month
        lag_1 = predictions[-1] if len(predictions) >= 1 else last_known.iloc[-1]['hours']
        lag_7 = predictions[-7] if len(predictions) >= 7 else last_known.iloc[-7]['hours'] if len(last_known) >= 7 else last_known['hours'].mean()
        
        combined = list(last_known['hours'].values) + predictions
        rolling_mean_7 = np.mean(combined[-7:]) if combined else 0.0

        feat_df = pd.DataFrame([{
            'day_of_week': day_of_week,
            'day_of_month': day_of_month,
            'month': month,
            'lag_1': lag_1,
            'lag_7': lag_7,
            'rolling_mean_7': rolling_mean_7
        }])

        pred_val = max(0.0, float(model.predict(feat_df)[0]))
        predictions.append(pred_val)
        current_date += timedelta(days=1)

    forecast_dates = pd.date_range(start=df_daily['date'].max() + timedelta(days=1), periods=30, freq='D')
    forecast_df = pd.DataFrame({'date': forecast_dates, 'hours': predictions})

    # Expected weekly study hours forecast
    expected_weekly_study_hours = float(forecast_df['hours'].head(7).sum())

    # Prophet forecast
    prophet_forecast = None
    if PROPHET_AVAILABLE and len(df_daily) >= 10:
        df_p = df_daily[['date', 'hours']].copy()
        df_p.columns = ['ds', 'y']
        prophet_forecast = MLPipeline.forecast_prophet(df_p, 30)

    # Recommendations
    recommendations = []
    if burnout_risk == "High":
        recommendations.append("High Burnout Risk! Your study duration is high but productivity scores are declining. Schedule a rest day.")
    elif productivity_score < 70:
        recommendations.append("Your average study productivity score is low. Try the Pomodoro technique (25m study, 5m break) to boost focus.")

    if consistency_score < 60:
        recommendations.append(f"Consistency is at {consistency_score:.0f}%. Try studying for just 30 minutes at your best time ({best_study_time}) to build habit momentum.")
    else:
        recommendations.append(f"Superb consistency! You are hitting your daily target on {consistency_score:.0f}% of tracked days.")

    recommendations.append(f"Data suggests your focus is highest around {best_study_time}. Move complex topics to this window.")

    daily_forecast = [{'date': d.strftime('%Y-%m-%d'), 'hours': round(h, 2)} for d, h in zip(forecast_df['date'], forecast_df['hours'])]

    return {
        "daily_forecast": daily_forecast,
        "average_study_hours": round(float(df_daily['hours'].mean()), 2),
        "expected_weekly_study_hours": round(expected_weekly_study_hours, 2),
        "productivity_score": round(productivity_score, 2),
        "focus_score": round(focus_score, 2),
        "consistency_score": round(consistency_score, 2),
        "best_study_time": best_study_time,
        "weakest_study_day": weakest_day,
        "burnout_risk": burnout_risk,
        "recommendations": recommendations,
        "prophet_forecast": prophet_forecast,
        "model_type": model_type,
        "confidence_score": round(metrics.get("confidence", 0.7) * 100, 2),
        "forecast_period": "Next 30 Days",
        "expected_accuracy": f"MAE: {metrics.get('mae', 0.0):.2f}"
    }

@router.get("/forecast/study")
def get_forecast_study(user_id: str = Depends(verify_jwt_auth)):
    return {"message": "Forecast study data retrieved"}

def create_study_fallback(target_hours, reason, df_raw=None):
    # Rule-based fallback
    avg_hours = target_hours
    if df_raw is not None and not df_raw.empty:
        avg_hours = float((df_raw['duration'].sum() / 60.0) / len(df_raw))

    return {
        "daily_forecast": [{"date": (datetime.now() + timedelta(days=i)).strftime('%Y-%m-%d'), "hours": round(avg_hours, 2)} for i in range(30)],
        "average_study_hours": round(avg_hours, 2),
        "expected_weekly_study_hours": round(avg_hours * 7, 2),
        "productivity_score": 75.0,
        "focus_score": 70.0,
        "consistency_score": 50.0,
        "best_study_time": "18:00 - 20:00",
        "weakest_study_day": "Sunday",
        "burnout_risk": "Low",
        "recommendations": [
            f"Note: {reason}. Keep logging study sessions.",
            "Schedule sessions at the same time each day to build routine.",
            "Aim to reach your daily goal of " + str(target_hours) + " study hours."
        ],
        "model_type": "Rule-Based Fallback",
        "confidence_score": 50.0,
        "forecast_period": "Next 30 Days",
        "expected_accuracy": "Low (Fallback Model)"
    }
