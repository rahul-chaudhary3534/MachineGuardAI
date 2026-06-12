import random
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from .database import engine, Base, SessionLocal
from .models import PredictionRecord
from .ml_pipeline import predictor

def seed_database():
    # Bind engine and recreate tables
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    db: Session = SessionLocal()

    machine_types = ["CNC", "Hydraulic", "Pump", "Compressor", "Robotic Arm"]
    statuses = ["Healthy", "Warning", "Critical", "Dangerous"]

    # Start date 30 days ago
    start_date = datetime.now() - timedelta(days=30)
    
    records = []

    # Generate 35 historic prediction records
    for i in range(35):
        # Evenly spread over 30 days, with some randomness
        record_time = start_date + timedelta(days=i * 0.85) + timedelta(hours=random.randint(0, 12))
        machine = random.choice(machine_types)

        # We want a distribution: ~65% Healthy, ~20% Warning, ~10% Critical, ~5% Dangerous
        rand = random.random()
        if rand < 0.65:
            # Healthy profile
            current_consumption = round(random.uniform(6.0, 11.0), 2)
            pressure = round(random.uniform(4.0, 6.5), 2)
            voltage = round(random.uniform(390.0, 415.0), 2)
            temperature = round(random.uniform(40.0, 58.0), 2)
            sound = round(random.uniform(55.0, 72.0), 2)
            oil_level = round(random.uniform(70.0, 88.0), 2)
            vibration = round(random.uniform(0.8, 1.8), 2)
            status = "Healthy"
            confidence = round(random.uniform(0.85, 0.98), 2)
        elif rand < 0.85:
            # Warning profile
            current_consumption = round(random.choice([random.uniform(12.0, 16.0), random.uniform(3.0, 5.0)]), 2)
            pressure = round(random.choice([random.uniform(7.0, 8.5), random.uniform(2.2, 3.5)]), 2)
            voltage = round(random.uniform(360.0, 435.0), 2)
            temperature = round(random.uniform(62.0, 74.0), 2)
            sound = round(random.uniform(74.0, 84.0), 2)
            oil_level = round(random.choice([random.uniform(35.0, 50.0), random.uniform(88.0, 93.0)]), 2)
            vibration = round(random.uniform(2.1, 3.2), 2)
            status = "Warning"
            confidence = round(random.uniform(0.70, 0.90), 2)
        elif rand < 0.95:
            # Critical profile
            current_consumption = round(random.uniform(15.0, 18.0), 2)
            pressure = round(random.choice([random.uniform(8.5, 10.5), random.uniform(1.2, 2.2)]), 2)
            voltage = round(random.choice([random.uniform(330.0, 360.0), random.uniform(435.0, 460.0)]), 2)
            temperature = round(random.uniform(74.0, 85.0), 2)
            sound = round(random.uniform(83.0, 91.0), 2)
            oil_level = round(random.choice([random.uniform(20.0, 35.0), random.uniform(93.0, 98.0)]), 2)
            vibration = round(random.uniform(3.2, 4.6), 2)
            status = "Critical"
            confidence = round(random.uniform(0.60, 0.85), 2)
        else:
            # Dangerous profile
            current_consumption = round(random.choice([random.uniform(18.0, 22.0), random.uniform(1.0, 2.5)]), 2)
            pressure = round(random.choice([random.uniform(10.5, 13.0), random.uniform(0.5, 1.2)]), 2)
            voltage = round(random.choice([random.uniform(300.0, 330.0), random.uniform(460.0, 490.0)]), 2)
            temperature = round(random.uniform(85.0, 102.0), 2)
            sound = round(random.uniform(91.0, 105.0), 2)
            oil_level = round(random.choice([random.uniform(5.0, 20.0), random.uniform(98.0, 100.0)]), 2)
            vibration = round(random.uniform(4.6, 7.5), 2)
            status = "Dangerous"
            confidence = round(random.uniform(0.65, 0.95), 2)

        # Re-calculate health score using our standardized logic in ml_pipeline
        health_score, _ = predictor._calculate_health_and_risk(status, confidence)

        record = PredictionRecord(
            timestamp=record_time,
            machine_type=machine,
            current_consumption=current_consumption,
            pressure=pressure,
            voltage=voltage,
            temperature=temperature,
            sound=sound,
            oil_level=oil_level,
            vibration=vibration,
            predicted_status=status,
            confidence=confidence,
            health_score=health_score
        )
        records.append(record)

    db.add_all(records)
    db.commit()
    db.close()
    print("Database tables initialized and seeded with 35 historic telemetry logs.")

if __name__ == "__main__":
    seed_database()
