import React, { useState } from "react";
import { LandingPage } from "./pages/LandingPage";
import { PredictionPage } from "./pages/PredictionPage";
import { DashboardPage } from "./pages/DashboardPage";
import { HistoryPage } from "./pages/HistoryPage";
import { ShieldAlert, Cpu, BarChart3, Database } from "lucide-react";

type Page = "landing" | "predict" | "dashboard" | "history";

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>("landing");

  const renderPage = () => {
    switch (currentPage) {
      case "landing":
        return <LandingPage onNavigate={(page) => setCurrentPage(page as Page)} />;
      case "predict":
        return <PredictionPage />;
      case "dashboard":
        return <DashboardPage />;
      case "history":
        return <HistoryPage />;
      default:
        return <LandingPage onNavigate={(page) => setCurrentPage(page as Page)} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col relative">
      {/* Decorative Top Accent Glow Bar */}
      <div className="h-1 w-full bg-gradient-to-r from-cyan-500 via-indigo-500 to-violet-600 z-50" />

      {/* Global Navigation Header */}
      <header className="sticky top-0 bg-slate-950/80 backdrop-blur-md border-b border-slate-900 z-40 px-4 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          
          {/* Logo Brand */}
          <div 
            onClick={() => setCurrentPage("landing")}
            className="flex items-center gap-2 cursor-pointer group"
          >
            <div className="bg-gradient-to-r from-indigo-500 to-cyan-500 p-2 rounded-lg text-white shadow-md shadow-indigo-500/10 group-hover:shadow-indigo-500/20 transition-all duration-300">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <span className="text-xl font-black tracking-tight bg-gradient-to-r from-slate-100 to-indigo-200 bg-clip-text text-transparent group-hover:text-white transition">
              MachineGuard <span className="font-light text-indigo-400">AI</span>
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => setCurrentPage("predict")}
              className={`px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                currentPage === "predict"
                  ? "bg-indigo-500/10 text-indigo-300 border border-indigo-500/30"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent"
              }`}
            >
              <Cpu className="w-4 h-4" />
              <span className="hidden sm:inline">Prediction Panel</span>
              <span className="sm:hidden">Predict</span>
            </button>

            <button
              onClick={() => setCurrentPage("dashboard")}
              className={`px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                currentPage === "dashboard"
                  ? "bg-indigo-500/10 text-indigo-300 border border-indigo-500/30"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent"
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Fleet Dashboard</span>
              <span className="sm:hidden">Dashboard</span>
            </button>

            <button
              onClick={() => setCurrentPage("history")}
              className={`px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                currentPage === "history"
                  ? "bg-indigo-500/10 text-indigo-300 border border-indigo-500/30"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent"
              }`}
            >
              <Database className="w-4 h-4" />
              <span className="hidden sm:inline">Audit Registry</span>
              <span className="sm:hidden">History</span>
            </button>
          </nav>
        </div>
      </header>

      {/* Main Page Content */}
      <main className="flex-1 flex flex-col relative z-10">
        {renderPage()}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 MachineGuard AI Inc. All rights reserved.</p>
          <div className="flex gap-4">
            <span className="hover:text-slate-400 cursor-pointer">Security Ledger</span>
            <span className="hover:text-slate-400 cursor-pointer">ML Preprocessing Core</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
