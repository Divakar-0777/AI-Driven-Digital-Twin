from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import List, Optional
import pandas as pd
import numpy as np
from datetime import datetime, timedelta

from app.routes.finance import verify_jwt_auth, TransactionSchema, BudgetSchema, GoalSchema

router = APIRouter()

class SessionSchema(BaseModel):
    duration: int
    productivityRating: int
    date: str
    subject: str

class HabitSchema(BaseModel):
    name: str
    completed: bool
    date: str
    targetFrequency: str

class RecommendPayload(BaseModel):
    profile: dict
    transactions: List[TransactionSchema] = []
    sessions: List[SessionSchema] = []
    habits: List[HabitSchema] = []
    goals: List[GoalSchema] = []

@router.post("/recommend")
def generate_recommendations(payload: RecommendPayload, user_id: str = Depends(verify_jwt_auth)):
    monthly_income = payload.profile.get("monthlyIncome", 5000.0)
    monthly_expense_target = payload.profile.get("monthlyExpenseTarget", 2500.0)
    daily_study_target = payload.profile.get("dailyStudyHoursTarget", 2.5)

    recommendations = []

    # --- Finance Analysis ---
    txs = payload.transactions
    if txs:
        total_income = sum(t.amount for t in txs if t.type.upper() == 'INCOME')
        total_expense = sum(t.amount for t in txs if t.type.upper() == 'EXPENSE')
        net_savings = total_income - total_expense
        savings_rate = net_savings / total_income if total_income > 0 else 0

        cat_breakdown = {}
        for t in txs:
            if t.type.upper() == 'EXPENSE':
                cat_breakdown[t.category] = cat_breakdown.get(t.category, 0.0) + t.amount

        if cat_breakdown:
            top_cat = max(cat_breakdown, key=cat_breakdown.get)
            top_amt = cat_breakdown[top_cat]
            if top_amt > monthly_expense_target * 0.3:
                recommendations.append({
                    "category": "FINANCE",
                    "recommendationText": f"Your '{top_cat}' spending (${top_amt:.0f}) is disproportionately high. Consider reducing discretionary purchases in this category by 15-20%.",
                    "reason": f"'{top_cat}' accounts for more than 30% of total expenses",
                    "expectedImpact": "Could save $100-300/month depending on category",
                    "risk": "LOW",
                    "suggestedAction": f"Review recent '{top_cat}' transactions and identify non-essential items",
                    "impactLevel": "MEDIUM"
                })

        if savings_rate < 0.2 and total_income > 0:
            recommendations.append({
                "category": "FINANCE",
                "recommendationText": f"Your savings rate is {savings_rate*100:.1f}%, below the recommended 20%. Try automating a transfer of at least 20% of income to savings on payday.",
                "reason": "Savings rate below 20% threshold",
                "expectedImpact": "Build financial resilience and reach goals faster",
                "risk": "LOW",
                "suggestedAction": "Set up automatic savings transfer",
                "impactLevel": "HIGH"
            })
        elif savings_rate >= 0.3:
            recommendations.append({
                "category": "FINANCE",
                "recommendationText": f"Excellent! Your savings rate of {savings_rate*100:.1f}% is well above average. Consider diversifying into index funds or increasing contributions to your financial goals.",
                "reason": "Strong savings rate above 30%",
                "expectedImpact": "Accelerate goal achievement and wealth building",
                "risk": "LOW",
                "suggestedAction": "Review investment options for surplus income",
                "impactLevel": "MEDIUM"
            })

    # --- Study Analysis ---
    sessions = payload.sessions
    if sessions:
        total_minutes = sum(s.duration for s in sessions)
        total_hours = total_minutes / 60.0
        avg_rating = sum(s.productivityRating for s in sessions) / len(sessions) if sessions else 0
        avg_hours_per_session = total_minutes / len(sessions) / 60.0 if sessions else 0

        if avg_rating < 3.5:
            recommendations.append({
                "category": "STUDY",
                "recommendationText": f"Your average study productivity is {avg_rating:.1f}/5. Try the Pomodoro technique (25 min focused study, 5 min break) to improve focus and retention.",
                "reason": "Average productivity rating below 3.5/5",
                "expectedImpact": "Could improve retention by 20-30%",
                "risk": "LOW",
                "suggestedAction": "Implement Pomodoro technique in next 3 study sessions",
                "impactLevel": "HIGH"
            })

        # Subject analysis
        subject_hours = {}
        for s in sessions:
            subject_hours[s.subject] = subject_hours.get(s.subject, 0) + s.duration / 60.0
        if subject_hours:
            weakest = min(subject_hours, key=subject_hours.get)
            strongest = max(subject_hours, key=subject_hours.get)
            if subject_hours[weakest] < subject_hours[strongest] * 0.5:
                recommendations.append({
                    "category": "STUDY",
                    "recommendationText": f"You're spending significantly less time on '{weakest}' compared to '{strongest}'. Consider allocating more balanced study time across subjects.",
                    "reason": f"'{weakest}' has less than 50% of '{strongest}' study time",
                    "expectedImpact": "More balanced skill development",
                    "risk": "LOW",
                    "suggestedAction": f"Schedule dedicated '{weakest}' study blocks",
                    "impactLevel": "MEDIUM"
                })

    # --- Habit Analysis ---
    habits = payload.habits
    if habits:
        habit_names = list(set(h.name for h in habits))
        for name in habit_names:
            habit_data = [h for h in habits if h.name == name]
            completed_count = sum(1 for h in habit_data if h.completed)
            total_count = len(habit_data)
            completion_rate = completed_count / total_count * 100 if total_count > 0 else 0

            if completion_rate < 60:
                recommendations.append({
                    "category": "HABITS",
                    "recommendationText": f"Your completion rate for '{name}' is {completion_rate:.0f}%. Try linking it to an existing habit (habit stacking) to improve consistency.",
                    "reason": f"Habit completion rate below 60%",
                    "expectedImpact": "Could improve consistency by 20-30%",
                    "risk": "LOW",
                    "suggestedAction": f"Attach '{name}' to an existing daily routine",
                    "impactLevel": "MEDIUM"
                })
            elif completion_rate >= 90:
                recommendations.append({
                    "category": "HABITS",
                    "recommendationText": f"Outstanding consistency on '{name}' ({completion_rate:.0f}% completion)! You might consider increasing the challenge or adding a complementary habit.",
                    "reason": "Habit completion rate above 90%",
                    "expectedImpact": "Continuous improvement and growth",
                    "risk": "LOW",
                    "suggestedAction": "Consider progressing to a more challenging version of this habit",
                    "impactLevel": "LOW"
                })

    # --- Goal Analysis ---
    goals = payload.goals
    if goals:
        for g in goals:
            if g.status.upper() == 'ACTIVE':
                rem = max(0.0, g.targetAmount - g.currentAmount)
                target_dt = None
                try:
                    target_dt = pd.to_datetime(g.targetDate).tz_localize(None)
                except:
                    pass

                if target_dt:
                    days_left = (target_dt - datetime.now()).days
                    months_left = max(1.0, days_left / 30.0)
                    req_monthly = rem / months_left

                    if g.monthlyContribution < req_monthly * 0.8:
                        recommendations.append({
                            "category": "GOALS",
                            "recommendationText": f"Your goal '{g.goalName}' requires ${req_monthly:.0f}/month to meet the deadline, but you're contributing ${g.monthlyContribution:.0f}/month. Increase contributions or extend the deadline.",
                            "reason": f"Monthly contribution is below required amount",
                            "expectedImpact": "Stay on track to meet goal deadline",
                            "risk": "MEDIUM",
                            "suggestedAction": f"Increase monthly contribution to ${req_monthly:.0f}",
                            "impactLevel": "HIGH"
                        })

                if rem == 0:
                    recommendations.append({
                        "category": "GOALS",
                        "recommendationText": f"Congratulations! You've achieved your goal '{g.goalName}'! Consider setting a new goal to maintain momentum.",
                        "reason": "Goal fully achieved",
                        "expectedImpact": "Maintain motivation with new challenge",
                        "risk": "LOW",
                        "suggestedAction": "Set your next goal",
                        "impactLevel": "LOW"
                    })

    if not recommendations:
        recommendations.append({
            "category": "GENERAL",
            "recommendationText": "Keep up the great work! Your digital twin shows consistent positive patterns. Continue maintaining your current routines and consider setting new stretch goals.",
            "reason": "No significant issues detected",
            "expectedImpact": "Maintain current positive trajectory",
            "risk": "LOW",
            "suggestedAction": "Review and set new goals",
            "impactLevel": "LOW"
        })

    return {"recommendations": recommendations, "total": len(recommendations)}
