export interface SensorData {
  current_consumption: number;
  pressure: number;
  voltage: number;
  temperature: number;
  sound: number;
  oil_level: number;
  vibration: number;
  machine_type: string;
}

export interface FeatureImportance {
  sensor: string;
  importance: number;
}

export interface PredictionResult {
  predicted_class: "Healthy" | "Warning" | "Critical" | "Dangerous";
  confidence_score: number;
  health_score: number;
  risk_score: number;
  probabilities: Record<string, number>;
  feature_importance: FeatureImportance[];
  ai_insight: string;
}

export interface HistoryRecord {
  id: number;
  timestamp: string;
  machine_type: string;
  current_consumption: number;
  pressure: number;
  voltage: number;
  temperature: number;
  sound: number;
  oil_level: number;
  vibration: number;
  predicted_status: "Healthy" | "Warning" | "Critical" | "Dangerous";
  confidence: number;
  health_score: number;
}

export interface DashboardKPIs {
  total_predictions: number;
  healthy_count: number;
  warning_count: number;
  critical_count: number;
  dangerous_count: number;
  average_health_score: number;
}

export interface DashboardStats {
  kpi: DashboardKPIs;
  condition_distribution: { name: string; value: number; color: string }[];
  prediction_trend: { date: string; predictions: number; healthScore: number }[];
  machine_risk_trend: { date: string; risk: number }[];
  radar_comparison: { sensor: string; [key: string]: string | number }[];
}
