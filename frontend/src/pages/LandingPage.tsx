import React from "react";
import { motion } from "framer-motion";
import { ShieldCheck, Activity, Cpu, AlertTriangle, BarChart3, ArrowRight } from "lucide-react";

interface LandingPageProps {
  onNavigate: (page: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.6, ease: "easeOut" }
    }
  };

  const features = [
    {
      icon: <Cpu className="w-8 h-8 text-indigo-400" />,
      title: "Predictive Maintenance",
      description: "Harness advanced XGBoost models to identify operational anomalies before machine failures trigger downtime."
    },
    {
      icon: <Activity className="w-8 h-8 text-emerald-400" />,
      title: "Real-Time Analytics",
      description: "Visualize continuous stream telemetry across seven critical sensors through high-frequency circular gauges."
    },
    {
      icon: <BarChart3 className="w-8 h-8 text-cyan-400" />,
      title: "Sensor Monitoring",
      description: "Compare oil levels, sound levels, vibration thresholds, temperatures, pressures, currents, and voltages in real-time."
    },
    {
      icon: <AlertTriangle className="w-8 h-8 text-amber-400" />,
      title: "Risk Assessment",
      description: "Automatically scale confidence scores and compute operational risk metrics dynamically using feature weight importances."
    },
    {
      icon: <ShieldCheck className="w-8 h-8 text-violet-400" />,
      title: "Machine Health Tracking",
      description: "Archive diagnostics in SQLite and export historic audits to audit industrial regulations."
    }
  ];

  return (
    <div className="relative min-h-[calc(100vh-80px)] flex flex-col items-center justify-center px-4 py-12 tech-grid overflow-hidden">
      {/* Background glowing spheres */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full accent-glow-cyan blur-[80px] -z-10 pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] rounded-full accent-glow-violet blur-[80px] -z-10 pointer-events-none" />

      {/* Hero Section */}
      <motion.div
        className="text-center max-w-4xl mx-auto z-10"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <motion.div
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-6"
          variants={itemVariants}
        >
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
          </span>
          Industry 4.0 Predictive Intelligence
        </motion.div>

        <motion.h1
          className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 bg-gradient-to-r from-slate-100 via-slate-200 to-indigo-300 bg-clip-text text-transparent leading-[1.1]"
          variants={itemVariants}
        >
          MachineGuard AI
        </motion.h1>

        <motion.h2
          className="text-2xl md:text-3xl font-bold tracking-tight text-slate-300 mb-6"
          variants={itemVariants}
        >
          Predict Machine Failures Before They Happen
        </motion.h2>

        <motion.p
          className="text-lg text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed font-light"
          variants={itemVariants}
        >
          AI-powered predictive maintenance using sensor intelligence and machine learning. Streamline operations and eliminate unplanned factory downtime.
        </motion.p>

        <motion.div
          className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-20"
          variants={itemVariants}
        >
          <button
            onClick={() => onNavigate("predict")}
            className="w-full sm:w-auto px-8 py-3 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all cursor-pointer transform hover:-translate-y-0.5"
          >
            Start Monitoring
            <ArrowRight className="w-5 h-5" />
          </button>
          <button
            onClick={() => onNavigate("dashboard")}
            className="w-full sm:w-auto px-8 py-3 rounded-lg border border-slate-700 hover:border-slate-500 bg-slate-900/60 hover:bg-slate-900 text-slate-200 font-semibold transition-all cursor-pointer transform hover:-translate-y-0.5"
          >
            Open Dashboard
          </button>
        </motion.div>
      </motion.div>

      {/* Feature Grid */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl w-full mx-auto relative z-10 px-4"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={containerVariants}
      >
        {features.map((feature, idx) => (
          <motion.div
            key={idx}
            className="glass-panel glass-panel-hover p-6 rounded-xl flex flex-col justify-between"
            variants={itemVariants}
          >
            <div>
              <div className="mb-4 bg-slate-950/40 w-fit p-3 rounded-lg border border-slate-800">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold mb-3 text-slate-100">{feature.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed font-light">
                {feature.description}
              </p>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
};
