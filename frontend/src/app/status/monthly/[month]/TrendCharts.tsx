"use client";

import {
  ResponsiveContainer,
  ComposedChart,
  BarChart,
  Bar,
  Line,
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
  const data = [...records]
    .filter((r) => r.date)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((r) => ({
      day: dayLabel(r.date),
      studyHours: safe(r.study?.hours),
      questions: safe(r.study?.questions),
    }));
  if (data.every((d) => d.studyHours === 0 && d.questions === 0))
    return <EmptyState label="study" />;
  return (
    <div className="space-y-4">
      <div>
        <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-2">
          Study Hours / Day
        </p>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
            <XAxis dataKey="day" tick={AXIS_TICK} />
            <YAxis tick={AXIS_TICK} unit="h" />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(v: unknown) => [`${Number(v)}h`, "Study Hours"]}
            />
            <Bar dataKey="studyHours" fill="#facc15" radius={[3, 3, 0, 0]} maxBarSize={28} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div>
        <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-2">
          Practice Questions / Day
        </p>
        <ResponsiveContainer width="100%" height={140}>
          <BarChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
            <XAxis dataKey="day" tick={AXIS_TICK} />
            <YAxis tick={AXIS_TICK} />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(v: unknown) => [`${Number(v)} Qs`, "Questions"]}
            />
            <Bar dataKey="questions" fill="#818cf8" radius={[3, 3, 0, 0]} maxBarSize={28} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function DevTrend({ records }: { records: DailyStatus[] }) {
  const data = [...records]
    .filter((r) => r.date)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((r) => ({
      day: dayLabel(r.date),
      devHours: safe(r.project?.hours),
      tasks: safe(Array.isArray(r.project?.tasks) ? r.project!.tasks.length : 0),
    }));
  if (data.every((d) => d.devHours === 0 && d.tasks === 0))
    return <EmptyState label="dev" />;
  return (
    <div className="space-y-4">
      <div>
        <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-2">
          Dev Hours / Day
        </p>
        <ResponsiveContainer width="100%" height={160}>
          <ComposedChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
            <XAxis dataKey="day" tick={AXIS_TICK} />
            <YAxis tick={AXIS_TICK} unit="h" />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(v: unknown) => [`${Number(v)}h`, "Dev Hours"]}
            />
            <Bar dataKey="devHours" fill="#34d399" radius={[3, 3, 0, 0]} maxBarSize={28} />
            <Line
              type="monotone"
              dataKey="devHours"
              stroke="#6ee7b7"
              strokeWidth={1.5}
              dot={false}
              strokeDasharray="4 2"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <div>
        <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-2">
          Tasks Shipped / Day
        </p>
        <ResponsiveContainer width="100%" height={130}>
          <BarChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
            <XAxis dataKey="day" tick={AXIS_TICK} />
            <YAxis tick={AXIS_TICK} allowDecimals={false} />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(v: unknown) => [`${Number(v)}`, "Tasks"]}
            />
            <Bar dataKey="tasks" fill="#4ade80" radius={[3, 3, 0, 0]} maxBarSize={28} />
          </BarChart>
        </ResponsiveContainer>
      </div>
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
    return { day: dayLabel(r.date), income, expense, net: cumulative };
  });
  if (data.every((d) => d.income === 0 && d.expense === 0))
    return <EmptyState label="finance" />;
  const rupee = (v: number) =>
    `${v < 0 ? "-" : ""}Rs.${Math.abs(v).toLocaleString("en-IN")}`;
  return (
    <div className="space-y-4">
      <div>
        <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-2">
          Daily Income vs Expense
        </p>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
            <XAxis dataKey="day" tick={AXIS_TICK} />
            <YAxis
              tick={AXIS_TICK}
              tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`}
            />
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
            <Bar dataKey="income" name="Income" fill="#34d399" radius={[3, 3, 0, 0]} maxBarSize={24} />
            <Bar dataKey="expense" name="Expense" fill="#f87171" radius={[3, 3, 0, 0]} maxBarSize={24} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div>
        <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-2">
          Cumulative Net Savings
        </p>
        <ResponsiveContainer width="100%" height={140}>
          <ComposedChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
            <XAxis dataKey="day" tick={AXIS_TICK} />
            <YAxis
              tick={AXIS_TICK}
              tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(v: unknown) => [rupee(Number(v)), "Net Savings"]}
            />
            <ReferenceLine y={0} stroke="rgba(255,255,255,0.15)" />
            <Line
              type="monotone"
              dataKey="net"
              stroke="#facc15"
              strokeWidth={2}
              dot={{ fill: "#facc15", r: 2 }}
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
  health:  { icon: "❤️", label: "Health Trend" },
  finance: { icon: "💰", label: "Finance Trend" },
};

interface TrendChartsProps {
  trendKey: TrendKey;
  records: DailyStatus[];
}

export default function TrendCharts({ trendKey, records }: TrendChartsProps) {
  const meta = TREND_META[trendKey];
  return (
    <div className="rounded-2xl border border-zinc-700/70 bg-[#09090b]/90 backdrop-blur-xl shadow-lg shadow-black/50 overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-3 border-b border-white/5 bg-white/2">
        <span className="text-base leading-none">{meta.icon}</span>
        <span className="text-sm font-bold text-white">{meta.label}</span>
        <span className="ml-auto text-[10px] font-mono text-zinc-600">
          {records.length} {records.length === 1 ? "day" : "days"} of data
        </span>
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
