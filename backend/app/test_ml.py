import os
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from .database import Base, get_db
from .main import app
from .ml_pipeline import predictor
from .seed import seed_database

# Use a test SQLite database
TEST_DATABASE_URL = "sqlite:///./test_machine_guard.db"
engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="module")
def db_session():
    # Setup test database tables
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)
        engine.dispose()
        if os.path.exists("./test_machine_guard.db"):
            os.remove("./test_machine_guard.db")

@pytest.fixture(scope="module")
def client(db_session):
    # Override database dependency in FastAPI
    def override_get_db():
        try:
            yield db_session
        finally:
            pass
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()

def test_ml_pipeline_healthy():
    # Healthy readings profile
    healthy_data = {
        "current_consumption": 8.0,
        "pressure": 5.0,
        "voltage": 410.0,
        "temperature": 45.0,
        "sound": 60.0,
        "oil_level": 80.0,
        "vibration": 1.0,
        "machine_type": "Pump"
    }
    
    status, conf, health, risk, probs, importance, insight = predictor.predict(healthy_data)
    
    assert status == "Healthy"
    assert health >= 90.0 and health <= 100.0
    assert risk >= 0.0 and risk <= 10.0
    assert "Healthy" in probs
    assert len(importance) == 8
    assert "normal parameters" in insight.lower()

def test_ml_pipeline_dangerous():
    # Extreme anomaly reading profile
    dangerous_data = {
        "current_consumption": 22.0,
        "pressure": 12.0,
        "voltage": 300.0,
        "temperature": 98.0,
        "sound": 98.0,
        "oil_level": 8.0,
        "vibration": 6.8,
        "machine_type": "CNC"
    }
    
    status, conf, health, risk, probs, importance, insight = predictor.predict(dangerous_data)
    
    assert status == "Dangerous"
    assert health >= 0.0 and health <= 29.0
    assert risk >= 71.0 and risk <= 100.0
    assert "Dangerous" in probs
    assert "danger" in insight.lower() or "emergency" in insight.lower()

def test_api_predict_endpoint(client):
    payload = {
        "current_consumption": 9.5,
        "pressure": 5.8,
        "voltage": 412.0,
        "temperature": 52.0,
        "sound": 65.0,
        "oil_level": 78.0,
        "vibration": 1.2,
        "machine_type": "Hydraulic"
    }
    
    response = client.post("/api/predict", json=payload)
    assert response.status_code == 200
    
    data = response.json()
    assert "predicted_class" in data
    assert "health_score" in data
    assert "confidence_score" in data
    assert "ai_insight" in data
    assert len(data["feature_importance"]) > 0

def test_api_history_endpoint(client):
    # Retrieve diagnostic list
    response = client.get("/api/history")
    assert response.status_code == 200
    records = response.json()
    assert isinstance(records, list)
    assert len(records) > 0 # Assert the record inserted by previous test is retrieved

def test_dashboard_stats_endpoint(client):
    response = client.get("/api/dashboard-stats")
    assert response.status_code == 200
    stats = response.json()
    assert "kpi" in stats
    assert "condition_distribution" in stats
    assert "prediction_trend" in stats
    assert "radar_comparison" in stats
    assert stats["kpi"]["total_predictions"] > 0
