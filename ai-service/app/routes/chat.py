from fastapi import APIRouter, Depends, HTTPException, Header
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime
import os
import requests
import json
import jwt

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

class ChatPayloadSchema(BaseModel):
    transactions: List[TransactionSchema]
    sessions: List[SessionSchema]
    habits: List[HabitSchema]
    budgets: List[BudgetSchema]
    goals: List[GoalSchema]
    monthlyIncome: float
    monthlyExpenseTarget: float
    dailyStudyHoursTarget: float

class ChatRequest(BaseModel):
    query: str
    payload: ChatPayloadSchema

@router.post("/chat")
def handle_chat(req: ChatRequest, user_id: str = Depends(verify_jwt_auth)):
    query = req.query.strip().lower()
    payload = req.payload
    
    # 1. Compute deterministic figures
    total_income = sum([t.amount for t in payload.transactions if t.type.upper() == 'INCOME'])
    total_expense = sum([t.amount for t in payload.transactions if t.type.upper() == 'EXPENSE'])
    net_savings = total_income - total_expense
    
    # Calculate category breakdowns
    cat_breakdown = {}
    for t in payload.transactions:
        if t.type.upper() == 'EXPENSE':
            cat_breakdown[t.category] = cat_breakdown.get(t.category, 0.0) + t.amount
            
    largest_category = "None"
    largest_amount = 0.0
    if cat_breakdown:
        largest_category = max(cat_breakdown, key=cat_breakdown.get)
        largest_amount = cat_breakdown[largest_category]
        
    # Active goals
    active_goals_summary = []
    for g in payload.goals:
        if g.status.upper() == 'ACTIVE':
            rem = max(0.0, g.targetAmount - g.currentAmount)
            active_goals_summary.append(f"{g.goalName}: Target ${g.targetAmount:.2f}, Saved ${g.currentAmount:.2f}, Need ${rem:.2f}")

    # Study Sessions stats
    study_hours = sum([s.duration for s in payload.sessions]) / 60.0
    avg_study_rating = sum([s.productivityRating for s in payload.sessions]) / len(payload.sessions) if payload.sessions else 0.0
    
    # Check for Gemini API key
    gemini_key = os.getenv("GEMINI_API_KEY")
    if gemini_key:
        try:
            # Build context prompt
            context = f"""
            You are Antigravity, the AI Personal Productivity and Financial Digital Twin assistant.
            You are assisting a user. Here is the user's real, calculated backend data:
            - Monthly Income: ${payload.monthlyIncome:.2f}
            - General Monthly Expense Target: ${payload.monthlyExpenseTarget:.2f}
            - Total Logged Income: ${total_income:.2f}
            - Total Logged Expenses: ${total_expense:.2f}
            - Net Current Savings: ${net_savings:.2f}
            - Largest Expense Category: '{largest_category}' (Spent ${largest_amount:.2f})
            - Category Budgets: {json.dumps([{'category': b.category, 'limit': b.monthlyLimit, 'spent': b.currentSpending} for b in payload.budgets])}
            - Savings Goals: {json.dumps([{'name': g.goalName, 'target': g.targetAmount, 'current': g.currentAmount} for g in payload.goals])}
            - Study hours logged: {study_hours:.2f} hrs (Avg rating: {avg_study_rating:.1f}/5, target: {payload.dailyStudyHoursTarget} hrs/day)
            
            RULES:
            1. ONLY use the figures provided above. Do NOT hallucinate or calculate custom sums that differ from these facts.
            2. Be direct, natural, and helpful. Focus on actionable trade-offs and digital twin concepts (how money affects studying/habits).
            """
            
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={gemini_key}"
            headers = {"Content-Type": "application/json"}
            body = {
                "contents": [
                    {
                        "role": "user",
                        "parts": [{"text": f"{context}\n\nUser Question: {req.query}"}]
                    }
                ]
            }
            
            response = requests.post(url, headers=headers, json=body)
            if response.status_code == 200:
                res_data = response.json()
                text_reply = res_data['candidates'][0]['content']['parts'][0]['text']
                return {"reply": text_reply, "mode": "LLM"}
        except Exception as e:
            print("Gemini API call failed, falling back to rule-based parser:", e)

    # 2. Rule-Based Fallback Parser (Deterministic mode)
    reply = ""
    
    if "spend" in query or "expense" in query or "cost" in query:
        reply = f"This month, you have spent a total of **${total_expense:.2f}** against your target of **${payload.monthlyExpenseTarget:.2f}**."
        if cat_breakdown:
            reply += f"\nYour largest expense category is **{largest_category}**, where you spent **${largest_amount:.2f}**."
            
    elif "income" in query or "salary" in query or "earn" in query:
        reply = f"You have logged **${total_income:.2f}** in total income. Your profile monthly baseline income is **${payload.monthlyIncome:.2f}**."
        
    elif "savings" in query or "save" in query:
        reply = f"Your current net savings for this month is **${net_savings:.2f}** (Income: ${total_income:.2f} - Expenses: ${total_expense:.2f})."
        if active_goals_summary:
            reply += "\n\nHere are your active savings goals:\n" + "\n".join([f"- {g}" for g in active_goals_summary])
            
    elif "goal" in query or "emergency" in query or "laptop" in query:
        if active_goals_summary:
            reply = "Here are your active goals and current savings status:\n" + "\n".join([f"- {g}" for g in active_goals_summary])
        else:
            reply = "You do not have any active savings goals defined. You can create one in the Finance page!"
            
    elif "afford" in query:
        # Check if the user is asking about affording a purchase (e.g. afford 1200 or afford laptop)
        # Parse number from query if any
        words = query.split()
        amount_to_check = 0.0
        for w in words:
            try:
                # Remove dollar sign if present
                clean_w = w.replace('$', '').replace(',', '')
                amount_to_check = float(clean_w)
                break
            except ValueError:
                continue
                
        if amount_to_check > 0:
            if net_savings >= amount_to_check:
                reply = f"Yes, you can afford this purchase of **${amount_to_check:.2f}** using your net savings this month (**${net_savings:.2f}**). Doing so will leave you with **${(net_savings - amount_to_check):.2f}**."
            elif (net_savings + 2000) >= amount_to_check: # assume small reserve buffer
                reply = f"It will be tight. You have saved **${net_savings:.2f}** this month, so purchasing this for **${amount_to_check:.2f}** will require tapping into previous savings or emergency reserves by **${(amount_to_check - net_savings):.2f}**."
            else:
                reply = f"No, you cannot afford this purchase of **${amount_to_check:.2f}** right now. Your net savings this month is **${net_savings:.2f}**, leaving a deficit of **${(amount_to_check - net_savings):.2f}**. Consider delaying the purchase or adjusting your monthly expense limits."
        else:
            reply = "To tell you if you can afford a purchase, please specify the price (e.g., 'Can I afford a $600 laptop?')."
            
    elif "study" in query or "hours" in query or "productivity" in query:
        reply = f"You have logged **{study_hours:.1f} hours** of study time across the current period, with an average productivity rating of **{avg_study_rating:.1f}/5**."
        if study_hours < payload.dailyStudyHoursTarget * 5:
            reply += f"\nYou are currently behind your daily study target of **{payload.dailyStudyHoursTarget} hrs/day**. Consider setting aside distraction-free study blocks."
            
    else:
        # Default fallback general response
        reply = (
            "Hi there! I am your AI Digital Twin. I can assist with budgeting, goals, and productivity audits.\n\n"
            f"**Quick Stats Overview:**\n"
            f"- Monthly Income: ${payload.monthlyIncome:.2f}\n"
            f"- Logged Spending: ${total_expense:.2f} / Target: ${payload.monthlyExpenseTarget:.2f}\n"
            f"- Study Hours: {study_hours:.1f} hrs\n\n"
            "Try asking me things like:\n"
            "- *'How much did I spend this month?'*\n"
            "- *'Can I afford a $800 computer?'*\n"
            "- *'What is my largest expense category?'*\n"
            "- *'Show me my savings goals status.'*"
        )
        
    return {"reply": reply, "mode": "Deterministic (No API Key)"}
