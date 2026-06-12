import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, Filter, ArrowUpDown, Download, AlertTriangle, AlertOctagon, CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";
import type { HistoryRecord } from "../types";

export const HistoryPage: React.FC = () => {
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search, Filter, Sort state
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortBy, setSortBy] = useState("timestamp");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Expandable row state
  const [expandedRowId, setExpandedRowId] = useState<number | null>(null);

  const fetchHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append("search", searchTerm);
      if (statusFilter) params.append("status_filter", statusFilter);
      params.append("sort_by", sortBy);
      params.append("sort_order", sortOrder);

      const response = await fetch(`http://localhost:8000/api/history?${params.toString()}`);
      if (!response.ok) {
        throw new Error(`Failed to retrieve history logs: ${response.statusText}`);
      }
      const data: HistoryRecord[] = await response.json();
      setHistory(data);
    } catch (err: any) {
      setError(err.message || "Failed to load prediction logs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Debounce search slightly to avoid excessive API requests
    const delayDebounce = setTimeout(() => {
      fetchHistory();
    }, 250);

    return () => clearTimeout(delayDebounce);
  }, [searchTerm, statusFilter, sortBy, sortOrder]);

  const toggleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };

  const handleExportCSV = () => {
    const params = new URLSearchParams();
    if (searchTerm) params.append("search", searchTerm);
    if (statusFilter) params.append("status_filter", statusFilter);
    
    // Redirect browser to native CSV streaming endpoint
    window.open(`http://localhost:8000/api/history/export?${params.toString()}`);
  };

  const toggleExpandRow = (id: number) => {
    if (expandedRowId === id) {
      setExpandedRowId(null);
    } else {
      setExpandedRowId(id);
    }
  };

  const formatTimestamp = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString();
    } catch {
      return dateString;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Healthy":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Healthy
          </span>
        );
      case "Warning":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
            <AlertTriangle className="w-3.5 h-3.5" />
            Warning
          </span>
        );
      case "Critical":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-500/10 text-orange-400 border border-orange-500/20">
            <AlertTriangle className="w-3.5 h-3.5" />
            Critical
          </span>
        );
      case "Dangerous":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20">
            <AlertOctagon className="w-3.5 h-3.5" />
            Dangerous
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700">
            Unknown
          </span>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 tech-grid space-y-6 min-h-[calc(100vh-80px)]">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 glass-panel rounded-xl">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-100 tracking-tight">Diagnostic History Log</h1>
          <p className="text-slate-400 text-sm font-light mt-0.5">Secure SQLite ledger auditing past machine prediction analytics.</p>
        </div>
        <button
          onClick={handleExportCSV}
          className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20"
        >
          <Download className="w-4 h-4" />
          Export CSV Ledger
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg flex items-center gap-2">
          <AlertOctagon className="w-5 h-5 text-red-400 shrink-0" />
          <span>Sync Error: {error}</span>
        </div>
      )}

      {/* Search & Filters */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Search */}
        <div className="md:col-span-8 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-500" />
          </div>
          <input
            type="text"
            placeholder="Search by machine type (e.g. Pump, CNC)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="glass-input pl-10"
          />
        </div>

        {/* Filter */}
        <div className="md:col-span-4 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Filter className="h-5 w-5 text-slate-500" />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="glass-input pl-10 cursor-pointer"
          >
            <option value="">All Health Statuses</option>
            <option value="Healthy">🟢 Healthy</option>
            <option value="Warning">🟡 Warning</option>
            <option value="Critical">🟠 Critical</option>
            <option value="Dangerous">🔴 Dangerous</option>
          </select>
        </div>
      </div>

      {/* History Table Panel */}
      <div className="glass-panel rounded-xl overflow-hidden border border-slate-800">
        {loading && history.length === 0 ? (
          <div className="p-16 text-center text-slate-400">
            <svg className="animate-spin h-8 w-8 text-indigo-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Fetching prediction index...
          </div>
        ) : history.length === 0 ? (
          <div className="p-16 text-center text-slate-400 font-light leading-relaxed">
            No prediction logs matched your query search constraints.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900/60 text-slate-400 border-b border-slate-800 text-xs font-semibold uppercase tracking-wider">
                  <th className="p-4 w-10"></th>
                  <th className="p-4 cursor-pointer hover:text-slate-200 transition" onClick={() => toggleSort("timestamp")}>
                    <div className="flex items-center gap-1.5">
                      Timestamp
                      <ArrowUpDown className="w-3.5 h-3.5" />
                    </div>
                  </th>
                  <th className="p-4">Machine Type</th>
                  <th className="p-4">Predicted Condition</th>
                  <th className="p-4 cursor-pointer hover:text-slate-200 transition" onClick={() => toggleSort("confidence")}>
                    <div className="flex items-center gap-1.5">
                      Confidence
                      <ArrowUpDown className="w-3.5 h-3.5" />
                    </div>
                  </th>
                  <th className="p-4 cursor-pointer hover:text-slate-200 transition" onClick={() => toggleSort("health_score")}>
                    <div className="flex items-center gap-1.5">
                      Health Score
                      <ArrowUpDown className="w-3.5 h-3.5" />
                    </div>
                  </th>
                  <th className="p-4 w-28 text-center">Inspect</th>
                </tr>
              </thead>
              <tbody>
                {history.map((record) => (
                  <React.Fragment key={record.id}>
                    <tr
                      className={`border-b border-slate-800 hover:bg-slate-800/20 transition cursor-pointer text-sm font-medium ${expandedRowId === record.id ? "bg-slate-900/20" : ""}`}
                      onClick={() => toggleExpandRow(record.id)}
                    >
                      <td className="p-4 text-center">
                        {expandedRowId === record.id ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                      </td>
                      <td className="p-4 text-slate-300">{formatTimestamp(record.timestamp)}</td>
                      <td className="p-4 text-slate-200">{record.machine_type}</td>
                      <td className="p-4">{getStatusBadge(record.predicted_status)}</td>
                      <td className="p-4 text-indigo-300 font-mono">{(record.confidence * 100).toFixed(0)}%</td>
                      <td className="p-4 font-bold text-slate-100">{record.health_score}%</td>
                      <td className="p-4 text-center">
                        <button
                          className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition"
                        >
                          Telemetry
                        </button>
                      </td>
                    </tr>
                    
                    {/* Expandable row */}
                    {expandedRowId === record.id && (
                      <tr className="bg-slate-950/40 border-b border-slate-800">
                        <td colSpan={7} className="p-6">
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            transition={{ duration: 0.25 }}
                            className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-4 text-center"
                          >
                            <div className="p-3 bg-slate-900/40 rounded-lg border border-slate-800/80">
                              <div className="text-[10px] text-slate-500 uppercase font-semibold">Current (A)</div>
                              <div className="text-sm font-bold text-slate-200 mt-1">{record.current_consumption} A</div>
                            </div>
                            <div className="p-3 bg-slate-900/40 rounded-lg border border-slate-800/80">
                              <div className="text-[10px] text-slate-500 uppercase font-semibold">Pressure</div>
                              <div className="text-sm font-bold text-slate-200 mt-1">{record.pressure} bar</div>
                            </div>
                            <div className="p-3 bg-slate-900/40 rounded-lg border border-slate-800/80">
                              <div className="text-[10px] text-slate-500 uppercase font-semibold">Voltage</div>
                              <div className="text-sm font-bold text-slate-200 mt-1">{record.voltage} V</div>
                            </div>
                            <div className="p-3 bg-slate-900/40 rounded-lg border border-slate-800/80">
                              <div className="text-[10px] text-slate-500 uppercase font-semibold">Temperature</div>
                              <div className="text-sm font-bold text-slate-200 mt-1">{record.temperature} °C</div>
                            </div>
                            <div className="p-3 bg-slate-900/40 rounded-lg border border-slate-800/80">
                              <div className="text-[10px] text-slate-500 uppercase font-semibold">Sound</div>
                              <div className="text-sm font-bold text-slate-200 mt-1">{record.sound} dB</div>
                            </div>
                            <div className="p-3 bg-slate-900/40 rounded-lg border border-slate-800/80">
                              <div className="text-[10px] text-slate-500 uppercase font-semibold">Oil Level</div>
                              <div className="text-sm font-bold text-slate-200 mt-1">{record.oil_level} %</div>
                            </div>
                            <div className="p-3 bg-slate-900/40 rounded-lg border border-slate-800/80">
                              <div className="text-[10px] text-slate-500 uppercase font-semibold">Vibration</div>
                              <div className="text-sm font-bold text-slate-200 mt-1">{record.vibration} mm/s</div>
                            </div>
                          </motion.div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
