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
    title: str = "Transaction"
    amount: float
    category: str
    type: str  # 'INCOME' or 'EXPENSE'
    date: str
    paymentMethod: str
    recurring: Optional[bool] = False
    recurrenceFrequency: Optional[str] = None

class FinanceProfileSchema(BaseModel):
    monthlyIncome: float
    monthlyExpenseTarget: float

class BudgetSchema(BaseModel):
    category: str
    monthlyLimit: float
    currentSpending: float
    period: str

class GoalSchema(BaseModel):
    goalName: str
    targetAmount: float
    currentAmount: float
    monthlyContribution: float
    targetDate: str
    goalCategory: str
    status: str

class FinancePredictPayload(BaseModel):
    transactions: List[TransactionSchema]
    profile: FinanceProfileSchema
    budgets: Optional[List[BudgetSchema]] = []
    goals: Optional[List[GoalSchema]] = []

class SimulationPayload(BaseModel):
    transactions: List[TransactionSchema]
    profile: FinanceProfileSchema
    budgets: Optional[List[BudgetSchema]] = []
    goals: Optional[List[GoalSchema]] = []
    scenarioName: str
    monthlyIncomeChange: float = 0.0
    monthlyExpenseChange: float = 0.0
    oneTimePurchaseAmount: float = 0.0

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
    budgets = payload.budgets or []
    goals = payload.goals or []
    
    expense_target = profile.monthlyExpenseTarget or 2500.0
    monthly_income = profile.monthlyIncome or 5000.0

    if not txs:
        return create_finance_fallback(expense_target, monthly_income, "No transactions found", budgets=budgets, goals=goals)

    df_raw = pd.DataFrame([tx.model_dump() for tx in txs])
    df_raw['date'] = pd.to_datetime(df_raw['date']).dt.tz_localize(None)
    df_raw['amount'] = df_raw['amount'].astype(float)

    # Sort by date
    df_raw = df_raw.sort_values('date')

    # Filter income and expenses
    df_exp = df_raw[df_raw['type'] == 'EXPENSE'].copy()
    df_inc = df_raw[df_raw['type'] == 'INCOME'].copy()

    # Anomaly Detection: Z-Score based anomalies
    anomalies = []
    if not df_exp.empty:
        for cat, group in df_exp.groupby('category'):
            if len(group) >= 3:
                cat_mean = group['amount'].mean()
                cat_std = group['amount'].std()
                if cat_std > 0:
                    for idx, row in group.iterrows():
                        z = (row['amount'] - cat_mean) / cat_std
                        if z > 2.5:  # High spending anomaly
                            anomalies.append({
                                "date": row['date'].strftime('%Y-%m-%d'),
                                "title": row['title'],
                                "category": cat,
                                "amount": row['amount'],
                                "z_score": round(z, 2),
                                "reason": f"Spending of ${row['amount']:.2f} is significantly higher than your average for {cat} (${cat_mean:.2f})."
                            })

    # If extremely few data points, fallback
    if len(df_exp) < 3:
        return create_finance_fallback(expense_target, monthly_income, "Insufficient expense history for ML modeling", df_raw, budgets, goals, anomalies)

    # Daily aggregation
    df_exp_daily = df_exp.groupby(df_exp['date'].dt.normalize())['amount'].sum().reset_index()
    df_exp_daily.columns = ['date', 'amount']

    # Generate a full date range to fill missing days with 0 expenses
    date_range = pd.date_range(start=df_exp_daily['date'].min(), end=df_exp_daily['date'].max(), freq='D')
    df_exp_daily = df_exp_daily.set_index('date').reindex(date_range, fill_value=0.0).reset_index()
    df_exp_daily.columns = ['date', 'amount']

    # Feature Engineering
    df_exp_daily['day_of_week'] = df_exp_daily['date'].dt.dayofweek
    df_exp_daily['day_of_month'] = df_exp_daily['date'].dt.day
    df_exp_daily['month'] = df_exp_daily['date'].dt.month
    df_exp_daily['lag_1'] = df_exp_daily['amount'].shift(1)
    df_exp_daily['lag_7'] = df_exp_daily['amount'].shift(7)
    df_exp_daily['rolling_mean_7'] = df_exp_daily['amount'].shift(1).rolling(window=7, min_periods=1).mean()
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
        day_of_week = current_date.weekday()
        day_of_month = current_date.day
        month = current_date.month
        lag_1 = predictions[-1] if len(predictions) >= 1 else last_known.iloc[-1]['amount']
        lag_7 = predictions[-7] if len(predictions) >= 7 else last_known.iloc[-7]['amount'] if len(last_known) >= 7 else last_known['amount'].mean()
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

    forecast_dates = pd.date_range(start=df_exp_daily['date'].max() + timedelta(days=1), periods=30, freq='D')
    forecast_df = pd.DataFrame({'date': forecast_dates, 'amount': predictions})

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

    today = datetime.now()
    days_in_month = pd.Period(today.strftime("%Y-%m")).days_in_month
    remaining_days = max(0, days_in_month - today.day)
    projected_rest = float(forecast_df['amount'].head(remaining_days).sum()) if remaining_days > 0 else 0.0
    projected_total_monthly_expense = float(current_month_exp) + projected_rest

    # Budget utilization
    budget_utilization = float(projected_total_monthly_expense / expense_target * 100) if expense_target > 0 else 0.0

    # Overspending probability
    daily_std = df_exp_daily['amount'].std()
    if daily_std > 0 and remaining_days > 0:
        total_std = np.sqrt(remaining_days) * daily_std
        z_score = (expense_target - projected_total_monthly_expense) / total_std
        overspending_prob = float(1.0 - stats.norm.cdf(z_score))
    else:
        overspending_prob = 1.0 if projected_total_monthly_expense > expense_target else 0.0

    # Monthly income prediction
    if len(df_inc) > 0:
        pred_monthly_income = float(df_inc.groupby(df_inc['date'].dt.to_period('M'))['amount'].sum().mean())
        if np.isnan(pred_monthly_income) or pred_monthly_income == 0:
            pred_monthly_income = monthly_income
    else:
        pred_monthly_income = monthly_income

    pred_monthly_savings = max(0.0, pred_monthly_income - predicted_monthly_expense)
    cash_flow_trend = pred_monthly_income - predicted_monthly_expense

    # Expense trend
    past_14 = df_exp_daily.tail(14)['amount'].sum()
    prec_14 = df_exp_daily.tail(28).head(14)['amount'].sum()
    expense_trend_pct = float(((past_14 - prec_14) / prec_14 * 100)) if prec_14 > 0 else 0.0

    # Goals Prediction
    goal_predictions = []
    for g in goals:
        if g.status.upper() != 'ACTIVE':
            continue
        target_amt = g.targetAmount
        current_amt = g.currentAmount
        rem_amt = max(0.0, target_amt - current_amt)
        monthly_cont = g.monthlyContribution
        
        effective_cont = monthly_cont
        if effective_cont <= 0:
            # Default to surplus if no goal contribution specified
            effective_cont = max(50.0, pred_monthly_savings / max(1.0, len(goals)))
            
        months_to_complete = rem_amt / effective_cont if effective_cont > 0 else 999.0
        
        target_date_dt = pd.to_datetime(g.targetDate).tz_localize(None)
        time_left_months = (target_date_dt - datetime.now()).days / 30.4
        
        status_eval = "ON_TRACK"
        if months_to_complete > time_left_months:
            status_eval = "AT_RISK"
        if rem_amt == 0:
            status_eval = "ACHIEVED"
            
        est_completion = datetime.now() + timedelta(days=int(months_to_complete * 30.4))
        req_cont = rem_amt / max(1.0, time_left_months)
        
        goal_predictions.append({
            "goalName": g.goalName,
            "targetAmount": target_amt,
            "currentAmount": current_amt,
            "remainingAmount": rem_amt,
            "monthlyContribution": monthly_cont,
            "estimatedMonths": round(months_to_complete, 1),
            "estimatedCompletionDate": est_completion.strftime('%Y-%m-%d'),
            "requiredMonthlyContribution": round(req_cont, 2),
            "status": status_eval
        })

    # Emergency fund months calculation
    em_fund_months = 0.0
    em_goals = [g for g in goals if 'emergency' in g.goalName.lower()]
    if em_goals:
        em_fund_months = em_goals[0].currentAmount / max(100.0, expense_target)
    else:
        em_fund_months = pred_monthly_savings * 3 / max(100.0, expense_target)

    # Financial Health Score & Breakout
    savings_rate = (pred_monthly_income - predicted_monthly_expense) / pred_monthly_income if pred_monthly_income > 0 else 0.0
    savings_score = max(0.0, min(40.0, savings_rate * 100 * 0.8)) # 50% rate = 40 pts
    
    adherence_ratio = projected_total_monthly_expense / expense_target if expense_target > 0 else 1.0
    adherence_score = max(0.0, min(40.0, (1.0 - adherence_ratio) * 40.0 + 40.0)) if adherence_ratio <= 1.0 else max(0.0, 40.0 - (adherence_ratio - 1.0) * 40.0)
    
    trend_score = 20.0 if expense_trend_pct <= 0 else max(0.0, 20.0 - expense_trend_pct)
    financial_health_score = float(max(0.0, min(100.0, savings_score + adherence_score + trend_score)))

    health_breakout = {
        "score": round(financial_health_score, 2),
        "indicators": {
            "savingsRate": "Good" if savings_rate >= 0.2 else "Moderate" if savings_rate >= 0.1 else "Poor",
            "budgetAdherence": "Good" if budget_utilization <= 90 else "Moderate" if budget_utilization <= 100 else "Poor",
            "emergencyFund": "Good" if em_fund_months >= 6 else "Moderate" if em_fund_months >= 3 else "Needs Improvement",
            "spendingVolatility": "Stable" if expense_trend_pct < 15 else "Volatile"
        }
    }

    # Generate Recommendations
    recommendations = []
    category_spends = df_exp.groupby('category')['amount'].sum().sort_values(ascending=False)
    if len(category_spends) > 0:
        top_cat = category_spends.index[0]
        top_cat_amt = float(category_spends.values[0])
        recommendations.append(f"Your highest spending category is '{top_cat}' (${top_cat_amt:.2f}). Consider reducing discretionary buys here.")

    if overspending_prob > 0.6:
        recommendations.append(f"High risk of exceeding your budget target! You are projected to spend ${projected_total_monthly_expense:.2f} against your ${expense_target:.2f} limit.")
    elif budget_utilization > 80:
        recommendations.append(f"Budget utilization is at {budget_utilization:.1f}%. Try capping non-essential transactions to maintain savings targets.")

    if savings_rate < 0.1:
        recommendations.append("Your predicted savings rate is below 10%. Automate a direct deposit to savings at the start of the month to build reserves.")
    else:
        recommendations.append(f"Excellent job! You are maintaining a healthy savings rate of {savings_rate*100:.1f}%. Consider investing your monthly surplus of ${pred_monthly_savings:.2f}.")

    for gp in goal_predictions:
        if gp["status"] == "AT_RISK":
            recommendations.append(f"Your savings goal '{gp['goalName']}' is at risk! Increase monthly savings to ${gp['requiredMonthlyContribution']:.2f} to hit your date.")

    daily_forecast = [{'date': d.strftime('%Y-%m-%d'), 'amount': round(a, 2)} for d, a in zip(forecast_df['date'], forecast_df['amount'])]

    return {
        "daily_forecast": daily_forecast,
        "weekly_expense_prediction": round(predicted_weekly_expense, 2),
        "monthly_expense_prediction": round(predicted_monthly_expense, 2),
        "monthly_income_prediction": round(pred_monthly_income, 2),
        "monthly_savings_prediction": round(pred_monthly_savings, 2),
        "cash_flow_prediction": round(cash_flow_trend, 2),
        "expense_trend_pct": round(expense_trend_pct, 2),
        "income_trend_pct": 0.0,
        "budget_utilization": round(budget_utilization, 2),
        "overspending_probability": round(overspending_prob * 100, 2),
        "financial_health_score": round(financial_health_score, 2),
        "recommendations": recommendations,
        "prophet_forecast": prophet_forecast,
        "model_type": model_type,
        "confidence_score": round(metrics.get("confidence", 0.7) * 100, 2),
        "forecast_period": "Next 30 Days",
        "expected_accuracy": f"MAE: {metrics.get('mae', 0.0):.2f}",
        "anomalies": anomalies,
        "goal_predictions": goal_predictions,
        "health_breakout": health_breakout
    }

@router.post("/simulate/finance")
def simulate_finance(payload: SimulationPayload, user_id: str = Depends(verify_jwt_auth)):
    txs = payload.transactions
    profile = payload.profile
    goals = payload.goals or []
    
    # Calculate baseline
    monthly_income = profile.monthlyIncome
    monthly_expense = profile.monthlyExpenseTarget
    
    if txs:
        df_raw = pd.DataFrame([tx.model_dump() for tx in txs])
        df_exp = df_raw[df_raw['type'] == 'EXPENSE']
        if not df_exp.empty:
            df_exp['date'] = pd.to_datetime(df_exp['date'])
            current_month_start = datetime.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            month_exp = df_exp[df_exp['date'] >= current_month_start]['amount'].sum()
            monthly_expense = float(month_exp) if month_exp > 0 else monthly_expense

    # Apply changes
    proj_income = monthly_income + payload.monthlyIncomeChange
    proj_expense = monthly_expense + payload.monthlyExpenseChange
    proj_savings = proj_income - proj_expense
    
    # Balance forecast (12 months projection)
    base_balance = sum([Number(t.amount) for t in txs if t.type == 'INCOME']) - sum([Number(t.amount) for t in txs if t.type == 'EXPENSE']) if txs else 5000.0
    
    # Calculate impact of one-time purchase
    proj_balance_12m = base_balance + (proj_savings * 12) - payload.oneTimePurchaseAmount
    
    goal_impacts = []
    for g in goals:
        if g.status.upper() != 'ACTIVE':
            continue
        rem = g.targetAmount - g.currentAmount
        # Baseline months
        base_months = rem / g.monthlyContribution if g.monthlyContribution > 0 else 999.0
        # Simulated months (using custom contribution increase if savings rate is higher)
        ratio = proj_savings / max(100.0, monthly_income - monthly_expense) if (monthly_income - monthly_expense) > 0 else 1.0
        sim_contribution = g.monthlyContribution * ratio
        sim_months = rem / sim_contribution if sim_contribution > 0 else 999.0
        
        goal_impacts.append({
            "goalName": g.goalName,
            "baselineMonths": round(base_months, 1),
            "simulatedMonths": round(sim_months, 1),
            "monthsSaved": round(base_months - sim_months, 1)
        })

    risk_level = "LOW"
    if proj_savings < 0:
        risk_level = "HIGH"
    elif proj_savings < proj_income * 0.1:
        risk_level = "MODERATE"

    return {
        "scenarioName": payload.scenarioName,
        "projectedIncome": round(proj_income, 2),
        "projectedExpenses": round(proj_expense, 2),
        "projectedSavings": round(proj_savings, 2),
        "projectedBalance": round(proj_balance_12m, 2),
        "goalImpact": goal_impacts,
        "riskLevel": risk_level
    }

@router.get("/forecast/finance")
def get_forecast_finance(user_id: str = Depends(verify_jwt_auth)):
    return {"message": "Forecast metrics retrieved via prediction flow"}

def create_finance_fallback(expense_target, monthly_income, reason, df_raw=None, budgets=[], goals=[], anomalies=[]):
    predicted_monthly_expense = expense_target
    predicted_weekly_expense = expense_target / 4
    pred_monthly_income = monthly_income
    
    actual_spent = 0.0
    if df_raw is not None and not df_raw.empty:
        df_exp = df_raw[df_raw['type'] == 'EXPENSE']
        actual_spent = float(df_exp['amount'].sum())
        
    pred_monthly_savings = max(0.0, pred_monthly_income - predicted_monthly_expense)
    budget_util_pct = float(actual_spent / expense_target * 100) if expense_target > 0 else 0.0

    goal_predictions = []
    for g in goals:
        rem_amt = max(0.0, g.targetAmount - g.currentAmount)
        goal_predictions.append({
            "goalName": g.goalName,
            "targetAmount": g.targetAmount,
            "currentAmount": g.currentAmount,
            "remainingAmount": rem_amt,
            "monthlyContribution": g.monthlyContribution,
            "estimatedMonths": round(rem_amt / max(50.0, g.monthlyContribution), 1),
            "estimatedCompletionDate": (datetime.now() + timedelta(days=180)).strftime('%Y-%m-%d'),
            "requiredMonthlyContribution": round(rem_amt / 6, 2),
            "status": "ON_TRACK"
        })

    health_breakout = {
        "score": 75.0,
        "indicators": {
            "savingsRate": "Moderate",
            "budgetAdherence": "Good" if budget_util_pct <= 90 else "Poor",
            "emergencyFund": "Needs Improvement",
            "spendingVolatility": "Stable"
        }
    }

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
        "expected_accuracy": "Low (Fallback Model)",
        "anomalies": anomalies,
        "goal_predictions": goal_predictions,
        "health_breakout": health_breakout
    }
