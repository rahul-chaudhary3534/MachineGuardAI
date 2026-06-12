import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ResponsiveContainer,
  PieChart, Pie, Cell, Legend, Tooltip,
  RadarChart, PolarGrid, PolarAngleAxis, Radar,
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  AreaChart, Area
} from "recharts";
import { Activity, ShieldCheck, AlertTriangle, ShieldAlert, Cpu, RefreshCw, Layers } from "lucide-react";
import type { DashboardStats } from "../types";

export const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("http://localhost:8000/api/dashboard-stats");
      if (!response.ok) {
        throw new Error(`Failed to load dashboard metrics: ${response.statusText}`);
      }
      const data: DashboardStats = await response.json();
      setStats(data);
    } catch (err: any) {
      setError(err.message || "Failed to contact database statistics service.");
    } finally {
      setLoading(false);
    }
  };

  const seedDatabase = async () => {
    setResetting(true);
    try {
      const response = await fetch("http://localhost:8000/api/reset-db", {
        method: "POST"
      });
      if (response.ok) {
        await fetchStats();
      } else {
        throw new Error("Reset database API failed.");
      }
    } catch (err: any) {
      alert("Error seeding database: " + err.message);
    } finally {
      setResetting(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[calc(100vh-80px)]">
        <svg className="animate-spin h-10 w-10 text-indigo-500 mb-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <p className="text-slate-400 font-medium">Querying database telemetry...</p>
      </div>
    );
  }

  // Handle empty database case gracefully
  if (error || !stats || stats.kpi.total_predictions === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center tech-grid min-h-[calc(100vh-80px)] flex flex-col items-center justify-center">
        <div className="bg-slate-900/60 p-4 rounded-full border border-slate-800 mb-4">
          <Activity className="w-12 h-12 text-slate-500 animate-pulse-slow" />
        </div>
        <h3 className="text-2xl font-bold text-slate-200 mb-3">Telemetry Vault Empty</h3>
        <p className="text-slate-400 max-w-md mx-auto mb-8 font-light leading-relaxed">
          No prediction logs exist in the SQLite registry. Initialize the database with seeded telemetry logs to unlock all charts and metrics.
        </p>
        <button
          onClick={seedDatabase}
          disabled={resetting}
          className="px-6 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white font-semibold transition shadow-lg shadow-indigo-600/20 cursor-pointer flex items-center gap-2"
        >
          {resetting ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              Generating Diagnostic Log...
            </>
          ) : (
            <>
              <Layers className="w-5 h-5" />
              Populate Demo Data (35 Records)
            </>
          )}
        </button>
        {error && (
          <div className="mt-8 text-xs text-red-400 border border-red-500/10 bg-red-500/5 p-3 rounded max-w-lg">
            Backend Connection Warning: {error}
          </div>
        )}
      </div>
    );
  }

  const { kpi, condition_distribution, prediction_trend, machine_risk_trend, radar_comparison } = stats;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 tech-grid space-y-8 min-h-[calc(100vh-80px)]">
      {/* Dashboard Sub-Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 glass-panel rounded-xl">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-100 tracking-tight">Enterprise Analytics</h1>
          <p className="text-slate-400 text-sm font-light mt-0.5">Machine health score aggregation and sensor deviation profiles.</p>
        </div>
        <button
          onClick={seedDatabase}
          disabled={resetting}
          className="px-4 py-2 text-xs font-semibold rounded border border-slate-700 bg-slate-900/60 hover:bg-slate-900 hover:border-slate-500 disabled:opacity-50 text-slate-300 transition cursor-pointer flex items-center gap-2"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${resetting ? "animate-spin" : ""}`} />
          Reset & Reseed Database
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        {/* Total Predictions */}
        <div className="glass-panel p-4 rounded-xl flex flex-col justify-between">
          <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Total Diagnostic Runs</span>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-black text-slate-100">{kpi.total_predictions}</span>
            <Activity className="w-5 h-5 text-indigo-400" />
          </div>
        </div>

        {/* Avg Health */}
        <div className="glass-panel p-4 rounded-xl flex flex-col justify-between">
          <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Average Health</span>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-black text-white">{kpi.average_health_score}%</span>
            <Cpu className="w-5 h-5 text-indigo-400" />
          </div>
        </div>

        {/* Healthy */}
        <div className="glass-panel p-4 rounded-xl border-l-4 border-l-emerald-500">
          <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">🟢 Healthy State</span>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-black text-emerald-400">{kpi.healthy_count}</span>
            <ShieldCheck className="w-5 h-5 text-emerald-500" />
          </div>
        </div>

        {/* Warning */}
        <div className="glass-panel p-4 rounded-xl border-l-4 border-l-yellow-500">
          <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">🟡 Warning State</span>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-black text-yellow-400">{kpi.warning_count}</span>
            <AlertTriangle className="w-5 h-5 text-yellow-500" />
          </div>
        </div>

        {/* Critical */}
        <div className="glass-panel p-4 rounded-xl border-l-4 border-l-orange-500">
          <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">🟠 Critical State</span>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-black text-orange-400">{kpi.critical_count}</span>
            <AlertTriangle className="w-5 h-5 text-orange-500" />
          </div>
        </div>

        {/* Dangerous */}
        <div className="glass-panel p-4 rounded-xl border-l-4 border-l-red-500">
          <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">🔴 Dangerous State</span>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-black text-red-400">{kpi.dangerous_count}</span>
            <ShieldAlert className="w-5 h-5 text-red-500" />
          </div>
        </div>
      </div>

      {/* First Charts Row: Health Gauge & Pie Chart & Radar Chart */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Gauge Widget */}
        <div className="glass-panel p-6 rounded-xl md:col-span-4 flex flex-col justify-between items-center text-center">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest self-start mb-4">Overall Fleet Index</h3>
          
          <div className="relative w-44 h-24 mt-4 overflow-hidden">
            {/* Semicircle SVG Gauge */}
            <svg className="w-full h-full transform -rotate-180" viewBox="0 0 100 50">
              {/* Semicircle track */}
              <path
                d="M 10,50 A 40,40 0 0,1 90,50"
                fill="none"
                stroke="#1e293b"
                strokeWidth="10"
                strokeLinecap="round"
              />
              {/* Dynamic health bar */}
              <motion.path
                d="M 10,50 A 40,40 0 0,1 90,50"
                fill="none"
                stroke={
                  kpi.average_health_score > 80 ? "#10b981" :
                  kpi.average_health_score > 60 ? "#eab308" :
                  kpi.average_health_score > 35 ? "#f97316" : "#ef4444"
                }
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray="125.6"
                initial={{ strokeDashoffset: 125.6 }}
                animate={{ strokeDashoffset: 125.6 - (125.6 * kpi.average_health_score) / 100 }}
                transition={{ duration: 1.5, ease: "easeOut" }}
              />
            </svg>
            <div className="absolute bottom-0 inset-x-0 flex flex-col items-center">
              <span className="text-3xl font-black text-white">{kpi.average_health_score}%</span>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-1">Average Health</span>
            </div>
          </div>
          
          <div className="w-full flex justify-between text-[10px] text-slate-500 font-semibold px-4 pt-4 border-t border-slate-800/60 mt-4">
            <span>DANGER (0%)</span>
            <span>WARNING (60%)</span>
            <span>HEALTHY (100%)</span>
          </div>
        </div>

        {/* Condition Distribution (Pie Chart) */}
        <div className="glass-panel p-6 rounded-xl md:col-span-4 flex flex-col">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Condition Distribution</h3>
          <div className="h-48 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={condition_distribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {condition_distribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "#0f172a",
                    borderColor: "#334155",
                    borderRadius: "8px"
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 flex-wrap text-xs mt-2">
            {condition_distribution.map((entry, idx) => (
              <div key={idx} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                <span className="text-slate-400 font-medium">{entry.name} ({entry.value})</span>
              </div>
            ))}
          </div>
        </div>

        {/* Sensor Radar Chart */}
        <div className="glass-panel p-6 rounded-xl md:col-span-4 flex flex-col">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Condition Radar Comparison</h3>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radar_comparison}>
                <PolarGrid stroke="#334155" />
                <PolarAngleAxis dataKey="sensor" stroke="#94a3b8" style={{ fontSize: "9px", fontWeight: 500 }} />
                <Radar name="Healthy" dataKey="Healthy" stroke="#10b981" fill="#10b981" fillOpacity={0.1} />
                <Radar name="Warning" dataKey="Warning" stroke="#eab308" fill="#eab308" fillOpacity={0.1} />
                <Radar name="Dangerous" dataKey="Dangerous" stroke="#ef4444" fill="#ef4444" fillOpacity={0.1} />
                <Tooltip
                  contentStyle={{
                    background: "#0f172a",
                    borderColor: "#334155",
                    borderRadius: "8px",
                    color: "#f8fafc"
                  }}
                />
                <Legend iconSize={8} iconType="circle" wrapperStyle={{ fontSize: "10px" }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Second Charts Row: Prediction Trend (Line) & Risk Trend (Area) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Prediction Trend Line Chart */}
        <div className="glass-panel p-6 rounded-xl">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">Fleet Diagnostic Trends</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={prediction_trend} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.05)" />
                <XAxis dataKey="date" stroke="#94a3b8" style={{ fontSize: "10px" }} />
                <YAxis yAxisId="left" stroke="#6366f1" style={{ fontSize: "10px" }} />
                <YAxis yAxisId="right" orientation="right" stroke="#10b981" style={{ fontSize: "10px" }} />
                <Tooltip
                  contentStyle={{
                    background: "#0f172a",
                    borderColor: "#334155",
                    borderRadius: "8px"
                  }}
                />
                <Legend wrapperStyle={{ fontSize: "11px" }} />
                <Line yAxisId="left" type="monotone" dataKey="predictions" name="Diagnostics Count" stroke="#6366f1" strokeWidth={2.5} activeDot={{ r: 6 }} />
                <Line yAxisId="right" type="monotone" dataKey="healthScore" name="Avg Health Score (%)" stroke="#10b981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Machine Risk Trend Area Chart */}
        <div className="glass-panel p-6 rounded-xl">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">Risk Profile Timeline</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={machine_risk_trend} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.05)" />
                <XAxis dataKey="date" stroke="#94a3b8" style={{ fontSize: "10px" }} />
                <YAxis stroke="#f43f5e" style={{ fontSize: "10px" }} />
                <Tooltip
                  contentStyle={{
                    background: "#0f172a",
                    borderColor: "#334155",
                    borderRadius: "8px"
                  }}
                />
                <Area type="monotone" dataKey="risk" name="Fleet Anomaly Risk (%)" stroke="#f43f5e" strokeWidth={2} fillOpacity={1} fill="url(#colorRisk)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
