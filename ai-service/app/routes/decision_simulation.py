from fastapi import APIRouter, Depends, HTTPException, Header
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import os
import jwt

from app.routes.finance import verify_jwt_auth, TransactionSchema, BudgetSchema, GoalSchema
from app.routes.study import StudySessionSchema
from app.routes.habits import HabitSchema

router = APIRouter()

# Schema definitions
class DecisionSchema(BaseModel):
    decisionName: str
    category: str
    action: str
    parameters: Dict[str, Any]
    affectedDomains: List[str]

class DecisionSimulationPayload(BaseModel):
    profile: Dict[str, Any]
    goals: List[GoalSchema] = []
    transactions: List[TransactionSchema] = []
    sessions: List[StudySessionSchema] = []
    habits: List[HabitSchema] = []
    decision: DecisionSchema
    horizon: str
    selectedGoals: List[str] = []
    userPriorities: Dict[str, float] = {}

def parse_horizon(horizon_str: str) -> int:
    h = horizon_str.lower()
    if "1 month" in h:
        return 1
    elif "3 month" in h:
        return 3
    elif "6 month" in h:
        return 6
    elif "1 year" in h:
        return 12
    elif "3 year" in h:
        return 36
    elif "5 year" in h:
        return 60
    # Fallback to number extraction
    try:
        nums = [int(s) for s in h.split() if s.isdigit()]
        if nums:
            if "year" in h:
                return nums[0] * 12
            return nums[0]
    except Exception:
        pass
    return 12 # default to 1 year

@router.post("/simulate/decision")
def simulate_decision(payload: DecisionSimulationPayload, user_id: str = Depends(verify_jwt_auth)):
    decision = payload.decision
    horizon_months = parse_horizon(payload.horizon)
    priorities = payload.userPriorities
    
    # 1. Base User Profile Inputs
    monthly_income = float(payload.profile.get("monthlyIncome", 5000.0))
    monthly_expense = float(payload.profile.get("monthlyExpenseTarget", 2500.0))
    daily_study_hours_target = float(payload.profile.get("dailyStudyHoursTarget", 2.5))
    
    # Estimate baseline values from historical transactions
    txs = payload.transactions
    avg_monthly_income = monthly_income
    avg_monthly_expense = monthly_expense
    
    if txs:
      df_raw = pd.DataFrame([t.model_dump() for t in txs])
      df_raw['date'] = pd.to_datetime(df_raw['date']).dt.tz_localize(None)
      # Last 3 months average income/expenses
      three_months_ago = datetime.now() - timedelta(days=90)
      df_recent = df_raw[df_raw['date'] >= three_months_ago]
      if not df_recent.empty:
        df_inc = df_recent[df_recent['type'] == 'INCOME']
        df_exp = df_recent[df_recent['type'] == 'EXPENSE']
        if not df_inc.empty:
          avg_monthly_income = float(df_inc['amount'].sum() / 3.0)
        if not df_exp.empty:
          avg_monthly_expense = float(df_exp['amount'].sum() / 3.0)
    
    # Estimate baseline study hours
    sessions = payload.sessions
    avg_study_hours_weekly = daily_study_hours_target * 7.0
    avg_productivity_rating = 3.5
    if sessions:
      df_ses = pd.DataFrame([s.model_dump() for s in sessions])
      df_ses['date'] = pd.to_datetime(df_ses['date']).dt.tz_localize(None)
      three_months_ago = datetime.now() - timedelta(days=90)
      df_recent_ses = df_ses[df_ses['date'] >= three_months_ago]
      if not df_recent_ses.empty:
        avg_study_hours_weekly = float(df_recent_ses['duration'].sum() / 60.0 / 12.0) # total hours / 12 weeks
        avg_productivity_rating = float(df_recent_ses['productivityRating'].mean())

    # Estimate habit completion
    habits = payload.habits
    baseline_habit_completion = 50.0
    if habits:
        completed = sum([1 for h in habits if h.completed])
        baseline_habit_completion = float(completed / len(habits) * 100.0) if len(habits) > 0 else 50.0

    # Current Net Savings Baseline
    baseline_monthly_savings = max(0.0, avg_monthly_income - avg_monthly_expense)
    
    # Calculate current balance from transactions
    current_balance = 5000.0
    if txs:
        inc_sum = sum([float(t.amount) for t in txs if t.type == 'INCOME'])
        exp_sum = sum([float(t.amount) for t in txs if t.type == 'EXPENSE'])
        current_balance = inc_sum - exp_sum

    # 2. Scenario Generation
    scenarios = []
    
    # Baseline Scenario (always present)
    scenarios.append({
        "scenario_id": "0",
        "scenario_name": "Current Path",
        "assumptions": ["Maintain current lifestyle", "No new major financial purchases", "Study routine remains unchanged"],
        "actions": [],
        "affected_variables": [],
        "simulation_horizon": f"{horizon_months} months",
        "changes": {
            "monthly_income_change": 0.0,
            "monthly_expense_change": 0.0,
            "one_time_cost": 0.0,
            "delay_months": 0,
            "study_hours_change": 0.0,
            "study_prod_multiplier": 1.0,
            "habit_completion_change": 0.0
        }
    })
    
    # Generate alternatives depending on the action
    action = decision.action.lower()
    cost = float(decision.parameters.get("purchase_cost", 0.0) or decision.parameters.get("cost", 0.0) or 0.0)
    
    if action == "purchase":
        # Scenario A: Budget version (e.g. cheaper option)
        scenarios.append({
            "scenario_id": "A",
            "scenario_name": f"Budget Alternative (₹{int(cost * 0.65):,})",
            "assumptions": ["Purchase a lower-cost model", "Less financial impact", "Moderate productivity improvement"],
            "actions": [f"Purchase item for ₹{int(cost * 0.65):,} in Month 1"],
            "affected_variables": ["savings", "study_productivity"],
            "simulation_horizon": f"{horizon_months} months",
            "changes": {
                "monthly_income_change": 0.0,
                "monthly_expense_change": 0.0,
                "one_time_cost": cost * 0.65,
                "delay_months": 0,
                "study_hours_change": 0.0,
                "study_prod_multiplier": 1.08,  # +8% productivity
                "habit_completion_change": 2.0
            }
        })
        
        # Scenario B: Proposed purchase
        scenarios.append({
            "scenario_id": "B",
            "scenario_name": f"Proposed Purchase (₹{int(cost):,})",
            "assumptions": ["Proceed with the planned purchase", "Immediate cash outflow", "High productivity improvement"],
            "actions": [f"Purchase item for ₹{int(cost):,} in Month 1"],
            "affected_variables": ["savings", "study_productivity"],
            "simulation_horizon": f"{horizon_months} months",
            "changes": {
                "monthly_income_change": 0.0,
                "monthly_expense_change": 0.0,
                "one_time_cost": cost,
                "delay_months": 0,
                "study_hours_change": 0.0,
                "study_prod_multiplier": 1.15,  # +15% productivity
                "habit_completion_change": 5.0
            }
        })
        
        # Scenario C: Premium version
        scenarios.append({
            "scenario_id": "C",
            "scenario_name": f"Premium Version (₹{int(cost * 1.35):,})",
            "assumptions": ["Buy a higher-end premium model", "Significant cash outflow", "Maximum productivity improvement"],
            "actions": [f"Purchase premium item for ₹{int(cost * 1.35):,} in Month 1"],
            "affected_variables": ["savings", "study_productivity"],
            "simulation_horizon": f"{horizon_months} months",
            "changes": {
                "monthly_income_change": 0.0,
                "monthly_expense_change": 0.0,
                "one_time_cost": cost * 1.35,
                "delay_months": 0,
                "study_hours_change": 0.0,
                "study_prod_multiplier": 1.20,  # +20% productivity
                "habit_completion_change": 7.0
            }
        })
        
        # Scenario D: Delayed purchase
        scenarios.append({
            "scenario_id": "D",
            "scenario_name": f"Delay Purchase by 3 Months",
            "assumptions": ["Save for 3 months first", "Minimize immediate risk", "Delay productivity benefits"],
            "actions": [f"Purchase item for ₹{int(cost):,} in Month 3"],
            "affected_variables": ["savings", "study_productivity"],
            "simulation_horizon": f"{horizon_months} months",
            "changes": {
                "monthly_income_change": 0.0,
                "monthly_expense_change": 0.0,
                "one_time_cost": cost,
                "delay_months": 3,
                "study_hours_change": 0.0,
                "study_prod_multiplier": 1.15, # starts later
                "habit_completion_change": 5.0
            }
        })
        
    elif action == "recurring_expense_change" or action == "expense_change":
        expense_change = float(decision.parameters.get("expense_change", 0.0) or decision.parameters.get("monthly_expense_change", 0.0) or 0.0)
        
        # Scenario A: Moderate change
        scenarios.append({
            "scenario_id": "A",
            "scenario_name": f"Moderate expense shift (₹{int(expense_change * 0.6):,}/mo)",
            "assumptions": ["Implement a moderate change", "Lesser impact on comfort/lifestyle"],
            "actions": [f"Adjust recurring expenses by ₹{int(expense_change * 0.6):,}/month"],
            "affected_variables": ["savings"],
            "simulation_horizon": f"{horizon_months} months",
            "changes": {
                "monthly_income_change": 0.0,
                "monthly_expense_change": expense_change * 0.6,
                "one_time_cost": 0.0,
                "delay_months": 0,
                "study_hours_change": 0.0,
                "study_prod_multiplier": 1.0,
                "habit_completion_change": 0.0
            }
        })
        
        # Scenario B: Proposed change
        scenarios.append({
            "scenario_id": "B",
            "scenario_name": f"Proposed expense change (₹{int(expense_change):,}/mo)",
            "assumptions": ["Apply the full proposed monthly expense change"],
            "actions": [f"Adjust recurring expenses by ₹{int(expense_change):,}/month"],
            "affected_variables": ["savings"],
            "simulation_horizon": f"{horizon_months} months",
            "changes": {
                "monthly_income_change": 0.0,
                "monthly_expense_change": expense_change,
                "one_time_cost": 0.0,
                "delay_months": 0,
                "study_hours_change": 0.0,
                "study_prod_multiplier": 1.0,
                "habit_completion_change": 0.0
            }
        })
        
        # Scenario C: Aggressive change
        scenarios.append({
            "scenario_id": "C",
            "scenario_name": f"Aggressive expense shift (₹{int(expense_change * 1.4):,}/mo)",
            "assumptions": ["Maximized budgeting or significant spending increase", "Higher impact on daily lifestyle"],
            "actions": [f"Adjust recurring expenses by ₹{int(expense_change * 1.4):,}/month"],
            "affected_variables": ["savings"],
            "simulation_horizon": f"{horizon_months} months",
            "changes": {
                "monthly_income_change": 0.0,
                "monthly_expense_change": expense_change * 1.4,
                "one_time_cost": 0.0,
                "delay_months": 0,
                "study_hours_change": 0.0,
                "study_prod_multiplier": 1.0,
                "habit_completion_change": 0.0
            }
        })
        
    elif action == "study_hours_change":
        hours_change = float(decision.parameters.get("study_hours_change", 0.0) or 0.0)
        
        scenarios.append({
            "scenario_id": "A",
            "scenario_name": f"Moderate Study Increase (+{hours_change * 0.5:.1f} hrs/day)",
            "assumptions": ["Easier integration with daily routines", "Lower fatigue risk"],
            "actions": [f"Increase daily study hours by {hours_change * 0.5:.1f} hours"],
            "affected_variables": ["study_hours", "productivity"],
            "simulation_horizon": f"{horizon_months} months",
            "changes": {
                "monthly_income_change": 0.0,
                "monthly_expense_change": 0.0,
                "one_time_cost": 0.0,
                "delay_months": 0,
                "study_hours_change": hours_change * 0.5,
                "study_prod_multiplier": 1.03,
                "habit_completion_change": 3.0
            }
        })
        
        scenarios.append({
            "scenario_id": "B",
            "scenario_name": f"Proposed Study Plan (+{hours_change:.1f} hrs/day)",
            "assumptions": ["Full adherence to the proposed schedule", "Requires solid lifestyle adjustment"],
            "actions": [f"Increase daily study hours by {hours_change:.1f} hours"],
            "affected_variables": ["study_hours", "productivity"],
            "simulation_horizon": f"{horizon_months} months",
            "changes": {
                "monthly_income_change": 0.0,
                "monthly_expense_change": 0.0,
                "one_time_cost": 0.0,
                "delay_months": 0,
                "study_hours_change": hours_change,
                "study_prod_multiplier": 1.08,
                "habit_completion_change": 8.0
            }
        })
        
        scenarios.append({
            "scenario_id": "C",
            "scenario_name": f"Aggressive Study Schedule (+{hours_change * 1.5:.1f} hrs/day)",
            "assumptions": ["High intensity target", "Possible burnout risk over long horizons"],
            "actions": [f"Increase daily study hours by {hours_change * 1.5:.1f} hours"],
            "affected_variables": ["study_hours", "productivity"],
            "simulation_horizon": f"{horizon_months} months",
            "changes": {
                "monthly_income_change": 0.0,
                "monthly_expense_change": 0.0,
                "one_time_cost": 0.0,
                "delay_months": 0,
                "study_hours_change": hours_change * 1.5,
                "study_prod_multiplier": 1.12,
                "habit_completion_change": 10.0
            }
        })
        
    else:
        # Default action fallback: generate generic scenarios A, B
        scenarios.append({
            "scenario_id": "A",
            "scenario_name": "Moderate Path",
            "assumptions": ["Apply 50% intensity of action"],
            "actions": [f"Perform moderate intensity: {decision.decisionName}"],
            "affected_variables": [d.lower() for d in decision.affectedDomains],
            "simulation_horizon": f"{horizon_months} months",
            "changes": {
                "monthly_income_change": 0.0,
                "monthly_expense_change": 0.0,
                "one_time_cost": 0.0,
                "delay_months": 0,
                "study_hours_change": 0.0,
                "study_prod_multiplier": 1.02,
                "habit_completion_change": 2.0
            }
        })
        
        scenarios.append({
            "scenario_id": "B",
            "scenario_name": "Intense Path",
            "assumptions": ["Apply full intensity of action"],
            "actions": [f"Perform full intensity: {decision.decisionName}"],
            "affected_variables": [d.lower() for d in decision.affectedDomains],
            "simulation_horizon": f"{horizon_months} months",
            "changes": {
                "monthly_income_change": 0.0,
                "monthly_expense_change": 0.0,
                "one_time_cost": 0.0,
                "delay_months": 0,
                "study_hours_change": 0.0,
                "study_prod_multiplier": 1.06,
                "habit_completion_change": 5.0
            }
        })

    # 3. Future Simulation & Outcome Prediction
    outcomes = []
    
    for s in scenarios:
        changes = s["changes"]
        s_id = s["scenario_id"]
        
        monthly_inc_change = changes["monthly_income_change"]
        monthly_exp_change = changes["monthly_expense_change"]
        one_time_cost = changes["one_time_cost"]
        delay_months = changes["delay_months"]
        study_hours_change = changes["study_hours_change"]
        study_prod_multiplier = changes["study_prod_multiplier"]
        habit_completion_change = changes["habit_completion_change"]
        
        # Monthly trajectories
        balance_trajectory = []
        study_hours_trajectory = []
        habit_trajectory = []
        
        temp_balance = current_balance
        temp_study_weekly = avg_study_hours_weekly
        temp_habit = baseline_habit_completion
        
        # Loop month-by-month
        for m in range(1, horizon_months + 1):
            # Apply recurring changes
            current_inc = avg_monthly_income + monthly_inc_change
            current_exp = avg_monthly_expense + monthly_exp_change
            
            # Apply one-time purchases
            if one_time_cost > 0:
                if delay_months == 0 and m == 1:
                    current_exp += one_time_cost
                elif delay_months > 0 and m == delay_months:
                    current_exp += one_time_cost
                    
            # Compute new balance
            net_savings = current_inc - current_exp
            temp_balance += net_savings
            balance_trajectory.append(round(temp_balance, 2))
            
            # Study hour adjustments
            if study_hours_change != 0:
                temp_study_weekly = max(0.0, avg_study_hours_weekly + (study_hours_change * 7.0))
            study_hours_trajectory.append(round(temp_study_weekly, 1))
            
            # Habit score adjustment
            temp_habit = max(0.0, min(100.0, baseline_habit_completion + habit_completion_change))
            habit_trajectory.append(round(temp_habit, 1))
            
        final_balance = balance_trajectory[-1]
        final_study_weekly = study_hours_trajectory[-1]
        final_habit = habit_trajectory[-1]
        
        # Evaluate goals impact
        # We look at active goals
        goals_impact = []
        for g in payload.goals:
            if g.status.upper() != 'ACTIVE':
                continue
            
            # Check target and current amount
            target = float(g.targetAmount)
            current = float(g.currentAmount)
            rem = max(0.0, target - current)
            
            monthly_cont = float(g.monthlyContribution)
            if monthly_cont <= 0:
                monthly_cont = max(50.0, (avg_monthly_income - avg_monthly_expense) / max(1.0, len(payload.goals)))
                
            # Baseline months to complete
            base_months = rem / monthly_cont if monthly_cont > 0 else 999.0
            
            # Simulated savings capacity
            sim_monthly_savings = max(0.0, (avg_monthly_income + monthly_inc_change) - (avg_monthly_expense + monthly_exp_change))
            
            # Adjust contribution depending on savings health
            savings_ratio = sim_monthly_savings / max(100.0, avg_monthly_income - avg_monthly_expense) if (avg_monthly_income - avg_monthly_expense) > 0 else 1.0
            sim_monthly_cont = monthly_cont * savings_ratio
            
            # If one time purchase occurs, it reduces our current starting amount immediately
            starting_amount = current
            if one_time_cost > 0:
                # Assuming one-time purchase is funded from reserves, which reduces available goal capital
                # Allocate a portion of the purchase cost to deduct from this goal
                share_pct = 1.0 / max(1.0, len(payload.goals))
                starting_amount = max(0.0, current - (one_time_cost * share_pct))
                
            rem_sim = max(0.0, target - starting_amount)
            sim_months = rem_sim / sim_monthly_cont if sim_monthly_cont > 0 else 999.0
            
            if delay_months > 0 and one_time_cost > 0:
                # If delayed, the start amount is impacted at the delay month
                # Before delay month, it accumulates at base rate, then drops
                accum_before = monthly_cont * delay_months
                starting_amount_delayed = max(0.0, current + accum_before - (one_time_cost * (1.0 / max(1.0, len(payload.goals)))))
                rem_delayed = max(0.0, target - starting_amount_delayed)
                sim_months = delay_months + (rem_delayed / sim_monthly_cont) if sim_monthly_cont > 0 else 999.0
                
            months_difference = base_months - sim_months # positive = saved months, negative = delayed months
            
            goals_impact.append({
                "goalName": g.goalName,
                "baselineMonths": round(base_months, 1),
                "simulatedMonths": round(sim_months, 1),
                "monthsSaved": round(months_difference, 1),
                "impactStatus": "ADVANCED" if months_difference > 0.5 else "DELAYED" if months_difference < -0.5 else "NEUTRAL"
            })
            
        # Determine overall Risk
        risk_score = 15.0
        risk_level = "LOW"
        
        sim_savings_rate = (avg_monthly_income + monthly_inc_change - (avg_monthly_expense + monthly_exp_change))
        if one_time_cost > current_balance:
            risk_score += 45.0
        if sim_savings_rate <= 0:
            risk_score += 40.0
            risk_level = "HIGH"
        elif sim_savings_rate < monthly_income * 0.1:
            risk_score += 20.0
            risk_level = "MODERATE"
            
        if risk_score > 60:
            risk_level = "HIGH"
        elif risk_score > 35:
            risk_level = "MODERATE"
            
        # Productivity benefit
        prod_gain_pct = (study_prod_multiplier - 1.0) * 100.0
        
        outcomes.append({
            "scenario_id": s_id,
            "scenario_name": s["scenario_name"],
            "horizon_balance": final_balance,
            "horizon_study_hours": final_study_weekly,
            "horizon_habit_score": final_habit,
            "balance_trajectory": balance_trajectory,
            "goals_impact": goals_impact,
            "risk_level": risk_level,
            "risk_score": float(round(risk_score, 1)),
            "productivity_gain_pct": float(round(prod_gain_pct, 1))
        })
        
    # 4. Scenario Evaluation & Comparison Metrics
    comparison_metrics = []
    
    # Locate baseline (Scenario 0)
    baseline = outcomes[0]
    baseline_bal = baseline["horizon_balance"]
    baseline_prod = baseline["horizon_study_hours"]
    baseline_habit = baseline["horizon_habit_score"]
    
    # We will normalize scores between 0 and 100
    for o in outcomes:
        s_id = o["scenario_id"]
        # Financial benefit relative to baseline
        # Max cap of 100, min 0
        balance_diff = o["horizon_balance"] - baseline_bal
        if balance_diff >= 0:
            fin_benefit = 50.0 + min(50.0, (balance_diff / max(100.0, baseline_bal)) * 100.0)
        else:
            fin_benefit = max(0.0, 50.0 - min(50.0, (abs(balance_diff) / max(100.0, baseline_bal)) * 100.0))
            
        # Goal achievement metric
        # Average completion percentage or impact
        goal_scores = []
        for g_imp in o["goals_impact"]:
            diff = g_imp["monthsSaved"]
            if diff >= 0:
                g_sc = 50.0 + min(50.0, diff * 5.0) # +10 months = 100 score
            else:
                g_sc = max(0.0, 50.0 - min(50.0, abs(diff) * 5.0)) # -10 months = 0 score
            goal_scores.append(g_sc)
        goal_benefit = np.mean(goal_scores) if goal_scores else 50.0
        
        # Productivity benefit
        prod_diff = o["horizon_study_hours"] - baseline_prod
        if prod_diff >= 0:
            prod_benefit = 50.0 + min(50.0, prod_diff * 4.0) # +12 hours/week = 100 score
        else:
            prod_benefit = max(0.0, 50.0 - min(50.0, abs(prod_diff) * 4.0))
            
        # Cost Penalty
        # Search the scenario in payload scenarios to find one_time_cost
        s_config = next(item for item in scenarios if item["scenario_id"] == s_id)
        cost_val = s_config["changes"]["one_time_cost"]
        cost_penalty = min(100.0, (cost_val / max(100.0, avg_monthly_income)) * 100.0)
        
        # Risk penalty
        risk_penalty = o["risk_score"]
        
        comparison_metrics.append({
            "scenario_id": s_id,
            "scenario_name": o["scenario_name"],
            "goal_achievement_score": float(round(goal_benefit, 1)),
            "financial_benefit_score": float(round(fin_benefit, 1)),
            "productivity_benefit_score": float(round(prod_benefit, 1)),
            "risk_penalty_score": float(round(risk_penalty, 1)),
            "cost_penalty_score": float(round(cost_penalty, 1))
        })

    # 5. Scenario Ranking
    # Base priorities (default weights)
    w_finance = 0.25
    w_goal = 0.25
    w_prod = 0.25
    w_risk = 0.15
    w_cost = 0.10
    
    # Customize weights based on userPriorities input (range 1-5 or percentages)
    if priorities:
        # e.g. priorities = {"maximize_savings": 5, "reach_goals_faster": 3, "improve_productivity": 1, "minimize_risk": 4, "minimize_cost": 2}
        total_p = sum(priorities.values())
        if total_p > 0:
            w_finance = (priorities.get("maximize_savings", 1.0) / total_p)
            w_goal = (priorities.get("reach_goals_faster", 1.0) / total_p)
            w_prod = (priorities.get("improve_productivity", 1.0) / total_p)
            w_risk = (priorities.get("minimize_risk", 1.0) / total_p)
            w_cost = (priorities.get("minimize_cost", 1.0) / total_p)

    ranked_list = []
    for comp in comparison_metrics:
        s_id = comp["scenario_id"]
        # Score calculation: benefits minus penalties
        # Scale penalties properly
        benefit_blend = (
            w_finance * comp["financial_benefit_score"] +
            w_goal * comp["goal_achievement_score"] +
            w_prod * comp["productivity_benefit_score"]
        )
        penalty_blend = (
            w_risk * comp["risk_penalty_score"] +
            w_cost * comp["cost_penalty_score"]
        )
        
        # Overall normalized score: (benefits - penalty) mapped to 0-100 scale
        score = benefit_blend * 1.3 - penalty_blend * 0.8
        score = float(max(0.0, min(100.0, score)))
        
        # Locate matches
        out_match = next(item for item in outcomes if item["scenario_id"] == s_id)
        
        ranked_list.append({
            "scenario_id": s_id,
            "scenario_name": comp["scenario_name"],
            "overall_score": float(round(score, 1)),
            "risk_level": out_match["risk_level"],
            "horizon_balance": out_match["horizon_balance"],
            "goals_impact": out_match["goals_impact"]
        })
        
    # Sort scenarios by overall_score descending
    ranked_list = sorted(ranked_list, key=lambda x: x["overall_score"], reverse=True)
    
    # 6. Recommendation Engine (AFTER ranking)
    best_scenario = ranked_list[0]
    
    # If the current baseline is ranked best, or the second best is very close (within 2 points) and has lower risk
    baseline_ranked = next(item for item in ranked_list if item["scenario_id"] == "0")
    if best_scenario["scenario_id"] != "0" and (best_scenario["overall_score"] - baseline_ranked["overall_score"] < 4.0) and baseline_ranked["risk_level"] == "LOW" and best_scenario["risk_level"] in ["MODERATE", "HIGH"]:
        # Recommend baseline or budget if safety is higher
        best_scenario = baseline_ranked
        
    recommended_name = best_scenario["scenario_name"]
    recommended_id = best_scenario["scenario_id"]
    
    # Build explaining recommendation text
    why_selected = ""
    main_benefits = []
    main_risks = []
    trade_offs = ""
    alternative_option = ""
    
    # Custom explanations depending on the chosen scenario
    if recommended_id == "0":
        why_selected = "Based on your high priority for financial safety and budgeting, keeping the current path is recommended. It prevents short-term balance strain and minimizes risk."
        main_benefits = ["Maintains current savings rates", "Zero immediate cash flow risk", "Ensures emergency fund remains on target"]
        main_risks = ["No productivity or schedule optimization benefits", "Delays potential speed up of educational goals"]
        trade_offs = "You trade off potential academic/productivity upgrades in favor of absolute financial security."
        # Pick another non-baseline one as alternative
        alternative_option = ranked_list[1]["scenario_name"] if len(ranked_list) > 1 else "None"
        
    elif recommended_id == "A":
        why_selected = f"Recommended because it increases productivity while keeping financial risk low. The budget option aligns best with your savings goals."
        main_benefits = ["Saves significant budget compared to premium options", "Boosts productivity and study outcomes moderately", "Maintains positive cash flow"]
        main_risks = ["Marginally lower productivity benefits compared to full/premium options"]
        trade_offs = "Offers a middle-ground balancing moderate productivity gains with comfortable savings buffers."
        alternative_option = "Current Path"
        
    elif recommended_id == "B":
        why_selected = "The proposed plan is recommended because it provides a strong productivity increase while maintaining stable cash flow and manageable risk under your parameters."
        main_benefits = ["Achieves full expected study productivity improvements", "Maintains healthy habits progression", "Acceptable timeline shift for goals"]
        main_risks = ["Reduces immediate financial reserves", "Moderate budget strain in Month 1"]
        trade_offs = "Trades a moderate amount of short-term capital for a high, long-term productivity dividend."
        alternative_option = "Delay Purchase by 3 Months" if action == "purchase" else "Current Path"
        
    elif recommended_id == "C":
        why_selected = "The premium version is selected because your goals place maximum priority on productivity and achievement speed, justifying the higher financial outlay."
        main_benefits = ["Highest projected productivity gains (+20%)", "Maximum acceleration of learning tasks", "Strong support for habit metrics"]
        main_risks = ["High initial financial outlay", "Elevated financial risk index", "Significant delay to savings goals"]
        trade_offs = "Prioritizes immediate high-performance capability and education over liquid financial capital."
        alternative_option = "Proposed Purchase"
        
    elif recommended_id == "D":
        why_selected = "Delaying the purchase by 3 months is recommended as it allows you to build a larger savings buffer first, reducing risk while still achieving your productivity goals soon after."
        main_benefits = ["Allows savings buffer to accumulate for 3 months", "Lowers initial financial volatility", "Achieves full productivity benefit subsequently"]
        main_risks = ["Delays productivity improvements by 3 months"]
        trade_offs = "Trades a 3-month delay in productivity benefits for significantly lower short-term financial risk."
        alternative_option = "Proposed Purchase"
        
    # Identify avoided scenario
    avoided_scenario = ranked_list[-1]
    avoided_reason = ""
    if avoided_scenario["scenario_id"] == "C":
        avoided_reason = "The premium option has a disproportionately high cost that delays your core savings goals and strains your cash flow without providing matching benefits."
    elif avoided_scenario["scenario_id"] == "HIGH" or avoided_scenario["risk_level"] == "HIGH":
        avoided_reason = "This scenario is marked for avoidance due to excessive financial risk and the potential to create negative net monthly savings."
    else:
        avoided_reason = f"This scenario ranks lowest overall (Score: {avoided_scenario['overall_score']}) because it fails to satisfy your selected priorities."

    recommendation = {
        "recommended_scenario_id": recommended_id,
        "recommended_scenario_name": recommended_name,
        "why_selected": why_selected,
        "main_benefits": main_benefits,
        "main_risks": main_risks,
        "trade_offs": trade_offs,
        "alternative_option": alternative_option,
        "avoid_scenario_name": avoided_scenario["scenario_name"],
        "avoid_reason": avoided_reason
    }
    
    # 7. Model Versioning & Output Assembly
    return {
        "model_version": "Comparative-MDP-v1.2",
        "simulation_version": "1.0",
        "timestamp": datetime.now().isoformat(),
        "assumptions": [
            "Monthly income assumed constant unless specified otherwise.",
            "Monthly expenses follow the recent 3-month average baseline.",
            "One-time purchase costs are paid immediately in the respective month.",
            "Digital Twin metrics are computed using a weighted multi-domain score."
        ],
        "baseline": outcomes[0],
        "scenarios": scenarios,
        "outcomes": outcomes,
        "comparison": comparison_metrics,
        "ranking": ranked_list,
        "recommendation": recommendation
    }
