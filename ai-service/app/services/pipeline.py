import os
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
import joblib

# Optional imports with fallbacks
try:
    from prophet import Prophet
    PROPHET_AVAILABLE = True
except ImportError:
    PROPHET_AVAILABLE = False

try:
    from xgboost import XGBRegressor
    XGBOOST_AVAILABLE = True
except ImportError:
    XGBOOST_AVAILABLE = False

from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor, RandomForestClassifier
from sklearn.metrics import mean_absolute_error, root_mean_squared_error, r2_score, accuracy_score
from sklearn.model_selection import train_test_split

MODEL_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "models")
os.makedirs(MODEL_DIR, exist_ok=True)

class MLPipeline:
    
    @staticmethod
    def evaluate_regression(y_true, y_pred):
        """Calculate MAE, RMSE, and R2 score."""
        if len(y_true) == 0:
            return 0.0, 0.0, 0.0
        mae = mean_absolute_error(y_true, y_pred)
        rmse = root_mean_squared_error(y_true, y_pred)
        r2 = r2_score(y_true, y_pred)
        # Avoid nan or infinite values
        if np.isnan(r2) or np.isinf(r2):
            r2 = 0.0
        return float(mae), float(rmse), float(r2)

    @staticmethod
    def train_and_select_regressor(X, y, user_id, model_name_prefix):
        """
        Trains and compares LinearRegression, RandomForestRegressor, and XGBoostRegressor.
        Returns the best trained model, its metrics, and its name.
        """
        if len(X) < 4:
            # Insufficient data for comparison, return a simple Linear Regression model
            lr = LinearRegression()
            lr.fit(X, y)
            metrics = {"mae": 0.0, "rmse": 0.0, "r2": 1.0, "confidence": 0.5}
            # Save it
            model_path = os.path.join(MODEL_DIR, f"{model_name_prefix}_{user_id}.joblib")
            joblib.dump({"model": lr, "type": "LinearRegression", "features": list(X.columns)}, model_path)
            return lr, metrics, "LinearRegression"

        # Split data
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.25, random_state=42)

        models = {
            "LinearRegression": LinearRegression(),
            "RandomForest": RandomForestRegressor(n_estimators=50, random_state=42)
        }
        
        if XGBOOST_AVAILABLE:
            models["XGBoost"] = XGBRegressor(n_estimators=50, max_depth=3, random_state=42, verbosity=0)

        best_model = None
        best_r2 = -float("inf")
        best_rmse = float("inf")
        best_name = ""
        best_metrics = {}

        for name, model in models.items():
            try:
                model.fit(X_train, y_train)
                preds = model.predict(X_test)
                mae, rmse, r2 = MLPipeline.evaluate_regression(y_test, preds)
                
                # We select based on highest R2, but use RMSE as tie-breaker
                if r2 > best_r2 or (abs(r2 - best_r2) < 1e-5 and rmse < best_rmse):
                    best_r2 = r2
                    best_rmse = rmse
                    best_name = name
                    best_model = model
                    best_metrics = {"mae": mae, "rmse": rmse, "r2": r2}
            except Exception as e:
                print(f"Error training model {name}: {e}")

        # If all failed or R2 is very negative, fallback to simple linear fit on full data
        if best_model is None or best_r2 < -10:
            fallback_model = LinearRegression()
            fallback_model.fit(X, y)
            best_model = fallback_model
            best_name = "LinearRegression"
            best_metrics = {"mae": 0.0, "rmse": 0.0, "r2": 0.0}

        # Train final model on full data
        try:
            best_model.fit(X, y)
        except:
            pass

        # Calculate confidence score based on R2 and sample size
        # Standardize R2 to 0-1 range for confidence contribution
        r2_contrib = max(0.0, min(1.0, (best_metrics.get("r2", 0.0) + 1.0) / 2.0))
        data_contrib = min(1.0, len(X) / 30.0) # Full confidence from 30+ points
        confidence = 0.5 + 0.4 * (0.6 * r2_contrib + 0.4 * data_contrib)
        best_metrics["confidence"] = float(confidence)

        # Save model
        model_path = os.path.join(MODEL_DIR, f"{model_name_prefix}_{user_id}.joblib")
        joblib.dump({"model": best_model, "type": best_name, "features": list(X.columns), "metrics": best_metrics}, model_path)

        return best_model, best_metrics, best_name

    @staticmethod
    def forecast_prophet(df_prophet, periods=30):
        """
        Runs Prophet forecasting if available.
        df_prophet must have columns 'ds' (datetime) and 'y' (float).
        """
        if not PROPHET_AVAILABLE:
            return None
        
        if len(df_prophet) < 2:
            return None
            
        try:
            # Silence logging
            import logging
            logging.getLogger('cmdstanpy').setLevel(logging.ERROR)
            
            m = Prophet(yearly_seasonality=False, weekly_seasonality=True, daily_seasonality=False)
            m.fit(df_prophet)
            future = m.make_future_dataframe(periods=periods)
            forecast = m.predict(future)
            # Return prediction for the future periods
            future_forecast = forecast.tail(periods)[['ds', 'yhat', 'yhat_lower', 'yhat_upper']]
            return future_forecast.to_dict(orient='records')
        except Exception as e:
            print(f"Prophet forecast failed: {e}")
            return None

    @staticmethod
    def train_habit_classifier(df, user_id, habit_name):
        """
        Trains a Random Forest Classifier to predict the completion of a habit.
        """
        if len(df) < 5:
            # Too little data, return fallback probabilities
            return None, {"accuracy": 1.0, "confidence": 0.5}

        # Features
        features = ['day_of_week', 'day_of_month', 'month', 'streak']
        X = df[features]
        y = df['completed'].astype(int)

        if len(y.unique()) < 2:
            # Cannot classify with only one class, return fallback
            return None, {"accuracy": 1.0, "confidence": 0.6}

        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        
        clf = RandomForestClassifier(n_estimators=30, random_state=42)
        clf.fit(X_train, y_train)
        preds = clf.predict(X_test)
        
        acc = accuracy_score(y_test, preds)
        
        # Fit on full data
        clf.fit(X, y)
        
        # Save
        sanitized_name = "".join([c if c.isalnum() else "_" for c in habit_name])
        model_path = os.path.join(MODEL_DIR, f"habit_{sanitized_name}_{user_id}.joblib")
        joblib.dump({"model": clf, "features": features, "accuracy": float(acc)}, model_path)
        
        return clf, {"accuracy": float(acc), "confidence": 0.5 + 0.4 * float(acc)}
