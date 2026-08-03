from fastapi import APIRouter, Depends, HTTPException, Header
from pydantic import BaseModel
from typing import List, Optional
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import os
import scipy.stats as stats  # Optional, fallback available
import jwt

from app.services.pipeline import MLPipeline, PROPHET_AVAILABLE

router = APIRouter()

# Schema definitions
class TransactionSchema(BaseModel):
    amount: float
    category: str
    type: str  # 'INCOME' or 'EXPENSE'
    date: str
    paymentMethod: str

class FinanceProfileSchema(BaseModel):
    monthlyIncome: float
    monthlyExpenseTarget: float

class FinancePredictPayload(BaseModel):
    transactions: List[TransactionSchema]
    profile: FinanceProfileSchema

# Helper to verify JWT from header
def verify_jwt_auth(authorization: str = Header(None)) -> str:
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header is required")
    try:
        token = authorization.split(" ")[1]
        secret = os.getenv("JWT_SECRET", "super-secret-milestone1-key-phrase-12345")
        decoded = jwt.decode(token, secret, algorithms=["HS256"])
        return decoded["userId"]
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid or expired JWT: {str(e)}")

@router.post("/predict/finance")
def predict_finance(payload: FinancePredictPayload, user_id: str = Depends(verify_jwt_auth)):
    txs = payload.transactions
    profile = payload.profile
    expense_target = profile.monthlyExpenseTarget or 2500.0
    monthly_income = profile.monthlyIncome or 5000.0

    if not txs:
        # Fallback for empty history
        return create_finance_fallback(expense_target, monthly_income, "No transactions found")

    df_raw = pd.DataFrame([tx.model_dump() for tx in txs])
    df_raw['date'] = pd.to_datetime(df_raw['date']).dt.tz_localize(None)
    df_raw['amount'] = df_raw['amount'].astype(float)

    # Sort by date
    df_raw = df_raw.sort_values('date')

    # Filter income and expenses
    df_exp = df_raw[df_raw['type'] == 'EXPENSE'].copy()
    df_inc = df_raw[df_raw['type'] == 'INCOME'].copy()

    # If extremely few data points, fallback
    if len(df_exp) < 3:
        return create_finance_fallback(expense_target, monthly_income, "Insufficient expense history for ML modeling", df_raw)

    # Daily aggregation
    df_exp_daily = df_exp.groupby(df_exp['date'].dt.normalize())['amount'].sum().reset_index()
    df_exp_daily.columns = ['date', 'amount']

    # Generate a full date range to fill missing days with 0 expenses
    if len(df_exp_daily) >= 2:
        date_range = pd.date_range(start=df_exp_daily['date'].min(), end=df_exp_daily['date'].max(), freq='D')
        df_exp_daily = df_exp_daily.set_index('date').reindex(date_range, fill_value=0.0).reset_index()
        df_exp_daily.columns = ['date', 'amount']

    # Feature Engineering for Daily Expenses
    df_exp_daily['day_of_week'] = df_exp_daily['date'].dt.dayofweek
    df_exp_daily['day_of_month'] = df_exp_daily['date'].dt.day
    df_exp_daily['month'] = df_exp_daily['date'].dt.month

    # Lag features
    df_exp_daily['lag_1'] = df_exp_daily['amount'].shift(1)
    df_exp_daily['lag_7'] = df_exp_daily['amount'].shift(7)
    df_exp_daily['rolling_mean_7'] = df_exp_daily['amount'].shift(1).rolling(window=7, min_periods=1).mean()

    # Fill NaNs from shift
    df_exp_daily = df_exp_daily.fillna(0.0)

    # Prepare features for ML
    features = ['day_of_week', 'day_of_month', 'month', 'lag_1', 'lag_7', 'rolling_mean_7']
    X = df_exp_daily[features]
    y = df_exp_daily['amount']

    # Train model
    model, metrics, model_type = MLPipeline.train_and_select_regressor(X, y, user_id, "finance_expense")

    # Predict next 30 days
    last_known = df_exp_daily.tail(7).copy()
    predictions = []
    current_date = df_exp_daily['date'].max() + timedelta(days=1)

    for i in range(30):
        # Prepare feature vector
        day_of_week = current_date.weekday()
        day_of_month = current_date.day
        month = current_date.month
        lag_1 = predictions[-1] if len(predictions) >= 1 else last_known.iloc[-1]['amount']
        lag_7 = predictions[-7] if len(predictions) >= 7 else last_known.iloc[-7]['amount'] if len(last_known) >= 7 else last_known['amount'].mean()
        
        # rolling mean of last 7 predictions/actuals
        combined = list(last_known['amount'].values) + predictions
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

    # Align dates
    forecast_dates = pd.date_range(start=df_exp_daily['date'].max() + timedelta(days=1), periods=30, freq='D')
    forecast_df = pd.DataFrame({'date': forecast_dates, 'amount': predictions})

    # Prophet forecast
    prophet_forecast = None
    if PROPHET_AVAILABLE and len(df_exp_daily) >= 10:
        df_p = df_exp_daily[['date', 'amount']].copy()
        df_p.columns = ['ds', 'y']
        prophet_forecast = MLPipeline.forecast_prophet(df_p, 30)

    # Let's aggregate predictions to Weekly and Monthly
    predicted_monthly_expense = float(forecast_df['amount'].sum())
    predicted_weekly_expense = float(forecast_df['amount'].head(7).sum())
    
    # Historical monthly income and expenses
    current_month_start = datetime.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    current_month_exp = df_exp[df_exp['date'] >= current_month_start]['amount'].sum()
    current_month_inc = df_inc[df_inc['date'] >= current_month_start]['amount'].sum()

    # Expected total monthly expense = actual spent this month + predicted for the rest of the month
    today = datetime.now()
    days_in_month = pd.Period(today.strftime("%Y-%m")).days_in_month
    remaining_days = max(0, days_in_month - today.day)
    projected_rest = float(forecast_df['amount'].head(remaining_days).sum()) if remaining_days > 0 else 0.0
    projected_total_monthly_expense = float(current_month_exp) + projected_rest

    # Budget utilization
    budget_utilization = float(projected_total_monthly_expense / expense_target * 100) if expense_target > 0 else 0.0

    # Overspending probability using normal distribution of daily expenses
    daily_std = df_exp_daily['amount'].std()
    if daily_std > 0 and remaining_days > 0:
        total_std = np.sqrt(remaining_days) * daily_std
        z_score = (expense_target - projected_total_monthly_expense) / total_std
        overspending_prob = float(1.0 - stats.norm.cdf(z_score))
    else:
        overspending_prob = 1.0 if projected_total_monthly_expense > expense_target else 0.0

    # Monthly income prediction (average of income transactions or profile)
    if len(df_inc) > 0:
        pred_monthly_income = float(df_inc.groupby(df_inc['date'].dt.to_period('M'))['amount'].sum().mean())
        if np.isnan(pred_monthly_income) or pred_monthly_income == 0:
            pred_monthly_income = monthly_income
    else:
        pred_monthly_income = monthly_income

    # Savings prediction
    pred_monthly_savings = max(0.0, pred_monthly_income - predicted_monthly_expense)

    # Cash flow: monthly predicted income - monthly predicted expenses
    cash_flow_trend = pred_monthly_income - predicted_monthly_expense

    # Trends
    # Expense trend: comparing past 14 days with preceding 14 days
    past_14 = df_exp_daily.tail(14)['amount'].sum()
    prec_14 = df_exp_daily.tail(28).head(14)['amount'].sum()
    expense_trend_pct = float(((past_14 - prec_14) / prec_14 * 100)) if prec_14 > 0 else 0.0

    # Income trend: comparing this month's income to average
    income_trend_pct = 0.0
    if len(df_inc) > 0:
        past_inc = df_inc['amount'].sum()
        income_trend_pct = float(past_inc / len(df_inc))

    # Financial Health Score (0-100)
    # 40 pts for savings rate, 40 pts for budget adherence, 20 pts for spending trend
    savings_rate = (pred_monthly_income - predicted_monthly_expense) / pred_monthly_income if pred_monthly_income > 0 else 0.0
    savings_score = max(0.0, min(40.0, savings_rate * 100 * 0.8)) # 50% savings rate gives full 40 pts
    
    adherence_ratio = projected_total_monthly_expense / expense_target if expense_target > 0 else 1.0
    adherence_score = max(0.0, min(40.0, (1.0 - adherence_ratio) * 40.0 + 40.0)) if adherence_ratio <= 1.0 else max(0.0, 40.0 - (adherence_ratio - 1.0) * 40.0)
    
    trend_score = 20.0 if expense_trend_pct <= 0 else max(0.0, 20.0 - expense_trend_pct)
    financial_health_score = float(max(0.0, min(100.0, savings_score + adherence_score + trend_score)))

    # Generate Recommendations
    recommendations = []
    category_spends = df_exp.groupby('category')['amount'].sum().sort_values(ascending=False)
    if len(category_spends) > 0:
        top_cat = category_spends.index[0]
        top_cat_amt = float(category_spends.values[0])
        recommendations.append(f"Your highest spending category is '{top_cat}' (${top_cat_amt:.2f}). Consider reducing discretionary buys here.")

    if overspending_prob > 0.6:
        recommendations.append(f"High risk of exceeding your budget target next week! You are projected to spend ${projected_total_monthly_expense:.2f} against your ${expense_target:.2f} limit.")
    elif budget_utilization > 80:
        recommendations.append(f"Budget utilization is at {budget_utilization:.1f}%. Try capping non-essential transactions to maintain savings targets.")

    if savings_rate < 0.1:
        recommendations.append("Your predicted savings rate is below 10%. Automate a direct deposit to savings at the start of the month to build reserves.")
    else:
        recommendations.append(f"Excellent job! You are maintaining a healthy savings rate of {savings_rate*100:.1f}%. Consider investing your monthly surplus of ${pred_monthly_savings:.2f}.")

    # Format forecast list for response
    daily_forecast = [{'date': d.strftime('%Y-%m-%d'), 'amount': round(a, 2)} for d, a in zip(forecast_df['date'], forecast_df['amount'])]

    return {
        "daily_forecast": daily_forecast,
        "weekly_expense_prediction": round(predicted_weekly_expense, 2),
        "monthly_expense_prediction": round(predicted_monthly_expense, 2),
        "monthly_income_prediction": round(pred_monthly_income, 2),
        "monthly_savings_prediction": round(pred_monthly_savings, 2),
        "cash_flow_prediction": round(cash_flow_trend, 2),
        "expense_trend_pct": round(expense_trend_pct, 2),
        "income_trend_pct": round(income_trend_pct, 2),
        "budget_utilization": round(budget_utilization, 2),
        "overspending_probability": round(overspending_prob * 100, 2),
        "financial_health_score": round(financial_health_score, 2),
        "recommendations": recommendations,
        "prophet_forecast": prophet_forecast,
        "model_type": model_type,
        "confidence_score": round(metrics.get("confidence", 0.7) * 100, 2),
        "forecast_period": "Next 30 Days",
        "expected_accuracy": f"MAE: {metrics.get('mae', 0.0):.2f}"
    }

@router.get("/forecast/finance")
def get_forecast_finance(user_id: str = Depends(verify_jwt_auth)):
    # This acts as a GET accessor. In this app design, the predictions are cached/persisted in DB,
    # or Express can trigger the predict logic and pass results. For safety, this endpoint expects
    # Express to have run prediction or return placeholder data if queried directly.
    return {"message": "Forecast metrics retrieved via prediction flow"}

def create_finance_fallback(expense_target, monthly_income, reason, df_raw=None):
    # Generates a rule-based prediction when ML training lacks data
    predicted_monthly_expense = expense_target
    predicted_weekly_expense = expense_target / 4
    pred_monthly_income = monthly_income
    
    # Calculate actual spending from df_raw if present
    actual_spent = 0.0
    if df_raw is not None and not df_raw.empty:
        df_exp = df_raw[df_raw['type'] == 'EXPENSE']
        actual_spent = float(df_exp['amount'].sum())
        
    pred_monthly_savings = max(0.0, pred_monthly_income - predicted_monthly_expense)
    budget_util_pct = float(actual_spent / expense_target * 100) if expense_target > 0 else 0.0

    return {
        "daily_forecast": [{"date": (datetime.now() + timedelta(days=i)).strftime('%Y-%m-%d'), "amount": round(expense_target / 30, 2)} for i in range(30)],
        "weekly_expense_prediction": round(predicted_weekly_expense, 2),
        "monthly_expense_prediction": round(predicted_monthly_expense, 2),
        "monthly_income_prediction": round(pred_monthly_income, 2),
        "monthly_savings_prediction": round(pred_monthly_savings, 2),
        "cash_flow_prediction": round(pred_monthly_income - predicted_monthly_expense, 2),
        "expense_trend_pct": 0.0,
        "income_trend_pct": 0.0,
        "budget_utilization": round(budget_util_pct, 2),
        "overspending_probability": 50.0 if actual_spent > expense_target * 0.8 else 10.0,
        "financial_health_score": 75.0,
        "recommendations": [
            f"Note: {reason}. Keep logging transactions to enable advanced AI forecasting.",
            "Aim to save at least 20% of your income each month.",
            "Stay within your monthly spending target."
        ],
        "model_type": "Rule-Based Fallback",
        "confidence_score": 50.0,
        "forecast_period": "Next 30 Days",
        "expected_accuracy": "Low (Fallback Model)"
    }
