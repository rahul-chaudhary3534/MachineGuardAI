from sqlalchemy import Column, Integer, Float, String, DateTime
from sqlalchemy.sql import func
from .database import Base

class PredictionRecord(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    machine_type = Column(String, index=True)
    
    # Sensor Readings
    current_consumption = Column(Float)
    pressure = Column(Float)
    voltage = Column(Float)
    temperature = Column(Float)
    sound = Column(Float)
    oil_level = Column(Float)
    vibration = Column(Float)
    
    # Prediction Outputs
    predicted_status = Column(String, index=True) # Healthy, Warning, Critical, Dangerous
    confidence = Column(Float)                     # 0.0 to 1.0
    health_score = Column(Float)                   # 0 to 100
