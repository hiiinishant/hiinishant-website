"use client";

import {
  ResponsiveContainer,
  ComposedChart,
  BarChart,
  Bar,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from "recharts";
import type { DailyStatus } from "@/types";

function dayLabel(dateStr: string): string {
  try {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return dateStr.slice(8) || dateStr;
  }
}

function safe(v: number | undefined | null): number {
  return typeof v === "number" && isFinite(v) ? v : 0;
}

const tooltipStyle = {
  backgroundColor: "#09090b",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "10px",
  fontSize: "11px",
  color: "#d4d4d8",
};
const AXIS_TICK = { fill: "#71717a", fontSize: 10 };
const GRID_COLOR = "rgba(255,255,255,0.04)";

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-36 text-zinc-600 gap-2">
      <span className="text-3xl opacity-40">📭</span>
      <p className="text-xs font-mono">No {label} data for this month</p>
    </div>
  );
}

function StudyTrend({ records }: { records: DailyStatus[] }) {
  const sorted = [...records]
    .filter((r) => r.date)
    .sort((a, b) => a.date.localeCompare(b.date));

  const data = sorted.map((r) => ({
    day: dayLabel(r.date),
    studyHours: safe(r.study?.hours),
    questions: safe(r.study?.questions),
  }));

  if (data.every((d) => d.studyHours === 0 && d.questions === 0))
    return <EmptyState label="study" />;

  const totalStudyHours = data.reduce((s, d) => s + d.studyHours, 0);
  const totalQuestions = data.reduce((s, d) => s + d.questions, 0);
  const avgStudyHours = data.length > 0 ? totalStudyHours / data.length : 0;
  const avgQuestions = data.length > 0 ? totalQuestions / data.length : 0;

  return (
    <div className="space-y-5">
      {/* Study KPI Header Cards */}
      <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl border border-white/5 bg-white/[0.02]">
        <div className="text-center">
          <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Total Study</p>
          <p className="text-xs sm:text-sm font-bold text-amber-400 font-mono">
            {totalStudyHours.toFixed(1)}h
          </p>
        </div>
        <div className="text-center border-x border-white/5">
          <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Practice Questions</p>
          <p className="text-xs sm:text-sm font-bold text-indigo-400 font-mono">
            {totalQuestions} Qs
          </p>
        </div>
        <div className="text-center">
          <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Daily Average</p>
          <p className="text-xs sm:text-sm font-bold text-zinc-300 font-mono">
            {avgStudyHours.toFixed(1)}h <span className="text-[10px] text-zinc-500">/day</span>
          </p>
        </div>
      </div>

      {/* Chart 1: Study Hours / Day (Line / Area) */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            Study Hours / Day
          </p>
          <span className="text-[10px] font-mono text-amber-400/80">
            Avg: {avgStudyHours.toFixed(1)}h/day
          </span>
        </div>
        <ResponsiveContainer width="100%" height={150}>
          <ComposedChart data={data} margin={{ top: 6, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="studyGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#facc15" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#facc15" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
            <XAxis dataKey="day" tick={AXIS_TICK} />
            <YAxis width={36} tick={AXIS_TICK} unit="h" />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(v: unknown) => [`${Number(v)}h`, "Study Hours"]}
            />
            {avgStudyHours > 0 && (
              <ReferenceLine
                y={avgStudyHours}
                stroke="#facc1540"
                strokeDasharray="4 2"
                label={{
                  value: `avg ${avgStudyHours.toFixed(1)}h`,
                  fill: "#facc15",
                  fontSize: 9,
                  position: "insideTopRight",
                }}
              />
            )}
            <Area
              type="monotone"
              dataKey="studyHours"
              stroke="#facc15"
              strokeWidth={2}
              fill="url(#studyGrad)"
              dot={{ fill: "#facc15", r: 2.5 }}
              activeDot={{ r: 4.5, stroke: "#facc15", strokeWidth: 2 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Chart 2: Practice Questions / Day (Line / Area) */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-indigo-400" />
            Practice Questions / Day
          </p>
          <span className="text-[10px] font-mono text-indigo-400/80">
            Avg: {avgQuestions.toFixed(1)} Qs/day
          </span>
        </div>
        <ResponsiveContainer width="100%" height={150}>
          <ComposedChart data={data} margin={{ top: 6, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="questionsGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#818cf8" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#818cf8" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
            <XAxis dataKey="day" tick={AXIS_TICK} />
            <YAxis width={36} tick={AXIS_TICK} allowDecimals={false} />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(v: unknown) => [`${Number(v)} Qs`, "Questions"]}
            />
            {avgQuestions > 0 && (
              <ReferenceLine
                y={avgQuestions}
                stroke="#818cf840"
                strokeDasharray="4 2"
                label={{
                  value: `avg ${avgQuestions.toFixed(0)} Qs`,
                  fill: "#a5b4fc",
                  fontSize: 9,
                  position: "insideTopRight",
                }}
              />
            )}
            <Area
              type="monotone"
              dataKey="questions"
              stroke="#818cf8"
              strokeWidth={2}
              fill="url(#questionsGrad)"
              dot={{ fill: "#818cf8", r: 2.5 }}
              activeDot={{ r: 4.5, stroke: "#818cf8", strokeWidth: 2 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function DevTrend({ records }: { records: DailyStatus[] }) {
  const sorted = [...records]
    .filter((r) => r.date)
    .sort((a, b) => a.date.localeCompare(b.date));

  const data = sorted.map((r) => ({
    day: dayLabel(r.date),
    devHours: safe(r.project?.hours),
    tasks: safe(Array.isArray(r.project?.tasks) ? r.project!.tasks.length : 0),
    taskNames: Array.isArray(r.project?.tasks) ? r.project!.tasks : [],
  }));

  if (data.every((d) => d.devHours === 0 && d.tasks === 0))
    return <EmptyState label="dev" />;

  const totalDevHours = data.reduce((s, d) => s + d.devHours, 0);
  const totalTasks = data.reduce((s, d) => s + d.tasks, 0);
  const avgDevHours = data.length > 0 ? totalDevHours / data.length : 0;

  const shippedTasksList = sorted
    .flatMap((r) => (Array.isArray(r.project?.tasks) ? r.project!.tasks : []))
    .filter(Boolean);

  return (
    <div className="space-y-4">
      {/* Dev KPI Header Cards */}
      <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl border border-white/5 bg-white/[0.02]">
        <div className="text-center">
          <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Total Dev Hours</p>
          <p className="text-xs sm:text-sm font-bold text-emerald-400 font-mono">
            {totalDevHours.toFixed(1)}h
          </p>
        </div>
        <div className="text-center border-x border-white/5">
          <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Average Dev Hours</p>
          <p className="text-xs sm:text-sm font-bold text-sky-400 font-mono">
            {avgDevHours.toFixed(1)}h<span className="text-[10px] text-zinc-500">/day</span>
          </p>
        </div>
        <div className="text-center">
          <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Tasks Shipped</p>
          <p className="text-xs sm:text-sm font-bold text-yellow-400 font-mono">
            {totalTasks}
          </p>
        </div>
      </div>

      {/* Chart 1: Dev Hours / Day */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
            Dev Hours / Day
          </p>
          <span className="text-[10px] font-mono text-zinc-600">Hours</span>
        </div>
        <ResponsiveContainer width="100%" height={160}>
          <ComposedChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
            <XAxis dataKey="day" tick={AXIS_TICK} />
            <YAxis tick={AXIS_TICK} unit="h" />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(v: unknown) => [`${Number(v)}h`, "Dev Hours"]}
            />
            {avgDevHours > 0 && (
              <ReferenceLine
                y={avgDevHours}
                stroke="#38bdf850"
                strokeDasharray="4 2"
                label={{
                  value: `avg ${avgDevHours.toFixed(1)}h`,
                  fill: "#7dd3fc",
                  fontSize: 9,
                  position: "insideTopRight",
                }}
              />
            )}
            <Bar dataKey="devHours" fill="#34d399" radius={[3, 3, 0, 0]} maxBarSize={24} />
            <Line
              type="monotone"
              dataKey="devHours"
              stroke="#6ee7b7"
              strokeWidth={1.5}
              dot={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Chart 2: Tasks Shipped / Day */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
            Tasks Shipped / Day
          </p>
          <span className="text-[10px] font-mono text-zinc-600">Count</span>
        </div>
        <ResponsiveContainer width="100%" height={130}>
          <BarChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
            <XAxis dataKey="day" tick={AXIS_TICK} />
            <YAxis tick={AXIS_TICK} allowDecimals={false} />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(v: unknown) => [`${Number(v)} tasks`, "Shipped"]}
            />
            <Bar dataKey="tasks" fill="#4ade80" radius={[3, 3, 0, 0]} maxBarSize={24} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Shipped Tasks Breakdown */}
      {shippedTasksList.length > 0 && (
        <div className="pt-2 border-t border-white/5 space-y-2">
          <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider flex items-center justify-between">
            <span>Shipped Tasks This Month</span>
            <span className="text-zinc-600 font-mono">({shippedTasksList.length} total)</span>
          </p>
          <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
            {shippedTasksList.map((task, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2 text-xs text-zinc-300 bg-white/[0.02] border border-white/5 px-2.5 py-1.5 rounded-lg"
              >
                <span className="text-emerald-400 font-bold text-xs shrink-0 mt-0.5">✓</span>
                <span className="leading-snug">{task}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ContentTrend({ records }: { records: DailyStatus[] }) {
  const data = [...records]
    .filter((r) => r.date)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((r) => ({
      day: dayLabel(r.date),
      youtube: safe(r.content?.videos),
      instagram: safe(r.content?.posts),
      blogs: safe(r.content?.blogs),
    }));
  if (data.every((d) => d.youtube === 0 && d.instagram === 0 && d.blogs === 0))
    return <EmptyState label="content" />;
  return (
    <div>
      <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-2">
        Content Published / Day
      </p>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
          <XAxis dataKey="day" tick={AXIS_TICK} />
          <YAxis tick={AXIS_TICK} allowDecimals={false} />
          <Tooltip contentStyle={tooltipStyle} />
          <Legend
            wrapperStyle={{ fontSize: "10px", color: "#a1a1aa" }}
            iconType="square"
            iconSize={8}
          />
          <Bar dataKey="youtube" name="YouTube" stackId="a" fill="#ef4444" maxBarSize={32} />
          <Bar dataKey="instagram" name="Instagram" stackId="a" fill="#ec4899" maxBarSize={32} />
          <Bar
            dataKey="blogs"
            name="Blog"
            stackId="a"
            fill="#f97316"
            radius={[3, 3, 0, 0]}
            maxBarSize={32}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function HealthTrend({ records }: { records: DailyStatus[] }) {
  const data = [...records]
    .filter((r) => r.date)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((r) => ({
      day: dayLabel(r.date),
      mood: safe(r.mood),
      sleep: safe(r.health?.sleep),
      diet: safe(r.health?.healthyEating),
    }));
  if (!data.some((d) => d.mood > 0 || d.sleep > 0 || d.diet > 0))
    return <EmptyState label="health" />;
  return (
    <div className="space-y-4">
      <div>
        <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-2">
          Mood / 10
        </p>
        <ResponsiveContainer width="100%" height={130}>
          <ComposedChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
            <XAxis dataKey="day" tick={AXIS_TICK} />
            <YAxis tick={AXIS_TICK} domain={[0, 10]} />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(v: unknown) => [`${Number(v)}/10`, "Mood"]}
            />
            <ReferenceLine y={7} stroke="#facc1540" strokeDasharray="4 2" />
            <Bar dataKey="mood" fill="#a78bfa" radius={[3, 3, 0, 0]} maxBarSize={24} />
            <Line
              type="monotone"
              dataKey="mood"
              stroke="#c4b5fd"
              strokeWidth={1.5}
              dot={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <div>
        <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-2">
          Sleep Hours / Night
        </p>
        <ResponsiveContainer width="100%" height={130}>
          <ComposedChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
            <XAxis dataKey="day" tick={AXIS_TICK} />
            <YAxis tick={AXIS_TICK} unit="h" domain={[0, 12]} />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(v: unknown) => [`${Number(v)}h`, "Sleep"]}
            />
            <ReferenceLine y={7} stroke="#38bdf840" strokeDasharray="4 2" />
            <Bar dataKey="sleep" fill="#38bdf8" radius={[3, 3, 0, 0]} maxBarSize={24} />
            <Line
              type="monotone"
              dataKey="sleep"
              stroke="#7dd3fc"
              strokeWidth={1.5}
              dot={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <div>
        <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-2">
          Healthy Diet / 5
        </p>
        <ResponsiveContainer width="100%" height={120}>
          <BarChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
            <XAxis dataKey="day" tick={AXIS_TICK} />
            <YAxis tick={AXIS_TICK} domain={[0, 5]} allowDecimals={false} />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(v: unknown) => [`${Number(v)}/5`, "Diet"]}
            />
            <Bar dataKey="diet" fill="#4ade80" radius={[3, 3, 0, 0]} maxBarSize={24} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function FinanceTrend({ records }: { records: DailyStatus[] }) {
  const sorted = [...records]
    .filter((r) => r.date)
    .sort((a, b) => a.date.localeCompare(b.date));
  let cumulative = 0;
  const data = sorted.map((r) => {
    const income = safe(r.finance?.income);
    const expense = safe(r.finance?.expense);
    cumulative += income - expense;
    return {
      day: dayLabel(r.date),
      income,
      expense,
      dailyNet: income - expense,
      net: cumulative,
    };
  });

  if (data.every((d) => d.income === 0 && d.expense === 0))
    return <EmptyState label="finance" />;

  const totalIncome = data.reduce((s, d) => s + d.income, 0);
  const totalExpense = data.reduce((s, d) => s + d.expense, 0);
  const netSavings = totalIncome - totalExpense;

  const rupee = (v: number) =>
    `${v < 0 ? "-" : ""}₹${Math.abs(v).toLocaleString("en-IN")}`;

  const formatYAxis = (v: number) => {
    if (v === 0) return "₹0";
    if (Math.abs(v) >= 100000) {
      const l = v / 100000;
      return `${v < 0 ? "-" : ""}₹${l % 1 === 0 ? l.toFixed(0) : l.toFixed(1)}L`;
    }
    if (Math.abs(v) >= 1000) {
      const k = v / 1000;
      return `${v < 0 ? "-" : ""}₹${k % 1 === 0 ? k.toFixed(0) : k.toFixed(1)}k`;
    }
    return `${v < 0 ? "-" : ""}₹${Math.abs(v)}`;
  };

  return (
    <div className="space-y-4">
      {/* Finance KPI Header Cards */}
      <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl border border-white/5 bg-white/[0.02]">
        <div className="text-center">
          <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Total Income</p>
          <p className="text-xs sm:text-sm font-bold text-emerald-400 font-mono">
            +₹{totalIncome.toLocaleString("en-IN")}
          </p>
        </div>
        <div className="text-center border-x border-white/5">
          <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Total Expense</p>
          <p className="text-xs sm:text-sm font-bold text-red-400 font-mono">
            −₹{totalExpense.toLocaleString("en-IN")}
          </p>
        </div>
        <div className="text-center">
          <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Net Savings</p>
          <p className={`text-xs sm:text-sm font-bold font-mono ${netSavings >= 0 ? "text-emerald-400" : "text-red-400"}`}>
            {netSavings >= 0 ? "+" : "−"}₹{Math.abs(netSavings).toLocaleString("en-IN")}
          </p>
        </div>
      </div>

      {/* Chart 1: Daily Income vs Expense */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
            Daily Income vs Expense
          </p>
          <span className="text-[10px] font-mono text-zinc-600">₹ (INR)</span>
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={data} margin={{ top: 8, right: 8, left: 2, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
            <XAxis dataKey="day" tick={AXIS_TICK} />
            <YAxis width={48} tick={AXIS_TICK} tickFormatter={formatYAxis} />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(v: unknown, name: unknown) => [
                rupee(Number(v)),
                name === "income" ? "Income" : "Expense",
              ]}
            />
            <Legend
              wrapperStyle={{ fontSize: "10px", color: "#a1a1aa" }}
              iconType="square"
              iconSize={8}
            />
            <Bar dataKey="income" name="Income" fill="#34d399" radius={[3, 3, 0, 0]} maxBarSize={22} />
            <Bar dataKey="expense" name="Expense" fill="#f87171" radius={[3, 3, 0, 0]} maxBarSize={22} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Chart 2: Cumulative Net Savings Growth */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
            Cumulative Net Savings Trend
          </p>
          <span className="text-[10px] font-mono text-zinc-600">Month-to-Date Net</span>
        </div>
        <ResponsiveContainer width="100%" height={150}>
          <ComposedChart data={data} margin={{ top: 8, right: 8, left: 2, bottom: 0 }}>
            <defs>
              <linearGradient id="netSavingsGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#facc15" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#facc15" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
            <XAxis dataKey="day" tick={AXIS_TICK} />
            <YAxis width={48} tick={AXIS_TICK} tickFormatter={formatYAxis} />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(v: unknown) => [
                `${Number(v) >= 0 ? "+" : "−"}₹${Math.abs(Number(v)).toLocaleString("en-IN")}`,
                "Cumulative Net",
              ]}
            />
            <ReferenceLine y={0} stroke="rgba(255,255,255,0.15)" strokeDasharray="3 3" />
            <Area
              type="monotone"
              dataKey="net"
              stroke="#facc15"
              strokeWidth={2}
              fill="url(#netSavingsGrad)"
              dot={{ fill: "#facc15", r: 2.5 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export type TrendKey = "study" | "dev" | "content" | "health" | "finance";

export const TREND_OPTIONS: { key: TrendKey; icon: string; label: string }[] = [
  { key: "study",   icon: "📚", label: "Study Trend" },
  { key: "dev",     icon: "💻", label: "Dev Trend" },
  { key: "content", icon: "🎬", label: "Content Trend" },
  { key: "health",  icon: "❤️", label: "Health Trends" },
  { key: "finance", icon: "💰", label: "Finance Trend" },
];

const TREND_META: Record<TrendKey, { icon: string; label: string }> = {
  study:   { icon: "📚", label: "Study Trend" },
  dev:     { icon: "💻", label: "Development Trend" },
  content: { icon: "🎬", label: "Content Trend" },
  health:  { icon: "❤️", label: "Health Trends" },
  finance: { icon: "💰", label: "Finance Trend" },
};

interface TrendChartsProps {
  trendKey: TrendKey;
  records: DailyStatus[];
  onClose?: () => void;
}

export default function TrendCharts({ trendKey, records, onClose }: TrendChartsProps) {
  const meta = TREND_META[trendKey];
  return (
    <div className="rounded-2xl border border-zinc-700/70 bg-[#09090b]/90 backdrop-blur-xl shadow-lg shadow-black/50 overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-5 py-3 border-b border-white/5 bg-white/2">
        <div className="flex items-center gap-2">
          <span className="text-base leading-none">{meta.icon}</span>
          <span className="text-sm font-bold text-white">{meta.label}</span>
          <span className="text-[10px] font-mono text-zinc-500">
            ({records.length} {records.length === 1 ? "day" : "days"})
          </span>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 text-xs text-brand-400 hover:text-white border border-white/8 bg-white/5 hover:bg-white/10 px-2.5 py-1 rounded-lg transition-all font-mono"
            title="Return to Monthly Logs"
          >
            ← Monthly Logs
          </button>
        )}
      </div>
      <div className="px-4 py-4">
        {trendKey === "study"   && <StudyTrend   records={records} />}
        {trendKey === "dev"     && <DevTrend     records={records} />}
        {trendKey === "content" && <ContentTrend records={records} />}
        {trendKey === "health"  && <HealthTrend  records={records} />}
        {trendKey === "finance" && <FinanceTrend records={records} />}
      </div>
    </div>
  );
}
