from pydantic import BaseModel, Field
from datetime import datetime
from typing import List, Dict, Any

class PredictionRequest(BaseModel):
    current_consumption: float = Field(..., description="Current Consumption (A)", ge=0)
    pressure: float = Field(..., description="Pressure (bar)", ge=0)
    voltage: float = Field(..., description="Voltage (V)", ge=0)
    temperature: float = Field(..., description="Temperature (°C)")
    sound: float = Field(..., description="Sound (dB)", ge=0)
    oil_level: float = Field(..., description="Oil Level (%)", ge=0, le=100)
    vibration: float = Field(..., description="Vibration (mm/s or index)", ge=0)
    machine_type: str = Field(..., description="Machine Type (e.g., CNC, Hydraulic, Pump, Compressor)")

    class Config:
        json_schema_extra = {
            "example": {
                "current_consumption": 12.5,
                "pressure": 6.2,
                "voltage": 415.0,
                "temperature": 68.5,
                "sound": 72.0,
                "oil_level": 85.0,
                "vibration": 2.4,
                "machine_type": "Pump"
            }
        }

class FeatureImportanceItem(BaseModel):
    sensor: str
    importance: float

class PredictionResponse(BaseModel):
    predicted_class: str # Healthy, Warning, Critical, Dangerous
    confidence_score: float # 0.0 - 1.0 (or percentage)
    health_score: float # 0 - 100
    risk_score: float # 0 - 100
    probabilities: Dict[str, float]
    feature_importance: List[FeatureImportanceItem]
    ai_insight: str

class PredictionRecordResponse(BaseModel):
    id: int
    timestamp: datetime
    machine_type: str
    current_consumption: float
    pressure: float
    voltage: float
    temperature: float
    sound: float
    oil_level: float
    vibration: float
    predicted_status: str
    confidence: float
    health_score: float

    class Config:
        from_attributes = True

class KPICards(BaseModel):
    total_predictions: int
    healthy_count: int
    warning_count: int
    critical_count: int
    dangerous_count: int
    average_health_score: float

class DashboardStats(BaseModel):
    kpi: KPICards
    condition_distribution: List[Dict[str, Any]]
    prediction_trend: List[Dict[str, Any]]
    machine_risk_trend: List[Dict[str, Any]]
    radar_comparison: List[Dict[str, Any]]
