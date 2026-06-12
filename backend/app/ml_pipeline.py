import os
import joblib
import pandas as pd
import numpy as np
import logging
from typing import Dict, List, Tuple, Any

logger = logging.getLogger("machine_guard_ml")
logging.basicConfig(level=logging.INFO)

# File paths for user-provided ML artifacts
MODEL_PATH = "./machine_health_model.pkl"
ENCODER_PATH = "./label_encoder.pkl"

class MachineHealthPredictor:
    def __init__(self):
        self.model = None
        self.label_encoder = None
        self.feature_names = [
            "Current_Consumption(A)",
            "Pressure_bar",
            "Volatge_V",
            "Tempearture_C",
            "Sound_DB",
            "Oil_level",
            "Vibration",
            "MACHINE_TYPES"
        ]
        self.classes = ["Healthy", "Warning", "Critical", "Dangerous"]
        self.load_artifacts()

    def load_artifacts(self):
        """Attempts to load the user's pickle artifacts if they exist."""
        if os.path.exists(MODEL_PATH):
            try:
                self.model = joblib.load(MODEL_PATH)
                logger.info(f"Loaded XGBoost model from {MODEL_PATH}")
            except Exception as e:
                logger.error(f"Failed to load XGBoost model from {MODEL_PATH}: {e}")
                self.model = None

        if os.path.exists(ENCODER_PATH):
            try:
                self.label_encoder = joblib.load(ENCODER_PATH)
                logger.info(f"Loaded label encoder from {ENCODER_PATH}")
            except Exception as e:
                logger.error(f"Failed to load label encoder from {ENCODER_PATH}: {e}")
                self.label_encoder = None

    def encode_machine_type(self, machine_type: str) -> int:
        """Encodes the Machine Type string into a numeric representation."""
        if self.label_encoder is not None:
            try:
                # Use user's label encoder if available
                return int(self.label_encoder.transform([machine_type])[0])
            except Exception as e:
                logger.warning(f"Error encoding machine type with provided label encoder: {e}. Falling back to default encoder.")
        
        # Fallback encoding map
        encoding_map = {
            "CNC": 0,
            "Hydraulic": 1,
            "Pump": 2,
            "Compressor": 3,
            "Robotic Arm": 4
        }
        return encoding_map.get(machine_type, 0)

    def predict(self, sensor_data: Dict[str, Any]) -> Tuple[str, float, float, float, Dict[str, float], List[Dict[str, Any]], str]:
        """
        Runs the predictive maintenance classification.
        Returns:
            predicted_class (str): Healthy, Warning, Critical, or Dangerous
            confidence (float): Probability score of the predicted class (0.0 to 1.0)
            health_score (float): Calculated machine health score (0 - 100)
            risk_score (float): Calculated machine risk score (0 - 100)
            probabilities (Dict[str, float]): Probabilities for all 4 classes
            feature_importance (List[Dict]): Feature names and importance scores
            ai_insight (str): Concise explanation of the machine state
        """
        # 1. Preprocess inputs into DataFrame matching XGBoost feature order exactly
        encoded_type = self.encode_machine_type(sensor_data["machine_type"])
        
        # Construct DataFrame in exact column order required by the model
        df = pd.DataFrame([{
            "Current_Consumption(A)": sensor_data["current_consumption"],
            "Pressure_bar": sensor_data["pressure"],
            "Volatge_V": sensor_data["voltage"],
            "Tempearture_C": sensor_data["temperature"],
            "Sound_DB": sensor_data["sound"],
            "Oil_level": sensor_data["oil_level"],
            "Vibration": sensor_data["vibration"],
            "MACHINE_TYPES": encoded_type
        }])

        # 2. Check if a real model is loaded, otherwise use smart mock model
        if self.model is not None:
            try:
                # Run prediction
                pred = self.model.predict(df)
                pred_proba = self.model.predict_proba(df)

                # Decode prediction class (supporting string classes or integer index classes)
                if isinstance(pred[0], (int, np.integer)):
                    class_idx = int(pred[0])
                    # Ensure indices match classes length
                    if class_idx < len(self.classes):
                        predicted_class = self.classes[class_idx]
                    else:
                        predicted_class = str(pred[0])
                else:
                    predicted_class = str(pred[0])

                # Get confidence probabilities
                proba_arr = pred_proba[0]
                probabilities = {}
                for i, prob in enumerate(proba_arr):
                    class_name = self.classes[i] if i < len(self.classes) else f"Class_{i}"
                    probabilities[class_name] = float(prob)
                
                # Confidence is the probability of the predicted class
                confidence = probabilities.get(predicted_class, float(max(proba_arr)))

                # Feature importances
                if hasattr(self.model, "feature_importances_"):
                    importances = self.model.feature_importances_
                    feature_importance = [
                        {"sensor": self.feature_names[i], "importance": float(importances[i])}
                        for i in range(len(self.feature_names))
                    ]
                else:
                    feature_importance = self._get_default_feature_importance(sensor_data)

            except Exception as e:
                logger.error(f"Error running inference on user model: {e}. Falling back to mock predictor.")
                predicted_class, confidence, probabilities, feature_importance = self._run_mock_prediction(sensor_data)
        else:
            predicted_class, confidence, probabilities, feature_importance = self._run_mock_prediction(sensor_data)

        # 3. Calculate health score based on predicted class and confidence
        health_score, risk_score = self._calculate_health_and_risk(predicted_class, confidence)

        # 4. Generate AI Insight based on sensor values and predicted status
        ai_insight = self._generate_ai_insight(predicted_class, sensor_data)

        return predicted_class, confidence, health_score, risk_score, probabilities, feature_importance, ai_insight

    def _run_mock_prediction(self, data: Dict[str, Any]) -> Tuple[str, float, Dict[str, float], List[Dict[str, Any]]]:
        """Fallback rule-based classifier that acts as a mock XGBoost model."""
        temp = data["temperature"]
        vib = data["vibration"]
        press = data["pressure"]
        sound = data["sound"]
        oil = data["oil_level"]
        current = data["current_consumption"]
        voltage = data["voltage"]

        # Anomaly scoring based on standard ranges
        # High vibration, extreme temperature, dangerous pressure levels trigger warning or dangerous states.
        score = 0
        if vib > 4.5: score += 40
        elif vib > 2.5: score += 20
        
        if temp > 85: score += 35
        elif temp > 70: score += 15
        
        if press > 11 or press < 1.5: score += 30
        elif press > 8.5 or press < 3.0: score += 12

        if sound > 90: score += 20
        elif sound > 78: score += 8

        if oil < 25 or oil > 95: score += 25
        elif oil < 45 or oil > 88: score += 10

        if current > 18 or current < 3: score += 15
        if abs(voltage - 400) > 60: score += 20

        # Class decision
        if score >= 60:
            predicted_class = "Dangerous"
            base_probs = [0.02, 0.08, 0.20, 0.70] # Healthy, Warning, Critical, Dangerous
        elif score >= 35:
            predicted_class = "Critical"
            base_probs = [0.03, 0.12, 0.65, 0.20]
        elif score >= 15:
            predicted_class = "Warning"
            base_probs = [0.10, 0.70, 0.15, 0.05]
        else:
            predicted_class = "Healthy"
            base_probs = [0.92, 0.05, 0.02, 0.01]

        # Normalize probabilities
        probs_sum = sum(base_probs)
        normalized_probs = [p / probs_sum for p in base_probs]

        probabilities = {
            "Healthy": normalized_probs[0],
            "Warning": normalized_probs[1],
            "Critical": normalized_probs[2],
            "Dangerous": normalized_probs[3]
        }

        confidence = probabilities[predicted_class]

        # Construct realistic feature importances based on which sensors deviated the most
        feature_importance = self._calculate_mock_feature_importance(data, predicted_class)

        return predicted_class, confidence, probabilities, feature_importance

    def _calculate_health_and_risk(self, predicted_class: str, confidence: float) -> Tuple[float, float]:
        """Calculates Health and Risk scores adhering to the rules."""
        if predicted_class == "Healthy":
            # Scale health score between 90% and 100%
            health_score = 90.0 + (confidence * 10.0)
        elif predicted_class == "Warning":
            # Scale health score between 60% and 89%
            health_score = 60.0 + (confidence * 29.0)
        elif predicted_class == "Critical":
            # Scale health score between 30% and 59%
            health_score = 30.0 + (confidence * 29.0)
        else: # Dangerous
            # Scale health score between 0% and 29%
            health_score = 0.0 + (confidence * 29.0)

        # Health score must be bounded between 0 and 100
        health_score = max(0.0, min(100.0, health_score))
        
        # Round scores to one decimal place
        health_score = round(health_score, 1)
        risk_score = round(100.0 - health_score, 1)

        return health_score, risk_score

    def _calculate_mock_feature_importance(self, data: Dict[str, Any], status: str) -> List[Dict[str, Any]]:
        """Calculates feature importances dynamically depending on sensor values."""
        # Baseline normal values
        norms = {
            "current_consumption": 9.0,
            "pressure": 5.0,
            "voltage": 400.0,
            "temperature": 50.0,
            "sound": 65.0,
            "oil_level": 75.0,
            "vibration": 1.2
        }

        # Calculate deviation percentages
        deviations = {
            "Current_Consumption(A)": abs(data["current_consumption"] - norms["current_consumption"]) / norms["current_consumption"],
            "Pressure_bar": abs(data["pressure"] - norms["pressure"]) / norms["pressure"],
            "Volatge_V": abs(data["voltage"] - norms["voltage"]) / norms["voltage"],
            "Tempearture_C": abs(data["temperature"] - norms["temperature"]) / norms["temperature"],
            "Sound_DB": abs(data["sound"] - norms["sound"]) / norms["sound"],
            "Oil_level": abs(data["oil_level"] - norms["oil_level"]) / norms["oil_level"],
            "Vibration": abs(data["vibration"] - norms["vibration"]) / norms["vibration"],
            "MACHINE_TYPES": 0.05 # Baseline noise for machine type
        }

        # If Healthy, add some randomness. If bad state, deviations dictate importance.
        if status == "Healthy":
            importances = {k: v + np.random.uniform(0.02, 0.08) for k, v in deviations.items()}
        else:
            importances = {k: v * 1.5 + np.random.uniform(0.01, 0.05) for k, v in deviations.items()}

        # Normalize importances so they sum to 1.0
        total = sum(importances.values())
        if total == 0:
            total = 1.0
        
        importance_list = [
            {"sensor": k, "importance": round(v / total, 3)}
            for k, v in importances.items()
        ]
        
        # Sort by importance descending
        importance_list.sort(key=lambda x: x["importance"], reverse=True)
        return importance_list

    def _get_default_feature_importance(self, data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Static backup feature importance mapping."""
        defaults = {
            "Current_Consumption(A)": 0.12,
            "Pressure_bar": 0.15,
            "Volatge_V": 0.08,
            "Tempearture_C": 0.22,
            "Sound_DB": 0.10,
            "Oil_level": 0.08,
            "Vibration": 0.20,
            "MACHINE_TYPES": 0.05
        }
        importance_list = [{"sensor": k, "importance": v} for k, v in defaults.items()]
        importance_list.sort(key=lambda x: x["importance"], reverse=True)
        return importance_list

    def _generate_ai_insight(self, status: str, data: Dict[str, Any]) -> str:
        """Generates contextual insights based on sensor deviations and status."""
        temp = data["temperature"]
        vib = data["vibration"]
        press = data["pressure"]
        sound = data["sound"]
        oil = data["oil_level"]
        current = data["current_consumption"]
        voltage = data["voltage"]

        issues = []
        if vib > 3.5:
            issues.append(f"abnormal vibration levels ({vib} mm/s)")
        if temp > 80:
            issues.append(f"extreme thermal warning ({temp}°C)")
        elif temp > 68:
            issues.append(f"elevated operating temperature ({temp}°C)")
        if press > 9.5:
            issues.append(f"critical high pressure ({press} bar)")
        elif press < 2.0:
            issues.append(f"critical low pressure ({press} bar)")
        if sound > 88:
            issues.append(f"excessive acoustic noise ({sound} dB)")
        if oil < 30:
            issues.append(f"dangerously low oil level ({oil}%)")
        if current > 16:
            issues.append(f"high current load ({current} A)")

        if status == "Healthy":
            if issues:
                return f"Machine is operating within safe parameters, but check: {', '.join(issues)}."
            return "Machine is operating within normal parameters. All sensor readings are stable."
        
        if status == "Warning":
            factor = issues[0] if issues else "slight thermal and vibration fluctuation"
            return f"Machine condition is Warning due to {factor}. Recommend visual inspection."

        if status == "Critical":
            factors = ", ".join(issues[:2]) if issues else "escalating temperature and mechanical vibration levels"
            return f"Machine has reached Critical threshold due to {factors}. Preventive maintenance is recommended within 24-48 hours."

        # Dangerous
        factors = ", ".join(issues[:2]) if issues else "severe sensor threshold breaches"
        return f"DANGER: Emergency shutdown recommended. High risk of mechanical failure driven by {factors}."

# Singleton instance
predictor = MachineHealthPredictor()
