import csv
import io
from fastapi import FastAPI, Depends, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any

from .database import engine, get_db, Base
from .models import PredictionRecord
from .schemas import PredictionRequest, PredictionResponse, PredictionRecordResponse, DashboardStats, KPICards, FeatureImportanceItem
from .ml_pipeline import predictor

statuses = ["Healthy", "Warning", "Critical", "Dangerous"]

# Initialize database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="MachineGuard AI API",
    description="Backend services for Predictive Maintenance and Sensor Analytics Platform",
    version="1.0.0"
)

# Enable CORS for frontend client access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this to the frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": "MachineGuard AI API",
        "model_loaded": predictor.model is not None,
        "label_encoder_loaded": predictor.label_encoder is not None
    }

@app.post("/api/predict", response_model=PredictionResponse)
def predict_machine_health(request: PredictionRequest, db: Session = Depends(get_db)):
    try:
        # 1. Run prediction via ML pipeline
        sensor_data = request.model_dump()
        predicted_class, confidence, health_score, risk_score, probabilities, feature_importance, ai_insight = predictor.predict(sensor_data)
        
        # 2. Save prediction record to SQLite
        record = PredictionRecord(
            machine_type=request.machine_type,
            current_consumption=request.current_consumption,
            pressure=request.pressure,
            voltage=request.voltage,
            temperature=request.temperature,
            sound=request.sound,
            oil_level=request.oil_level,
            vibration=request.vibration,
            predicted_status=predicted_class,
            confidence=confidence,
            health_score=health_score
        )
        
        db.add(record)
        db.commit()
        db.refresh(record)

        # 3. Format response matching PredictionResponse schema
        importance_items = [
            FeatureImportanceItem(sensor=item["sensor"], importance=item["importance"])
            for item in feature_importance
        ]

        return PredictionResponse(
            predicted_class=predicted_class,
            confidence_score=confidence,
            health_score=health_score,
            risk_score=risk_score,
            probabilities=probabilities,
            feature_importance=importance_items,
            ai_insight=ai_insight
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Prediction failed: {str(e)}"
        )

@app.get("/api/history", response_model=List[PredictionRecordResponse])
def get_prediction_history(
    search: Optional[str] = Query(None, description="Search by machine type"),
    status_filter: Optional[str] = Query(None, description="Filter by predicted status"),
    sort_by: str = Query("timestamp", description="Sort by column: timestamp, health_score, confidence"),
    sort_order: str = Query("desc", description="Sort order: asc or desc"),
    db: Session = Depends(get_db)
):
    query = db.query(PredictionRecord)

    # Filtering
    if search:
        query = query.filter(PredictionRecord.machine_type.ilike(f"%{search}%"))
    if status_filter:
        query = query.filter(PredictionRecord.predicted_status == status_filter)

    # Sorting
    sort_column = getattr(PredictionRecord, sort_by, PredictionRecord.timestamp)
    if sort_order == "desc":
        query = query.order_by(sort_column.desc())
    else:
        query = query.order_by(sort_column.asc())

    return query.all()

@app.get("/api/history/export")
def export_prediction_history_csv(
    search: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(PredictionRecord)
    if search:
        query = query.filter(PredictionRecord.machine_type.ilike(f"%{search}%"))
    if status_filter:
        query = query.filter(PredictionRecord.predicted_status == status_filter)

    records = query.order_by(PredictionRecord.timestamp.desc()).all()

    # Create CSV in memory
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Headers
    writer.writerow([
        "ID", "Timestamp", "Machine Type", 
        "Current Consumption (A)", "Pressure (bar)", "Voltage (V)", 
        "Temperature (C)", "Sound (dB)", "Oil Level (%)", "Vibration",
        "Predicted Status", "Confidence", "Health Score"
    ])
    
    for r in records:
        writer.writerow([
            r.id,
            r.timestamp.strftime("%Y-%m-%d %H:%M:%S"),
            r.machine_type,
            r.current_consumption,
            r.pressure,
            r.voltage,
            r.temperature,
            r.sound,
            r.oil_level,
            r.vibration,
            r.predicted_status,
            r.confidence,
            r.health_score
        ])

    output.seek(0)
    response = StreamingResponse(iter([output.getvalue()]), media_type="text/csv")
    response.headers["Content-Disposition"] = "attachment; filename=machine_health_history.csv"
    return response

@app.get("/api/dashboard-stats", response_model=DashboardStats)
def get_dashboard_statistics(db: Session = Depends(get_db)):
    # 1. Base counts & KPI metrics
    total_predictions = db.query(PredictionRecord).count()
    if total_predictions == 0:
        return DashboardStats(
            kpi=KPICards(total_predictions=0, healthy_count=0, warning_count=0, critical_count=0, dangerous_count=0, average_health_score=0.0),
            condition_distribution=[],
            prediction_trend=[],
            machine_risk_trend=[],
            radar_comparison=[]
        )

    healthy_count = db.query(PredictionRecord).filter(PredictionRecord.predicted_status == "Healthy").count()
    warning_count = db.query(PredictionRecord).filter(PredictionRecord.predicted_status == "Warning").count()
    critical_count = db.query(PredictionRecord).filter(PredictionRecord.predicted_status == "Critical").count()
    dangerous_count = db.query(PredictionRecord).filter(PredictionRecord.predicted_status == "Dangerous").count()
    
    avg_health = db.query(func.avg(PredictionRecord.health_score)).scalar()
    avg_health_score = round(float(avg_health), 1) if avg_health is not None else 0.0

    kpi = KPICards(
        total_predictions=total_predictions,
        healthy_count=healthy_count,
        warning_count=warning_count,
        critical_count=critical_count,
        dangerous_count=dangerous_count,
        average_health_score=avg_health_score
    )

    # 2. Condition Distribution (Pie Chart)
    condition_distribution = [
        {"name": "Healthy", "value": healthy_count, "color": "#10b981"},
        {"name": "Warning", "value": warning_count, "color": "#eab308"},
        {"name": "Critical", "value": critical_count, "color": "#f97316"},
        {"name": "Dangerous", "value": dangerous_count, "color": "#ef4444"}
    ]

    # 3. Prediction Trend over time (Line Chart - grouped by date)
    # Get counts and average health grouped by day
    trend_results = db.query(
        func.strftime("%Y-%m-%d", PredictionRecord.timestamp).label("date"),
        func.count(PredictionRecord.id).label("count"),
        func.avg(PredictionRecord.health_score).label("avg_health")
    ).group_by("date").order_by("date").all()

    prediction_trend = []
    machine_risk_trend = []
    
    for r in trend_results:
        date_str = r.date
        # Parse to print friendly date, e.g. "Jun 12"
        try:
            dt = datetime.strptime(date_str, "%Y-%m-%d")
            friendly_date = dt.strftime("%b %d")
        except:
            friendly_date = date_str

        avg_h = round(float(r.avg_health), 1) if r.avg_health is not None else 0.0
        avg_risk = round(100.0 - avg_h, 1)

        prediction_trend.append({
            "date": friendly_date,
            "predictions": int(r.count),
            "healthScore": avg_h
        })

        machine_risk_trend.append({
            "date": friendly_date,
            "risk": avg_risk
        })

    # Fill in trends if they are empty
    if not prediction_trend:
        prediction_trend = [{"date": "No Data", "predictions": 0, "healthScore": 100.0}]
        machine_risk_trend = [{"date": "No Data", "risk": 0.0}]

    # 4. Radar Chart: Compare average normalized sensor readings across condition classes
    # Normalize sensors:
    # Current (0-20A) -> /20
    # Pressure (0-12bar) -> /12
    # Voltage (300-500V) -> (val-300)/200
    # Temperature (0-110°C) -> /110
    # Sound (40-110dB) -> (val-40)/70
    # Oil Level (0-100%) -> /100
    # Vibration (0-8mm/s) -> /8

    radar_comparison = []
    sensors = [
        {"key": "current_consumption", "label": "Current", "max": 20.0, "min": 0.0},
        {"key": "pressure", "label": "Pressure", "max": 12.0, "min": 0.0},
        {"key": "voltage", "label": "Voltage", "max": 500.0, "min": 300.0},
        {"key": "temperature", "label": "Temperature", "max": 110.0, "min": 0.0},
        {"key": "sound", "label": "Sound", "max": 110.0, "min": 40.0},
        {"key": "oil_level", "label": "Oil Level", "max": 100.0, "min": 0.0},
        {"key": "vibration", "label": "Vibration", "max": 8.0, "min": 0.0}
    ]

    # Calculate average values grouped by status
    avg_sensors_by_status = {}
    for status_class in statuses:
        status_avg = db.query(
            func.avg(PredictionRecord.current_consumption).label("current_consumption"),
            func.avg(PredictionRecord.pressure).label("pressure"),
            func.avg(PredictionRecord.voltage).label("voltage"),
            func.avg(PredictionRecord.temperature).label("temperature"),
            func.avg(PredictionRecord.sound).label("sound"),
            func.avg(PredictionRecord.oil_level).label("oil_level"),
            func.avg(PredictionRecord.vibration).label("vibration")
        ).filter(PredictionRecord.predicted_status == status_class).first()

        avg_sensors_by_status[status_class] = status_avg

    # Construct Radar list
    for s in sensors:
        key = s["key"]
        label = s["label"]
        min_val = s["min"]
        max_val = s["max"]
        range_val = max_val - min_val if max_val > min_val else 1.0

        item = {"sensor": label}
        for status_class in statuses:
            avg_row = avg_sensors_by_status[status_class]
            val = getattr(avg_row, key, None)
            if val is not None:
                # Normalize between 0 and 100
                normalized = ((float(val) - min_val) / range_val) * 100.0
                normalized = max(0.0, min(100.0, normalized))
                item[status_class] = round(normalized, 1)
            else:
                item[status_class] = 0.0

        radar_comparison.append(item)

    return DashboardStats(
        kpi=kpi,
        condition_distribution=condition_distribution,
        prediction_trend=prediction_trend,
        machine_risk_trend=machine_risk_trend,
        radar_comparison=radar_comparison
    )

@app.post("/api/reset-db")
def reset_database(db: Session = Depends(get_db)):
    try:
        from .seed import seed_database
        seed_database()
        return {"message": "Database successfully reset and seeded."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
