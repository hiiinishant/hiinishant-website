"use client";

import { useState } from "react";
import Link from "next/link";
import { type DailyStatus } from "@/data/statusServer";
import { type FuturePlan } from "@/app/api/future-plans/route";

interface Props {
  initialStatuses: DailyStatus[];
  futurePlans: FuturePlan[];
}

export default function StatusDashboardClient({ initialStatuses, futurePlans }: Props) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredStatuses = initialStatuses.filter((s) => {
    const query = searchQuery.toLowerCase();
    const matchesVibe = s.statusText.toLowerCase().includes(query);
    const matchesTasks = s.tasks.some((t) => t.toLowerCase().includes(query));
    const matchesDate = s.date.toLowerCase().includes(query);
    return matchesVibe || matchesTasks || matchesDate;
  });

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const getDotColor = (statusText: string) => {
    const text = statusText.toLowerCase();
    if (text.includes("video") || text.includes("🎥") || text.includes("shoot") || text.includes("edit")) {
      return "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.45)]";
    }
    if (text.includes("build") || text.includes("coding") || text.includes("code") || text.includes("🚀") || text.includes("dev")) {
      return "bg-cyan-500 shadow-[0_0_8px_rgba(34,211,238,0.45)]";
    }
    if (text.includes("achievement") || text.includes("🏆") || text.includes("milestone") || text.includes("win")) {
      return "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.45)]";
    }
    if (text.includes("blog") || text.includes("write") || text.includes("post") || text.includes("✍️")) {
      return "bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.45)]";
    }
    return "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.45)]";
  };

  const getTaskPrefix = (task: string) => {
    const text = task.toLowerCase();
    if (text.includes("refactored") || text.includes("optimized") || text.includes("cleaned") || text.includes("fix") || text.includes("setup")) {
      return <span className="text-cyan-400 font-semibold shrink-0">[BUILD]</span>;
    }
    if (text.includes("met") || text.includes("planned") || text.includes("community") || text.includes("drafted") || text.includes("schedule")) {
      return <span className="text-blue-400 font-semibold shrink-0">[INFO]</span>;
    }
    if (text.includes("recorded") || text.includes("edited") || text.includes("released") || text.includes("video") || text.includes("shoot")) {
      return <span className="text-rose-400 font-semibold shrink-0">[RELEASE]</span>;
    }
    return <span className="text-emerald-400 font-semibold shrink-0">[OK]</span>;
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden py-16">
      {/* Ambient background glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-accent/2 rounded-full blur-[130px] pointer-events-none -z-10 animate-pulse-slow" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.008)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.008)_1px,transparent_1px)] bg-[size:60px_60px] pointer-events-none -z-20 opacity-40" />

      <div className="max-w-2xl mx-auto px-5 relative z-10">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-12 animate-fade-in">
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Workspace Pulse</h1>
            <p className="text-xs text-brand-400 mt-1 font-mono">Nishant Kumar's live operations logs and activity feed.</p>
          </div>
          <Link 
            href="/admin" 
            className="text-[10px] text-brand-500 hover:text-white border border-white/5 bg-white/2 hover:bg-white/5 px-3 py-1.5 rounded-lg transition-all font-mono uppercase tracking-wider"
          >
            Manage ⚙
          </Link>
        </div>

        {/* Filter Input */}
        <div className="relative mb-12 animate-fade-in font-mono" style={{ animationDelay: "0.05s" }}>
          <input
            type="text"
            placeholder="search_accomplishments --filter=logs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-950/40 border border-white/5 rounded-xl px-4 py-3.5 text-xs text-white placeholder-brand-600 focus:outline-none focus:border-accent/40 focus:ring-1 focus:ring-accent/20 focus:bg-zinc-950/60 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] text-brand-400 hover:text-white bg-white/5 hover:bg-white/10 px-2 py-1 rounded"
            >
              reset
            </button>
          )}
        </div>

        {/* Timeline list */}
        <div className="relative pl-6 border-l border-white/5 space-y-12 animate-fade-in" style={{ animationDelay: "0.1s" }}>
          {filteredStatuses.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-white/5 rounded-xl font-mono">
              <p className="text-brand-500 text-xs">NO WORK LOGS MATCH FILTER KEYWORDS.</p>
            </div>
          ) : (
            filteredStatuses.map((status) => (
              <div key={status.id} className="relative group space-y-3">
                {/* Timeline Dot */}
                <div className="absolute -left-[29px] top-1.5 w-2 h-2 rounded-full bg-background flex items-center justify-center">
                  <div className={`w-1.5 h-1.5 rounded-full ${getDotColor(status.statusText)}`} />
                </div>

                {/* Date Header */}
                <div className="flex items-center justify-between text-[10px] font-mono font-bold tracking-wider uppercase text-brand-400">
                  <span>{formatDate(status.date)}</span>
                  <span className="text-[9px] text-brand-600 normal-case font-normal">
                    {new Date(status.updatedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })} IST
                  </span>
                </div>

                {/* Focus / Activity */}
                <div className="text-[13px] font-semibold text-white tracking-tight leading-snug">
                  {status.statusText}
                </div>

                {/* Task Details */}
                {status.tasks.length > 0 && (
                  <div className="space-y-1.5 pl-0.5 mt-2">
                    {status.tasks.map((task, idx) => {
                      const isLast = idx === status.tasks.length - 1;
                      return (
                        <div key={idx} className="flex items-start gap-2 text-xs font-mono text-brand-300">
                          <span className="text-brand-600 select-none">{isLast ? "└─" : "├─"}</span>
                          {getTaskPrefix(task)}
                          <span className="leading-relaxed">{task}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
}
