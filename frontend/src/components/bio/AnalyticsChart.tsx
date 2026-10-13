"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Eye, MousePointerClick, TrendingUp, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { API_BASE } from "@/lib/api";
import { getIdToken } from "firebase/auth";
import { auth } from "@/lib/firebase";

// ─── Types ────────────────────────────────────────────────────────────────────
interface DailyStat {
  date: string;     // "YYYY-MM-DD"
  views: number;
  clicks: number;
}

interface AnalyticsResponse {
  success: boolean;
  range: string;
  days: number;
  series: DailyStat[];
  totals: {
    views: number;
    totalClicks: number;
  };
}

type Range = "7d" | "30d" | "90d";

const RANGE_LABELS: Record<Range, string> = {
  "7d": "7 Days",
  "30d": "30 Days",
  "90d": "90 Days",
};

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
interface TooltipPayloadEntry {
  name: string;
  value: number;
  color: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-zinc-900/95 border border-white/15 rounded-2xl px-4 py-3 shadow-2xl backdrop-blur-xl">
      <p className="text-[11px] font-semibold text-brand-400 mb-2">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2 text-xs font-medium">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-brand-300 capitalize">{entry.name}:</span>
          <span className="text-white font-bold">{entry.value.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Format x-axis date labels ────────────────────────────────────────────────
function formatDateLabel(dateStr: string, range: Range): string {
  const date = new Date(dateStr + "T00:00:00Z");
  if (range === "7d") {
    return date.toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" });
  }
  if (range === "30d") {
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
  }
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}

// ─── Main Analytics Chart ─────────────────────────────────────────────────────
interface AnalyticsChartProps {
  currentViews: number;
  currentClicks: number;
}

export default function AnalyticsChart({ currentViews, currentClicks }: AnalyticsChartProps) {
  const [range, setRange] = useState<Range>("30d");
  const [data, setData] = useState<DailyStat[]>([]);
  const [totals, setTotals] = useState<{ views: number; totalClicks: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadData = useCallback(async (selectedRange: Range) => {
    if (!auth?.currentUser) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError("");
      const token = await getIdToken(auth.currentUser);
      const res = await fetch(`${API_BASE}/api/bio/me/analytics?range=${selectedRange}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.error || `Server error ${res.status}`);
      }

      const json: AnalyticsResponse = await res.json();
      if (json.success && Array.isArray(json.series)) {
        setData(json.series);
        setTotals(json.totals);
      } else {
        throw new Error("Invalid analytics response.");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load analytics data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    const fetchOnMountOrRangeChange = async () => {
      if (!auth?.currentUser) {
        if (active) setLoading(false);
        return;
      }
      try {
        const token = await getIdToken(auth.currentUser);
        const res = await fetch(`${API_BASE}/api/bio/me/analytics?range=${range}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => null);
          throw new Error(errData?.error || `Server error ${res.status}`);
        }

        const json: AnalyticsResponse = await res.json();
        if (!active) return;
        if (json.success && Array.isArray(json.series)) {
          setData(json.series);
          setTotals(json.totals);
        } else {
          throw new Error("Invalid analytics response.");
        }
      } catch (err: unknown) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Failed to load analytics data.");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchOnMountOrRangeChange();
    return () => {
      active = false;
    };
  }, [range]);

  // Compute totals for the selected window from the series
  const windowViews = data.reduce((s, d) => s + d.views, 0);
  const windowClicks = data.reduce((s, d) => s + d.clicks, 0);
  const ctr = windowViews > 0 ? Math.round((windowClicks / windowViews) * 100) : 0;

  // X-axis tick interval — show every Nth label to prevent crowding
  const tickInterval = range === "7d" ? 0 : range === "30d" ? 4 : 9;

  const chartData = data.map((d) => ({
    ...d,
    label: formatDateLabel(d.date, range),
  }));

  return (
    <div className="space-y-5">
      {/* Header + range selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-accent" />
            <h3 className="text-base font-bold text-white">Analytics</h3>
            {!loading && !error && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                Live
              </span>
            )}
          </div>
          <p className="text-[11px] text-brand-400">
            All-Time: {currentViews.toLocaleString()} views &middot; {currentClicks.toLocaleString()} link clicks
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Range selector */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-zinc-900/60 border border-white/10">
            {(["7d", "30d", "90d"] as Range[]).map((r) => (
              <button
                key={r}
                onClick={() => {
                  setRange(r);
                  setLoading(true);
                }}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  range === r
                    ? "bg-accent text-black shadow-sm"
                    : "text-brand-400 hover:text-white hover:bg-white/5"
                }`}
                aria-pressed={range === r}
                aria-label={`Show ${RANGE_LABELS[r]} of analytics`}
              >
                {RANGE_LABELS[r]}
              </button>
            ))}
          </div>

          {/* Refresh */}
          <button
            onClick={() => loadData(range)}
            disabled={loading}
            className="p-1.5 rounded-lg text-brand-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer disabled:opacity-50"
            aria-label="Refresh analytics"
            title="Refresh"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-2xl bg-zinc-900/60 border border-white/10 p-4">
          <div className="flex items-center justify-between text-brand-400 mb-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider">Views</span>
            <Eye className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold text-white font-mono">
            {windowViews.toLocaleString()}
          </div>
          <p className="text-[10px] text-brand-500 mt-0.5">in {RANGE_LABELS[range]}</p>
        </div>

        <div className="rounded-2xl bg-zinc-900/60 border border-white/10 p-4">
          <div className="flex items-center justify-between text-brand-400 mb-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider">Clicks</span>
            <MousePointerClick className="w-3.5 h-3.5 text-accent" />
          </div>
          <div className="text-2xl font-extrabold text-white font-mono">
            {windowClicks.toLocaleString()}
          </div>
          <p className="text-[10px] text-brand-500 mt-0.5">in {RANGE_LABELS[range]}</p>
        </div>

        <div className="rounded-2xl bg-zinc-900/60 border border-white/10 p-4">
          <div className="flex items-center justify-between text-brand-400 mb-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider">CTR</span>
            <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="text-2xl font-extrabold text-white font-mono">{ctr}%</div>
          <p className="text-[10px] text-brand-500 mt-0.5">click-through rate</p>
        </div>
      </div>

      {/* Chart */}
      <div className="rounded-2xl bg-zinc-900/40 border border-white/10 p-4">
        {loading && (
          <div className="flex items-center justify-center h-48">
            <div className="text-center">
              <Loader2 className="w-6 h-6 animate-spin text-accent mx-auto mb-2" />
              <p className="text-xs text-brand-400">Loading analytics...</p>
            </div>
          </div>
        )}

        {error && !loading && (
          <div className="flex items-center justify-center h-48">
            <div className="text-center">
              <AlertCircle className="w-6 h-6 text-red-400 mx-auto mb-2" />
              <p className="text-xs text-red-400">{error}</p>
              <button
                onClick={() => loadData(range)}
                className="mt-3 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-brand-300 hover:text-white transition-colors cursor-pointer"
              >
                Try again
              </button>
            </div>
          </div>
        )}

        {!loading && !error && data.length > 0 && (
          <>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="viewsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="clicksGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fill: "#71717a", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  interval={tickInterval}
                />
                <YAxis
                  tick={{ fill: "#71717a", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  formatter={(value) => (
                    <span style={{ color: "#a1a1aa", fontSize: 11, textTransform: "capitalize" }}>
                      {value}
                    </span>
                  )}
                />
                <Area
                  type="monotone"
                  dataKey="views"
                  stroke="#10b981"
                  strokeWidth={2}
                  fill="url(#viewsGrad)"
                  dot={false}
                  activeDot={{ r: 4, fill: "#10b981" }}
                />
                <Area
                  type="monotone"
                  dataKey="clicks"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  fill="url(#clicksGrad)"
                  dot={false}
                  activeDot={{ r: 4, fill: "#f59e0b" }}
                />
              </AreaChart>
            </ResponsiveContainer>
            <p className="text-[10px] text-brand-600 mt-2 text-center">
              Data is bot-filtered and rate-limited. Historical data collected from activation date.
            </p>
          </>
        )}

        {!loading && !error && data.length === 0 && (
          <div className="flex items-center justify-center h-48">
            <div className="text-center">
              <TrendingUp className="w-8 h-8 text-brand-600 mx-auto mb-2" />
              <p className="text-sm font-semibold text-white">No data yet</p>
              <p className="text-xs text-brand-400 mt-1">
                Analytics will appear as your profile receives visitors.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* All-time totals */}
      {totals && (
        <p className="text-[11px] text-brand-500 text-center">
          All-time: <span className="text-white font-semibold">{totals.views.toLocaleString()} views</span>
          {" · "}
          <span className="text-white font-semibold">{totals.totalClicks.toLocaleString()} clicks</span>
        </p>
      )}
    </div>
  );
}
