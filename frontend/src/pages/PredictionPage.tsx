import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from "recharts";
import { Play, RotateCcw, AlertTriangle, AlertOctagon, CheckCircle2, Cpu } from "lucide-react";
import type { SensorData, PredictionResult } from "../types";

// Standard preset values to help users test the dashboard quickly
const PRESETS = {
  normal: {
    current_consumption: 8.5,
    pressure: 5.2,
    voltage: 412.0,
    temperature: 48.0,
    sound: 62.0,
    oil_level: 82.0,
    vibration: 1.1,
    machine_type: "Pump"
  },
  tempSpike: {
    current_consumption: 11.2,
    pressure: 6.8,
    voltage: 408.0,
    temperature: 82.5,
    sound: 78.0,
    oil_level: 75.0,
    vibration: 2.2,
    machine_type: "CNC"
  },
  bearingWear: {
    current_consumption: 14.8,
    pressure: 5.0,
    voltage: 395.0,
    temperature: 71.0,
    sound: 86.0,
    oil_level: 68.0,
    vibration: 5.4,
    machine_type: "Compressor"
  },
  oilLeakage: {
    current_consumption: 6.5,
    pressure: 2.1,
    voltage: 410.0,
    temperature: 63.0,
    sound: 71.0,
    oil_level: 12.0,
    vibration: 3.8,
    machine_type: "Hydraulic"
  }
};

export const PredictionPage: React.FC = () => {
  const [formData, setFormData] = useState<SensorData>(PRESETS.normal);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === "machine_type" ? value : parseFloat(value) || 0
    });
  };

  const applyPreset = (presetName: keyof typeof PRESETS) => {
    setFormData(PRESETS[presetName]);
  };

  const clearInputs = () => {
    setFormData({
      current_consumption: 0,
      pressure: 0,
      voltage: 0,
      temperature: 0,
      sound: 0,
      oil_level: 0,
      vibration: 0,
      machine_type: "CNC"
    });
    setResult(null);
    setError(null);
  };

  const runPrediction = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("http://localhost:8000/api/predict", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
      }

      const data: PredictionResult = await response.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || "Failed to contact prediction microservice. Ensure backend is running on port 8000.");
    } finally {
      setLoading(false);
    }
  };

  // Status visual attributes mapping
  const getStatusConfig = (status: string) => {
    switch (status) {
      case "Healthy":
        return {
          color: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
          icon: <CheckCircle2 className="w-6 h-6 text-emerald-400" />,
          glow: "glow-healthy",
          strokeColor: "#10b981",
          gradient: "from-emerald-500 to-teal-500"
        };
      case "Warning":
        return {
          color: "text-yellow-400 border-yellow-500/30 bg-yellow-500/10",
          icon: <AlertTriangle className="w-6 h-6 text-yellow-400" />,
          glow: "glow-warning",
          strokeColor: "#eab308",
          gradient: "from-yellow-500 to-amber-500"
        };
      case "Critical":
        return {
          color: "text-orange-400 border-orange-500/30 bg-orange-500/10",
          icon: <AlertTriangle className="w-6 h-6 text-orange-400" />,
          glow: "glow-critical",
          strokeColor: "#f97316",
          gradient: "from-orange-500 to-amber-600"
        };
      case "Dangerous":
        return {
          color: "text-red-400 border-red-500/30 bg-red-500/10",
          icon: <AlertOctagon className="w-6 h-6 text-red-400" />,
          glow: "glow-dangerous",
          strokeColor: "#ef4444",
          gradient: "from-red-500 to-rose-600"
        };
      default:
        return {
          color: "text-slate-400 border-slate-700 bg-slate-800/20",
          icon: <Cpu className="w-6 h-6 text-slate-400" />,
          glow: "",
          strokeColor: "#64748b",
          gradient: "from-slate-500 to-slate-600"
        };
    }
  };

  const statusConfig = result ? getStatusConfig(result.predicted_class) : null;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 tech-grid min-h-[calc(100vh-80px)]">
      {/* Scenario Presets Bar */}
      <div className="mb-8 p-4 glass-panel rounded-xl flex flex-wrap gap-3 items-center justify-between">
        <div className="flex items-center gap-2">
          <Cpu className="w-5 h-5 text-indigo-400" />
          <span className="text-sm font-semibold text-slate-300">Quick Diagnostics Presets:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => applyPreset("normal")}
            className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 border border-slate-700/60 transition"
          >
            🟢 Normal Operations
          </button>
          <button
            onClick={() => applyPreset("tempSpike")}
            className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 border border-slate-700/60 transition"
          >
            🟡 Thermal Warning Preset
          </button>
          <button
            onClick={() => applyPreset("bearingWear")}
            className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 border border-slate-700/60 transition"
          >
            🟠 Extreme Vibration Preset
          </button>
          <button
            onClick={() => applyPreset("oilLeakage")}
            className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 border border-slate-700/60 transition"
          >
            🔴 Oil Depletion Preset
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Sensor Input Panel */}
        <motion.div
          className="glass-panel p-6 rounded-xl relative overflow-hidden"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-2xl font-bold mb-6 text-slate-100 border-b border-slate-800 pb-3 flex items-center gap-2">
            <Cpu className="w-6 h-6 text-indigo-500" />
            Telemetry Input Console
          </h2>

          <form onSubmit={runPrediction} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Machine Type */}
              <div className="col-span-1 md:col-span-2">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Machine Type
                </label>
                <select
                  name="machine_type"
                  value={formData.machine_type}
                  onChange={handleInputChange}
                  className="glass-input cursor-pointer"
                  required
                >
                  <option value="CNC">CNC Turning Center</option>
                  <option value="Hydraulic">Hydraulic Press System</option>
                  <option value="Pump">Centrifugal Pump</option>
                  <option value="Compressor">Rotary Screw Compressor</option>
                  <option value="Robotic Arm">Robotic Arm Assembly</option>
                </select>
              </div>

              {/* Current */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Current Consumption (A)
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="current_consumption"
                  value={formData.current_consumption}
                  onChange={handleInputChange}
                  placeholder="e.g. 10.5"
                  className="glass-input"
                  min="0"
                  required
                />
              </div>

              {/* Pressure */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Pressure (bar)
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="pressure"
                  value={formData.pressure}
                  onChange={handleInputChange}
                  placeholder="e.g. 6.0"
                  className="glass-input"
                  min="0"
                  required
                />
              </div>

              {/* Voltage */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Voltage (V)
                </label>
                <input
                  type="number"
                  step="0.1"
                  name="voltage"
                  value={formData.voltage}
                  onChange={handleInputChange}
                  placeholder="e.g. 415.0"
                  className="glass-input"
                  min="0"
                  required
                />
              </div>

              {/* Temperature */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Temperature (°C)
                </label>
                <input
                  type="number"
                  step="0.1"
                  name="temperature"
                  value={formData.temperature}
                  onChange={handleInputChange}
                  placeholder="e.g. 65.0"
                  className="glass-input"
                  required
                />
              </div>

              {/* Sound */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Sound (dB)
                </label>
                <input
                  type="number"
                  step="0.1"
                  name="sound"
                  value={formData.sound}
                  onChange={handleInputChange}
                  placeholder="e.g. 75.0"
                  className="glass-input"
                  min="0"
                  required
                />
              </div>

              {/* Oil Level */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Oil Level (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  name="oil_level"
                  value={formData.oil_level}
                  onChange={handleInputChange}
                  placeholder="e.g. 80.0"
                  className="glass-input"
                  min="0"
                  max="100"
                  required
                />
              </div>

              {/* Vibration */}
              <div className="col-span-1 md:col-span-2">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Vibration (mm/s)
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="vibration"
                  value={formData.vibration}
                  onChange={handleInputChange}
                  placeholder="e.g. 1.2"
                  className="glass-input"
                  min="0"
                  required
                />
              </div>
            </div>

            <div className="flex gap-4 pt-4 border-t border-slate-800">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 disabled:cursor-not-allowed text-white font-semibold flex items-center justify-center gap-2 cursor-pointer transition shadow-lg shadow-indigo-600/20"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Analyzing Telemetry...
                  </span>
                ) : (
                  <>
                    <Play className="w-5 h-5" />
                    Run Diagnostic
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={clearInputs}
                className="px-6 py-3 rounded-lg border border-slate-700 bg-slate-900/40 hover:bg-slate-900 text-slate-300 flex items-center gap-2 cursor-pointer transition"
              >
                <RotateCcw className="w-5 h-5" />
                Reset
              </button>
            </div>
          </form>
        </motion.div>

        {/* Prediction Result Panel */}
        <div className="flex flex-col">
          <AnimatePresence mode="wait">
            {!result ? (
              <motion.div
                key="empty"
                className="glass-panel flex-1 p-8 rounded-xl flex flex-col items-center justify-center text-center border-dashed border-2 border-slate-700/60"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
              >
                <div className="bg-slate-900/60 p-4 rounded-full border border-slate-800 mb-4 animate-pulse-slow">
                  <Cpu className="w-10 h-10 text-slate-500" />
                </div>
                <h3 className="text-xl font-bold text-slate-300 mb-2">No Diagnostic Active</h3>
                <p className="text-slate-500 text-sm max-w-sm">
                  Apply one of the presets or input custom sensor readings, then click **Run Diagnostic** to evaluate machine condition using machine learning.
                </p>
                {error && (
                  <div className="mt-6 p-3 rounded-lg border border-red-500/20 bg-red-500/5 text-red-400 text-xs max-w-md">
                    {error}
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="result"
                className={`glass-panel flex-1 p-6 rounded-xl flex flex-col gap-6 relative overflow-hidden ${statusConfig?.glow}`}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.5 }}
              >
                <h2 className="text-2xl font-bold text-slate-100 border-b border-slate-800 pb-3 flex items-center justify-between">
                  <span>Diagnostic Summary</span>
                  <span className="text-xs uppercase px-2 py-0.5 rounded border border-slate-800 bg-slate-900/60 text-slate-400 tracking-wider font-semibold">
                    {formData.machine_type}
                  </span>
                </h2>

                {/* Status Badge */}
                <div className={`p-4 rounded-lg border flex items-center gap-3 ${statusConfig?.color}`}>
                  {statusConfig?.icon}
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wider opacity-80">Machine State</div>
                    <div className="text-xl font-bold tracking-tight">{result.predicted_class}</div>
                  </div>
                </div>

                {/* Main Indicators Row: Circle Gauge & Side Scores */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center">
                  {/* Circle SVG Gauge */}
                  <div className="sm:col-span-5 flex justify-center flex-col items-center">
                    <div className="relative w-40 h-40">
                      {/* Outer track arc */}
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                        <circle
                          cx="50"
                          cy="50"
                          r="42"
                          stroke="#1e293b"
                          strokeWidth="8"
                          fill="transparent"
                          strokeDasharray="263.8"
                          strokeLinecap="round"
                        />
                        {/* Interactive progress track */}
                        <motion.circle
                          cx="50"
                          cy="50"
                          r="42"
                          stroke={statusConfig?.strokeColor}
                          strokeWidth="8"
                          fill="transparent"
                          strokeDasharray="263.8"
                          initial={{ strokeDashoffset: 263.8 }}
                          animate={{ strokeDashoffset: 263.8 - (263.8 * result.health_score) / 100 }}
                          transition={{ duration: 1.2, ease: "easeOut" }}
                          strokeLinecap="round"
                        />
                      </svg>
                      {/* Centered label */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-3xl font-extrabold text-white tracking-tight">{result.health_score}%</span>
                        <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-widest mt-0.5">Health</span>
                      </div>
                    </div>
                  </div>

                  {/* Progressive Horizontal Indicators */}
                  <div className="sm:col-span-7 space-y-4">
                    {/* Confidence Score */}
                    <div>
                      <div className="flex justify-between items-center mb-1 text-xs font-semibold">
                        <span className="text-slate-400 uppercase tracking-wider">Classification Confidence</span>
                        <span className="text-indigo-400">{(result.confidence_score * 100).toFixed(0)}%</span>
                      </div>
                      <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
                        <motion.div
                          className="bg-indigo-500 h-full rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${result.confidence_score * 100}%` }}
                          transition={{ duration: 1.0, ease: "easeOut" }}
                        />
                      </div>
                    </div>

                    {/* Risk Score */}
                    <div>
                      <div className="flex justify-between items-center mb-1 text-xs font-semibold">
                        <span className="text-slate-400 uppercase tracking-wider">Failure Risk Level</span>
                        <span className={`${result.risk_score > 60 ? "text-red-400" : result.risk_score > 30 ? "text-orange-400" : "text-emerald-400"}`}>
                          {result.risk_score}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
                        <motion.div
                          className={`h-full rounded-full bg-gradient-to-r ${statusConfig?.gradient}`}
                          initial={{ width: 0 }}
                          animate={{ width: `${result.risk_score}%` }}
                          transition={{ duration: 1.0, ease: "easeOut" }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* AI Insight Container */}
                <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-lg text-sm">
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">AI Diagnostics Insight</div>
                  <p className="text-slate-200 leading-relaxed font-light">{result.ai_insight}</p>
                </div>

                {/* Feature Importance Panel */}
                <div className="flex-1">
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Top Contributing Sensors</div>
                  <div className="h-44 w-full text-xs">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={result.feature_importance}
                        layout="vertical"
                        margin={{ top: 0, right: 10, left: 10, bottom: 0 }}
                      >
                        <XAxis type="number" stroke="#64748b" tickLine={false} axisLine={false} />
                        <YAxis
                          dataKey="sensor"
                          type="category"
                          stroke="#94a3b8"
                          tickLine={false}
                          axisLine={false}
                          width={140}
                          style={{ fontSize: "10px", fontWeight: 500 }}
                        />
                        <Tooltip
                          cursor={{ fill: "rgba(255, 255, 255, 0.03)" }}
                          contentStyle={{
                            background: "#0f172a",
                            borderColor: "#334155",
                            borderRadius: "8px",
                            color: "#f8fafc"
                          }}
                        />
                        <Bar dataKey="importance" radius={[0, 4, 4, 0]} barSize={12}>
                          {result.feature_importance.map((_entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={index === 0 ? statusConfig?.strokeColor : "#6366f1"}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
