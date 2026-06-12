"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

// ─── Types ───────────────────────────────────────────────────────────────────
interface UpdateItem {
  id: string;
  category: "video" | "blog" | "achievement" | "announcement";
  title: string;
  description: string;
  date: string;
  href?: string;
  badge?: string;
  meta?: string;
  isNew?: boolean;
}

interface FuturePlan {
  id: string;
  title: string;
  description: string;
  targetDate: string;
  category: "academic" | "business" | "community" | "general";
  status: "planned" | "in-progress" | "completed";
}

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  date: string;
  read: boolean;
}

interface DailyStatus {
  id: string;
  date: string;
  statusText: string;
  tasks: string[];
  updatedAt: string;
}

// ─── Config ──────────────────────────────────────────────────────────────────
const ADMIN_PASSWORD = "nishant2am";

// ─── Category / Status Configs ───────────────────────────────────────────────
const updateCategoryConfig: Record<UpdateItem["category"], { label: string; color: string; bg: string; dot: string }> = {
  video:        { label: "YouTube Video",  color: "text-red-400",     bg: "bg-red-500/10 border-red-500/20",     dot: "bg-red-400" },
  blog:         { label: "Blog Post",      color: "text-blue-400",    bg: "bg-blue-500/10 border-blue-500/20",   dot: "bg-blue-400" },
  achievement:  { label: "Achievement",    color: "text-amber-400",   bg: "bg-amber-500/10 border-amber-500/20", dot: "bg-amber-400" },
  announcement: { label: "Announcement",  color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20", dot: "bg-emerald-400" },
};

const planCategoryConfig: Record<FuturePlan["category"], { label: string; color: string }> = {
  general:   { label: "General",            color: "text-brand-400" },
  academic:  { label: "Academic / GATE",    color: "text-violet-400" },
  business:  { label: "Business / Startup", color: "text-amber-400"  },
  community: { label: "Community",          color: "text-teal-400"   },
};

const statusConfig: Record<FuturePlan["status"], { label: string; color: string; bg: string; icon: string }> = {
  "planned":     { label: "Planned",     color: "text-brand-400",   bg: "bg-white/5 border-white/10",              icon: "○" },
  "in-progress": { label: "In Progress", color: "text-amber-400",   bg: "bg-amber-500/10 border-amber-500/30",     icon: "◑" },
  "completed":   { label: "Completed",   color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/30", icon: "●" },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ value, label, color, icon }: { value: number; label: string; color: string; icon: string }) {
  return (
    <div className="flex flex-col gap-1 p-4 rounded-2xl bg-zinc-950/40 border border-white/5 hover:border-white/10 hover:bg-zinc-950/60 transition-all font-mono">
      <span className="text-lg">{icon}</span>
      <span className={`text-xl font-bold ${color}`}>{value}</span>
      <span className="text-[9px] text-brand-400 uppercase tracking-widest font-semibold">{label}</span>
    </div>
  );
}

function InputField({ label, name, value, onChange, placeholder, required, type = "text", hint }: {
  label: string; name: string; value: string; onChange: (e: any) => void;
  placeholder?: string; required?: boolean; type?: string; hint?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5 font-mono">
      <label className="text-[10px] font-bold uppercase tracking-widest text-brand-400 flex items-center gap-1">
        {label} {required && <span className="text-accent">*</span>}
      </label>
      {hint && <p className="text-[9px] text-brand-500 -mt-0.5">{hint}</p>}
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className="bg-zinc-950/40 border border-white/5 rounded-xl px-4 py-3 text-xs text-white placeholder-brand-600 focus:outline-none focus:border-accent/40 focus:ring-1 focus:ring-accent/20 focus:bg-zinc-950/70 transition-all"
      />
    </div>
  );
}

function SelectField({ label, name, value, onChange, options, required }: {
  label: string; name: string; value: string; onChange: (e: any) => void;
  options: { value: string; label: string }[]; required?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5 font-mono">
      <label className="text-[10px] font-bold uppercase tracking-widest text-brand-400 flex items-center gap-1">
        {label} {required && <span className="text-accent">*</span>}
      </label>
      <div className="relative">
        <select
          name={name}
          value={value}
          onChange={onChange}
          className="w-full bg-zinc-950/40 border border-white/5 rounded-xl px-4 py-3 pr-10 text-xs text-white focus:outline-none focus:border-accent/40 focus:ring-1 focus:ring-accent/20 transition-all appearance-none"
        >
          {options.map((o) => <option key={o.value} value={o.value} className="bg-zinc-900">{o.label}</option>)}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-brand-400 text-[10px]">
          ▼
        </div>
      </div>
    </div>
  );
}

function TextAreaField({ label, name, value, onChange, placeholder, required, rows = 3 }: {
  label: string; name: string; value: string; onChange: (e: any) => void;
  placeholder?: string; required?: boolean; rows?: number;
}) {
  return (
    <div className="flex flex-col gap-1.5 font-mono">
      <label className="text-[10px] font-bold uppercase tracking-widest text-brand-400 flex items-center gap-1">
        {label} {required && <span className="text-accent">*</span>}
      </label>
      <textarea
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        rows={rows}
        className="bg-zinc-950/40 border border-white/5 rounded-xl px-4 py-3 text-xs text-white placeholder-brand-600 focus:outline-none focus:border-accent/40 focus:ring-1 focus:ring-accent/20 focus:bg-zinc-950/70 transition-all resize-none"
      />
    </div>
  );
}

function Toast({ message, type, onClose }: { message: string; type: "success" | "error"; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-xl border shadow-2xl animate-slide-up text-xs font-mono font-semibold transition-all ${
      type === "success"
        ? "bg-emerald-950/90 border-emerald-500/20 text-emerald-300 backdrop-blur-md"
        : "bg-red-950/90 border-red-500/20 text-red-300 backdrop-blur-md"
    }`}>
      <span className="text-base">{type === "success" ? "✓" : "✗"}</span>
      <span>{message}</span>
      <button onClick={onClose} className="ml-2 text-white/30 hover:text-white transition-colors">✕</button>
    </div>
  );
}

function ConfirmDialog({ message, onConfirm, onCancel }: {
  message: string; onConfirm: () => void; onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="glass-strong border border-white/8 rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl font-mono">
        <div className="text-lg mb-3">🚨 SYSTEM ALERT</div>
        <p className="text-xs text-brand-300 leading-relaxed mb-6">{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-brand-300 hover:text-white hover:border-white/20 transition-all">
            Cancel
          </button>
          <button onClick={onConfirm} className="flex-1 py-2.5 rounded-xl bg-red-500/20 border border-red-500/30 text-xs text-red-400 hover:bg-red-500/30 transition-all font-semibold">
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
type Tab = "overview" | "daily-status" | "add-update" | "manage-updates" | "add-plan" | "manage-plans" | "messages";

export default function AdminPage() {
  const [unlocked, setUnlocked] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginShaking, setLoginShaking] = useState(false);

  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [updates, setUpdates] = useState<UpdateItem[]>([]);
  const [plans, setPlans] = useState<FuturePlan[]>([]);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [statuses, setStatuses] = useState<DailyStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [confirm, setConfirm] = useState<{ message: string; onConfirm: () => void } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [expandedMsg, setExpandedMsg] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [latency, setLatency] = useState<number | null>(null);

  const showToast = (message: string, type: "success" | "error") => setToast({ message, type });

  // Update Form
  const [updateForm, setUpdateForm] = useState({
    category: "announcement", title: "", description: "",
    date: new Date().toISOString().split("T")[0],
    href: "", badge: "", meta: "", isNew: true,
  });

  // Plan Form
  const [planForm, setPlanForm] = useState({
    title: "", description: "", targetDate: "", category: "general", status: "planned",
  });

  // Daily Status Form
  const [statusForm, setStatusForm] = useState<{
    date: string;
    statusText: string;
    tasksText: string;
  }>({
    date: new Date().toISOString().split("T")[0],
    statusText: "",
    tasksText: "",
  });

  // Fetch Public Logs (With Latency Ping)
  const fetchPublicLogs = useCallback(async () => {
    setLoading(true);
    const start = performance.now();
    try {
      const [planRes, statusRes] = await Promise.all([
        fetch("/api/future-plans"),
        fetch("/api/status"),
      ]);
      setPlans(await planRes.json());
      setStatuses(await statusRes.json());
      const end = performance.now();
      setLatency(Math.round(end - start));
    } catch (e) {
      showToast("Failed to fetch operational status logs.", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch Admin Protected Databases
  const fetchAdminData = useCallback(async () => {
    setLoading(true);
    try {
      const [updRes, msgRes] = await Promise.all([
        fetch("/api/updates"),
        fetch("/api/contact"),
      ]);
      setUpdates(await updRes.json());
      setMessages(await msgRes.json());
    } catch (e) {
      showToast("Failed to load admin databases.", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  // On Mount: Load public statuses
  useEffect(() => {
    fetchPublicLogs();
  }, [fetchPublicLogs]);

  // When Unlocked: Load CMS
  useEffect(() => {
    if (unlocked) {
      fetchAdminData();
    }
  }, [unlocked, fetchAdminData]);

  // Handle Admin Auth
  const handleLogin = (pw: string) => {
    if (pw === ADMIN_PASSWORD) {
      setUnlocked(true);
      setShowLoginModal(false);
      setLoginError("");
      setAdminPasswordInput("");
      showToast("Console unlocked. Mode: Admin Write Enabled.", "success");
    } else {
      setLoginError("Incorrect access credentials.");
      setLoginShaking(true);
      setTimeout(() => setLoginShaking(false), 600);
    }
  };

  const handleLogout = () => {
    setUnlocked(false);
    setActiveTab("overview");
    showToast("Console locked. Mode: Public Read Only.", "success");
  };

  // ── Submit Update ──
  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/updates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateForm),
      });
      if (!res.ok) throw new Error("Failed to publish feed update.");
      const newItem = await res.json();
      setUpdates((prev) => [newItem, ...prev]);
      setUpdateForm({ category: "announcement", title: "", description: "", date: new Date().toISOString().split("T")[0], href: "", badge: "", meta: "", isNew: true });
      showToast("Update published successfully!", "success");
      setActiveTab("manage-updates");
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Submit Plan ──
  const handlePlanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/future-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(planForm),
      });
      if (!res.ok) throw new Error("Failed to add roadmap item.");
      const newPlan = await res.json();
      setPlans((prev) => [...prev, newPlan]);
      setPlanForm({ title: "", description: "", targetDate: "", category: "general", status: "planned" });
      showToast("Milestone added to roadmap!", "success");
      setActiveTab("manage-plans");
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Delete Update ──
  const deleteUpdate = (id: string, title: string) => {
    setConfirm({
      message: `Delete update "${title}" from feed?`,
      onConfirm: async () => {
        setConfirm(null);
        try {
          const res = await fetch("/api/updates", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id }),
          });
          if (!res.ok) throw new Error("Failed to delete update.");
          setUpdates((prev) => prev.filter((u) => u.id !== id));
          showToast("Update deleted successfully.", "success");
        } catch (err: any) {
          showToast(err.message, "error");
        }
      },
    });
  };

  // ── Delete Plan ──
  const deletePlan = (id: string, title: string) => {
    setConfirm({
      message: `Remove "${title}" from subsystems roadmap?`,
      onConfirm: async () => {
        setConfirm(null);
        try {
          const res = await fetch("/api/future-plans", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id }),
          });
          if (!res.ok) throw new Error("Failed to delete roadmap item.");
          setPlans((prev) => prev.filter((p) => p.id !== id));
          showToast("Item removed from roadmap.", "success");
        } catch (err: any) {
          showToast(err.message, "error");
        }
      },
    });
  };

  // ── Delete Message ──
  const deleteMessage = (id: string, name: string) => {
    setConfirm({
      message: `Delete inquiry message from "${name}"?`,
      onConfirm: async () => {
        setConfirm(null);
        try {
          const res = await fetch("/api/contact", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id }),
          });
          if (!res.ok) throw new Error("Failed to delete message.");
          setMessages((prev) => prev.filter((m) => m.id !== id));
          showToast("Message deleted.", "success");
        } catch (err: any) {
          showToast(err.message, "error");
        }
      },
    });
  };

  // ── Mark Message as Read ──
  const markAsRead = async (id: string) => {
    try {
      await fetch("/api/contact", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      setMessages((prev) => prev.map((m) => m.id === id ? { ...m, read: true } : m));
    } catch { /* silent */ }
  };

  // ── Toggle Plan Status ──
  const togglePlanStatus = async (plan: FuturePlan) => {
    const cycle: FuturePlan["status"][] = ["planned", "in-progress", "completed"];
    const next = cycle[(cycle.indexOf(plan.status) + 1) % cycle.length];
    try {
      const res = await fetch("/api/future-plans", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: plan.id, status: next }),
      });
      if (!res.ok) throw new Error("Failed to update status.");
      setPlans((prev) => prev.map((p) => p.id === plan.id ? { ...p, status: next } : p));
      showToast(`Thread status cycled to "${next}".`, "success");
    } catch (err: any) {
      showToast(err.message, "error");
    }
  };

  // ── Submit Daily Status ──
  const handleStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const tasks = statusForm.tasksText
        .split("\n")
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      const res = await fetch("/api/status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": ADMIN_PASSWORD,
        },
        body: JSON.stringify({
          date: statusForm.date,
          statusText: statusForm.statusText,
          tasks,
        }),
      });

      if (!res.ok) throw new Error("Failed to save daily log.");
      const updatedItem = await res.json();

      setStatuses((prev) => {
        const existingIndex = prev.findIndex((s) => s.date === updatedItem.date);
        if (existingIndex > -1) {
          const updated = [...prev];
          updated[existingIndex] = updatedItem;
          return updated;
        } else {
          return [updatedItem, ...prev].sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
          );
        }
      });

      setStatusForm({
        date: new Date().toISOString().split("T")[0],
        statusText: "",
        tasksText: "",
      });

      showToast("Workspace commit published successfully!", "success");
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Delete Daily Status ──
  const deleteStatus = (id: string, date: string) => {
    setConfirm({
      message: `Delete workspace commit for date ${date}?`,
      onConfirm: async () => {
        setConfirm(null);
        try {
          const res = await fetch("/api/status", {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
              "x-admin-password": ADMIN_PASSWORD,
            },
            body: JSON.stringify({ id }),
          });
          if (!res.ok) throw new Error("Failed to delete workspace commit.");
          setStatuses((prev) => prev.filter((s) => s.id !== id));
          showToast("Workspace commit deleted.", "success");
        } catch (err: any) {
          showToast(err.message, "error");
        }
      },
    });
  };

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

  // 30 Days activity bar mapping
  const getUptimeBars = () => {
    const bars = [];
    const today = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split("T")[0]; // YYYY-MM-DD
      const statusForDay = statuses.find((s) => s.date === dateStr);
      bars.push({
        date: dateStr,
        hasStatus: !!statusForDay,
        statusText: statusForDay ? statusForDay.statusText : "No logs recorded",
        tasksCount: statusForDay ? statusForDay.tasks.length : 0,
      });
    }
    return bars;
  };

  // Color-code uptime bars dynamically based on keywords
  const getBarColor = (statusText: string, hasStatus: boolean) => {
    if (!hasStatus) return "bg-white/5 hover:bg-white/10";
    const text = statusText.toLowerCase();
    if (text.includes("video") || text.includes("🎥") || text.includes("shoot") || text.includes("edit")) {
      return "bg-gradient-to-t from-rose-600 to-rose-400 hover:from-rose-400 hover:to-accent shadow-[0_0_8px_rgba(244,63,94,0.3)]";
    }
    if (text.includes("build") || text.includes("coding") || text.includes("code") || text.includes("🚀") || text.includes("dev")) {
      return "bg-gradient-to-t from-cyan-600 to-cyan-400 hover:from-cyan-400 hover:to-accent shadow-[0_0_8px_rgba(34,211,238,0.3)]";
    }
    if (text.includes("achievement") || text.includes("🏆") || text.includes("milestone") || text.includes("win")) {
      return "bg-gradient-to-t from-amber-600 to-amber-400 hover:from-amber-400 hover:to-accent shadow-[0_0_8px_rgba(245,158,11,0.3)]";
    }
    if (text.includes("blog") || text.includes("write") || text.includes("post") || text.includes("✍️")) {
      return "bg-gradient-to-t from-purple-600 to-purple-400 hover:from-purple-400 hover:to-accent shadow-[0_0_8px_rgba(168,85,247,0.3)]";
    }
    return "bg-gradient-to-t from-emerald-600 to-emerald-400 hover:from-emerald-400 hover:to-accent shadow-[0_0_8px_rgba(16,185,129,0.3)]";
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

  // Uptime bar click handler: filter logs by date
  const handleBarClick = (bar: any) => {
    if (!bar.hasStatus) return;
    if (searchQuery === bar.date) {
      setSearchQuery("");
    } else {
      setSearchQuery(bar.date);
    }
  };

  // Categorize log tasks dynamically for terminal aesthetic
  const getTaskPrefix = (task: string) => {
    const text = task.toLowerCase();
    if (text.includes("refactored") || text.includes("optimized") || text.includes("cleaned") || text.includes("fix") || text.includes("setup")) {
      return <span className="text-cyan-400 font-semibold">[BUILD]</span>;
    }
    if (text.includes("met") || text.includes("planned") || text.includes("community") || text.includes("drafted") || text.includes("schedule")) {
      return <span className="text-blue-400 font-semibold">[INFO]</span>;
    }
    if (text.includes("recorded") || text.includes("edited") || text.includes("released") || text.includes("video") || text.includes("shoot")) {
      return <span className="text-rose-400 font-semibold">[RELEASE]</span>;
    }
    return <span className="text-emerald-400 font-semibold">[OK]</span>;
  };

  const filteredStatuses = statuses.filter((s) => {
    const query = searchQuery.toLowerCase();
    const matchesText = s.statusText.toLowerCase().includes(query);
    const matchesTasks = s.tasks.some((t) => t.toLowerCase().includes(query));
    const matchesDate = s.date.toLowerCase().includes(query);
    return matchesText || matchesTasks || matchesDate;
  });

  const activeStatus = statuses[0];

  const inProgressPlans = plans.filter((p) => p.status === "in-progress");
  const plannedPlans = plans.filter((p) => p.status === "planned");
  const completedPlans = plans.filter((p) => p.status === "completed");

  const unreadCount = messages.filter((m) => !m.read).length;

  const stats = {
    totalUpdates: updates.length,
    videos: updates.filter((u) => u.category === "video").length,
    blogs: updates.filter((u) => u.category === "blog").length,
    achievements: updates.filter((u) => u.category === "achievement").length,
    announcements: updates.filter((u) => u.category === "announcement").length,
    totalPlans: plans.length,
    planned: plans.filter((p) => p.status === "planned").length,
    inProgress: plans.filter((p) => p.status === "in-progress").length,
    completed: plans.filter((p) => p.status === "completed").length,
    totalStatuses: statuses.length,
  };

  const tabs: { id: Tab; label: string; icon: string; badge?: number }[] = [
    { id: "overview",       label: "overview",        icon: "◈" },
    { id: "daily-status",   label: "daily_status",    icon: "⚡" },
    { id: "add-update",     label: "publish_feed",    icon: "＋" },
    { id: "manage-updates", label: "manage_feed",     icon: "≡" },
    { id: "add-plan",       label: "queue_plan",      icon: "◎" },
    { id: "manage-plans",   label: "subsystems",      icon: "⌁" },
    { id: "messages",       label: "inboxes",         icon: "✉", badge: unreadCount },
  ];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      {confirm && <ConfirmDialog message={confirm.message} onConfirm={confirm.onConfirm} onCancel={() => setConfirm(null)} />}

      {/* Ambient background glows */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-accent/3 rounded-full blur-[130px] pointer-events-none -z-10 animate-pulse-slow" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[600px] h-[600px] bg-blue-500/2 rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:64px_64px] pointer-events-none -z-20 opacity-30" />

      {/* TOP HEADER CONTROLS */}
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-accent/15 border border-accent/25 flex items-center justify-center font-bold text-accent text-sm font-mono transition-transform hover:scale-105">
              NK
            </div>
            <div>
              <h1 className="text-xs font-bold text-white leading-none font-mono">Nishant OS Console</h1>
              <p className="text-[9px] text-brand-500 leading-none mt-1 font-mono uppercase tracking-wider">
                {unlocked ? "SYSTEM ADMIN: WRITE_ACCESS_GRANTED" : "SYSTEM VISITOR: READ_ONLY_FEED"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 font-mono text-[9px]">
            <div className="flex items-center gap-2 text-brand-400 bg-white/3 border border-white/5 px-2.5 py-1.5 rounded-lg">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              API_LATENCY: {latency ? `${latency}ms` : "checking..."}
            </div>
            {unlocked ? (
              <button
                onClick={handleLogout}
                className="text-red-400 hover:bg-red-500/10 border border-red-500/20 px-3 py-1.5 rounded-lg transition-all cursor-pointer font-bold uppercase tracking-wider"
              >
                Lock Console ⎋
              </button>
            ) : (
              <button
                onClick={() => setShowLoginModal(true)}
                className="text-accent hover:bg-accent/10 border border-accent/25 px-3 py-1.5 rounded-lg transition-all cursor-pointer font-bold uppercase tracking-wider shadow-sm shadow-accent/5"
              >
                Unlock CMS ⚙
              </button>
            )}
          </div>
        </div>
      </div>

      {/* MAIN LAYOUT */}
      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-8 relative">
        
        {/* PUBLIC CONSOLE READ-ONLY FEED */}
        {!unlocked && (
          <div className="max-w-2xl mx-auto py-8 space-y-10 animate-fade-in relative z-10">
            {/* Header & Subtitle */}
            <div className="flex items-center justify-between border-b border-white/5 pb-6">
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">Workspace Pulse</h2>
                <p className="text-xs text-brand-400 mt-1 font-mono">Nishant Kumar's live operations logs and activity feed.</p>
              </div>
            </div>

            {/* Filter Input */}
            <div className="relative font-mono">
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
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-mono text-brand-400 hover:text-white bg-white/5 hover:bg-white/10 px-2 py-1 rounded"
                >
                  reset
                </button>
              )}
            </div>

            {/* Timeline logs */}
            <div className="relative pl-6 border-l border-white/5 space-y-12">
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
                      <span className="text-[9px] text-brand-600 normal-case font-normal font-mono">
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

            {/* Quick Access Admin CMS Unlock */}
            <div className="border-t border-white/5 pt-8 text-center">
              <button
                onClick={() => setShowLoginModal(true)}
                className="px-6 py-2.5 rounded-xl bg-white/3 hover:bg-white/5 border border-white/5 hover:border-white/10 text-[10px] font-bold text-brand-400 hover:text-white transition-all font-mono uppercase tracking-wider cursor-pointer"
              >
                Access CMS Console ⚙
              </button>
            </div>
          </div>
        )}

        {/* AUTHENTICATED CMS WRITER PANEL */}
        {unlocked && (
          <div className="flex gap-6 animate-fade-in">
            {/* Sidebar nav */}
            <nav className="hidden md:flex flex-col gap-1 w-52 shrink-0 font-mono">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold text-left transition-all duration-200 cursor-pointer ${
                    activeTab === tab.id
                      ? "bg-accent/10 border border-accent/20 text-accent font-bold"
                      : "text-brand-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <span className="text-sm w-5 text-center">{tab.icon}</span>
                  <span className="flex-1">{tab.label}</span>
                  {tab.badge != null && tab.badge > 0 && (
                    <span className="text-[9px] font-black bg-accent text-black rounded-full w-4 h-4 flex items-center justify-center">{tab.badge}</span>
                  )}
                </button>
              ))}
              <div className="my-2 border-t border-white/5" />
              <button
                onClick={async () => { await fetchPublicLogs(); await fetchAdminData(); }}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold text-brand-400 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
              >
                <span className="text-sm w-5 text-center">↺</span>
                Sync DB nodes
              </button>
            </nav>

            {/* Mobile tab bar */}
            <div className="md:hidden mb-4 flex gap-1 overflow-x-auto pb-1 w-full font-mono">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                    activeTab === tab.id ? "bg-accent/10 border border-accent/20 text-accent font-bold" : "text-brand-400 bg-white/3 border border-white/5"
                  }`}
                >
                  <span>{tab.icon}</span>{tab.label}
                </button>
              ))}
            </div>

            {/* Main content */}
            <div className="flex-1 min-w-0">

              {/* ── OVERVIEW ── */}
              {activeTab === "overview" && (
                <div className="space-y-8 font-mono text-xs">
                  <div>
                    <h2 className="text-lg font-bold text-white mb-1">Dashboard Overview</h2>
                    <p className="text-[10px] text-brand-400">Live operational metrics summary across status logs and roadmap databases.</p>
                  </div>

                  {loading ? (
                    <div className="text-center py-12 text-brand-400 text-xs">Syncing database node values...</div>
                  ) : (
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-[10px] uppercase font-bold text-brand-500 tracking-wider mb-3">Daily Status Feed</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          <StatCard value={stats.totalStatuses} label="Total logs" color="text-white"     icon="⚡" />
                          <StatCard value={statuses.length > 0 ? 1 : 0} label="Today Active" color="text-amber-400" icon="📅" />
                        </div>
                      </div>

                      <div>
                        <h3 className="text-[10px] uppercase font-bold text-brand-500 tracking-wider mb-3">Updates Feed Database</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                          <StatCard value={stats.totalUpdates}  label="Total"         color="text-white"         icon="📊" />
                          <StatCard value={stats.videos}        label="Videos"        color="text-red-400"       icon="▶️" />
                          <StatCard value={stats.blogs}         label="Blogs"         color="text-blue-400"      icon="✍️" />
                          <StatCard value={stats.achievements}  label="Achievements"  color="text-amber-400"     icon="🏆" />
                          <StatCard value={stats.announcements} label="Announcements" color="text-emerald-400"   icon="📣" />
                        </div>
                      </div>

                      <div>
                        <h3 className="text-[10px] uppercase font-bold text-brand-500 tracking-wider mb-3">Milestone Roadmap</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <StatCard value={stats.totalPlans} label="Roadmap total" color="text-white"         icon="🗺️" />
                          <StatCard value={stats.planned}    label="Planned"      color="text-brand-300"     icon="○" />
                          <StatCard value={stats.inProgress} label="In Progress"  color="text-amber-400"     icon="◑" />
                          <StatCard value={stats.completed}  label="Completed"    color="text-emerald-400"   icon="✅" />
                        </div>
                      </div>

                      {/* Quick actions */}
                      <div className="space-y-3 pt-3">
                        <h3 className="text-[10px] uppercase font-bold text-brand-500 tracking-wider">Operational Handlers</h3>
                        <div className="grid grid-cols-3 gap-3 font-mono">
                          <button
                            onClick={() => setActiveTab("daily-status")}
                            className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 hover:border-amber-500/40 text-amber-400 font-bold text-xs text-left transition-all hover:bg-amber-500/15 cursor-pointer"
                          >
                            <div className="text-lg mb-1">⚡</div>
                            Update daily_status
                          </button>
                          <button
                            onClick={() => setActiveTab("add-update")}
                            className="p-4 rounded-xl bg-accent/10 border border-accent/20 hover:border-accent/40 text-accent font-bold text-xs text-left transition-all hover:bg-accent/15 cursor-pointer"
                          >
                            <div className="text-lg mb-1">＋</div>
                            Publish new_feed
                          </button>
                          <button
                            onClick={() => setActiveTab("add-plan")}
                            className="p-4 rounded-xl bg-violet-500/10 border border-violet-500/20 hover:border-violet-500/40 text-violet-400 font-bold text-xs text-left transition-all hover:bg-violet-500/15 cursor-pointer"
                          >
                            <div className="text-lg mb-1">◎</div>
                            Queue roadmap_plan
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── ADD UPDATE ── */}
              {activeTab === "add-update" && (
                <div className="space-y-6">
                  <div className="font-mono">
                    <h2 className="text-lg font-bold text-white mb-1">Publish Feed Update</h2>
                    <p className="text-[10px] text-brand-400">This updates the chronological updates stream visible on the updates page.</p>
                  </div>

                  <form onSubmit={handleUpdateSubmit} className="space-y-5 glass-strong border border-white/10 rounded-2xl p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <SelectField label="Category" name="category" value={updateForm.category} onChange={(e) => setUpdateForm((p) => ({ ...p, category: e.target.value as any }))} required
                        options={[
                          { value: "announcement", label: "📣 Announcement" },
                          { value: "video", label: "▶️ YouTube Video" },
                          { value: "blog", label: "✍️ Blog Post" },
                          { value: "achievement", label: "🏆 Achievement" },
                        ]}
                      />
                      <InputField label="Date" name="date" value={updateForm.date} onChange={(e) => setUpdateForm((p) => ({ ...p, date: e.target.value }))} type="date" required />
                    </div>

                    <InputField label="Title" name="title" value={updateForm.title} onChange={(e) => setUpdateForm((p) => ({ ...p, title: e.target.value }))} placeholder="e.g. Completed Vlogs Index Setup..." required />

                    <TextAreaField label="Description" name="description" value={updateForm.description} onChange={(e) => setUpdateForm((p) => ({ ...p, description: e.target.value }))} placeholder="Provide descriptive parameters..." required rows={3} />

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                      <InputField label="Badge" name="badge" value={updateForm.badge} onChange={(e) => setUpdateForm((p) => ({ ...p, badge: e.target.value }))} placeholder="e.g. Milestone" hint="Small tag label" />
                      <InputField label="Meta" name="meta" value={updateForm.meta} onChange={(e) => setUpdateForm((p) => ({ ...p, meta: e.target.value }))} placeholder="e.g. 10m watch" hint="Meta tag below description" />
                      <InputField label="Target URL / Link" name="href" value={updateForm.href} onChange={(e) => setUpdateForm((p) => ({ ...p, href: e.target.value }))} placeholder="https:// or relative path" hint="Click redirection link" />
                    </div>

                    <div className="flex items-center gap-3 pt-2 font-mono">
                      <button type="submit" disabled={submitting}
                        className="px-8 py-3.5 rounded-xl bg-accent hover:bg-accent-hover text-black font-bold text-xs uppercase tracking-wider transition-all hover:shadow-[0_0_20px_rgba(245,158,11,0.35)] disabled:opacity-50 cursor-pointer"
                      >
                        {submitting ? "Publishing…" : "Publish Update"}
                      </button>
                      <button type="button" onClick={() => setUpdateForm({ category: "announcement", title: "", description: "", date: new Date().toISOString().split("T")[0], href: "", badge: "", meta: "", isNew: true })}
                        className="px-5 py-3.5 rounded-xl bg-white/5 border border-white/10 text-xs text-brand-300 hover:text-white transition-all cursor-pointer font-bold uppercase tracking-wider"
                      >
                        Clear Form
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* ── MANAGE FEED ── */}
              {activeTab === "manage-updates" && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between font-mono">
                    <div>
                      <h2 className="text-lg font-bold text-white mb-1">Manage Updates Feed</h2>
                      <p className="text-[10px] text-brand-400">{updates.length} total stream entries found.</p>
                    </div>
                    <button onClick={() => setActiveTab("add-update")}
                      className="px-4 py-2 rounded-xl bg-accent/10 border border-accent/20 text-accent text-[10px] font-bold hover:bg-accent/20 transition-all cursor-pointer uppercase tracking-wider"
                    >
                      ＋ Publish Entry
                    </button>
                  </div>

                  {loading ? (
                    <div className="text-center py-12 text-brand-400 text-xs font-mono">Loading data feed…</div>
                  ) : updates.length === 0 ? (
                    <div className="text-center py-12 text-brand-400 text-xs font-mono">No entries in feed database.</div>
                  ) : (
                    <div className="space-y-2 font-mono text-[11px]">
                      {updates.map((u) => {
                        const cfg = updateCategoryConfig[u.category];
                        return (
                          <div key={u.id} className="flex items-start gap-4 p-4 rounded-xl border border-white/5 bg-white/2 hover:bg-white/4 hover:border-white/10 transition-all group">
                            <div className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${cfg.dot}`} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap mb-0.5">
                                <span className={`text-[9px] font-bold uppercase tracking-wider ${cfg.color}`}>{cfg.label}</span>
                                {u.badge && <span className={`text-[8px] px-1.5 py-0.5 rounded border font-medium ${cfg.bg}`}>{u.badge}</span>}
                                {u.isNew && <span className="text-[8px] text-accent font-bold">● NEW</span>}
                              </div>
                              <p className="text-xs font-bold text-white truncate">{u.title}</p>
                              <p className="text-[10px] text-brand-400 line-clamp-1 mt-0.5">{u.description}</p>
                              <p className="text-[9px] text-brand-600 mt-1">{u.date}</p>
                            </div>
                            <button
                              onClick={() => deleteUpdate(u.id, u.title)}
                              className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-bold hover:bg-red-500/20 cursor-pointer uppercase tracking-wider"
                            >
                              Delete
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* ── ADD ROADMAP PLAN ── */}
              {activeTab === "add-plan" && (
                <div className="space-y-6">
                  <div className="font-mono">
                    <h2 className="text-lg font-bold text-white mb-1">Queue Roadmap Plan</h2>
                    <p className="text-[10px] text-brand-400">Append tasks to the subsystems roadmap timeline.</p>
                  </div>

                  <form onSubmit={handlePlanSubmit} className="space-y-5 glass-strong border border-white/10 rounded-2xl p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                      <SelectField label="Category" name="category" value={planForm.category} onChange={(e) => setPlanForm((p) => ({ ...p, category: e.target.value as any }))} required
                        options={[
                          { value: "general", label: "General" },
                          { value: "academic", label: "Academic / GATE" },
                          { value: "business", label: "Business / Startup" },
                          { value: "community", label: "Community" },
                        ]}
                      />
                      <InputField label="Target Date" name="targetDate" value={planForm.targetDate} onChange={(e) => setPlanForm((p) => ({ ...p, targetDate: e.target.value }))} placeholder="e.g. Q3 2026 or Dec 2026" required hint="Flexible timeline label" />
                      <SelectField label="Status" name="status" value={planForm.status} onChange={(e) => setPlanForm((p) => ({ ...p, status: e.target.value as any }))} required
                        options={[
                          { value: "planned", label: "○ Planned" },
                          { value: "in-progress", label: "◑ In Progress" },
                          { value: "completed", label: "● Completed" },
                        ]}
                      />
                    </div>

                    <InputField label="Goal Title" name="title" value={planForm.title} onChange={(e) => setPlanForm((p) => ({ ...p, title: e.target.value }))} placeholder="e.g. Launch 2 AM Study Portal..." required />
                    <TextAreaField label="Description" name="description" value={planForm.description} onChange={(e) => setPlanForm((p) => ({ ...p, description: e.target.value }))} placeholder="Provide descriptive goal milestones..." required rows={3} />

                    <div className="flex items-center gap-3 pt-2 font-mono">
                      <button type="submit" disabled={submitting}
                        className="px-8 py-3.5 rounded-xl bg-violet-500/20 border border-violet-500/30 hover:border-violet-500/50 text-violet-300 font-bold text-xs uppercase tracking-wider transition-all hover:bg-violet-500/30 disabled:opacity-50 cursor-pointer"
                      >
                        {submitting ? "Queuing…" : "Queue Plan"}
                      </button>
                      <button type="button" onClick={() => setPlanForm({ title: "", description: "", targetDate: "", category: "general", status: "planned" })}
                        className="px-5 py-3.5 rounded-xl bg-white/5 border border-white/10 text-xs text-brand-300 hover:text-white transition-all cursor-pointer font-bold uppercase tracking-wider"
                      >
                        Clear Form
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* ── MANAGE PLANS ── */}
              {activeTab === "manage-plans" && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between font-mono">
                    <div>
                      <h2 className="text-lg font-bold text-white mb-1">Roadmap Subsystems Manager</h2>
                      <p className="text-[10px] text-brand-400">{plans.length} total items in roadmap timeline.</p>
                    </div>
                    <button onClick={() => setActiveTab("add-plan")}
                      className="px-4 py-2 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400 text-[10px] font-bold hover:bg-violet-500/20 transition-all cursor-pointer uppercase tracking-wider"
                    >
                      ＋ Queue Goal
                    </button>
                  </div>

                  {loading ? (
                    <div className="text-center py-12 text-brand-400 text-xs font-mono">Loading roadmap database…</div>
                  ) : plans.length === 0 ? (
                    <div className="text-center py-12 text-brand-400 text-xs font-mono">No goals found in roadmap database.</div>
                  ) : (
                    <div className="space-y-2 font-mono text-[11px]">
                      {plans.map((plan) => {
                        const catCfg = planCategoryConfig[plan.category];
                        const stCfg = statusConfig[plan.status];
                        return (
                          <div key={plan.id} className="flex items-start gap-4 p-4 rounded-xl border border-white/5 bg-white/2 hover:bg-white/4 hover:border-white/10 transition-all group">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap mb-0.5">
                                <span className={`text-[9px] font-bold uppercase tracking-wider ${catCfg.color}`}>{catCfg.label}</span>
                                <span className="text-[9px] text-brand-600 font-mono">{plan.targetDate}</span>
                              </div>
                              <p className="text-xs font-bold text-white">{plan.title}</p>
                              <p className="text-[10px] text-brand-400 line-clamp-1 mt-0.5">{plan.description}</p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                onClick={() => togglePlanStatus(plan)}
                                title="Click to cycle status"
                                className={`px-2.5 py-1 rounded-lg border text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer hover:scale-105 ${stCfg.bg} ${stCfg.color}`}
                              >
                                {stCfg.icon} {stCfg.label}
                              </button>
                              <button
                                onClick={() => deletePlan(plan.id, plan.title)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-bold hover:bg-red-500/20 cursor-pointer uppercase tracking-wider"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* ── MESSAGES ── */}
              {activeTab === "messages" && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between font-mono">
                    <div>
                      <h2 className="text-lg font-bold text-white mb-1">Inquiries Messages Console</h2>
                      <p className="text-[10px] text-brand-400">{messages.length} total messages · {unreadCount} unread entries.</p>
                    </div>
                    <button onClick={async () => { await fetchPublicLogs(); await fetchAdminData(); }}
                      className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-brand-300 text-[10px] font-bold hover:text-white hover:border-white/20 transition-all cursor-pointer uppercase tracking-wider"
                    >
                      ↺ Sync Messages
                    </button>
                  </div>

                  {loading ? (
                    <div className="text-center py-12 text-brand-400 text-xs font-mono">Syncing messages database…</div>
                  ) : messages.length === 0 ? (
                    <div className="text-center py-16 font-mono">
                      <p className="text-3xl mb-3">✉️</p>
                      <p className="text-brand-500 text-xs uppercase tracking-wider">Inquiries inbox is empty.</p>
                    </div>
                  ) : (
                    <div className="space-y-3 font-mono text-[11px]">
                      {messages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`p-5 rounded-xl border transition-all group ${
                            msg.read
                              ? "border-white/5 bg-white/2 hover:bg-white/4"
                              : "border-accent/20 bg-accent/3 hover:border-accent/30"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                {!msg.read && (
                                  <span className="text-[8px] font-black text-accent uppercase tracking-wider px-1.5 py-0.5 rounded border border-accent/30 bg-accent/10">NEW</span>
                                )}
                                <span className="text-xs font-bold text-white">{msg.name}</span>
                                <span className="text-brand-500">·</span>
                                <span className="text-[10px] text-accent font-mono">{msg.email}</span>
                              </div>
                              <p className="text-[10px] text-brand-400 font-bold mb-2">Subject: {msg.subject}</p>
                              <p
                                className={`text-xs text-brand-300 leading-relaxed ${
                                  expandedMsg === msg.id ? "" : "line-clamp-2"
                                }`}
                              >
                                {msg.message}
                              </p>
                              <div className="flex items-center gap-3 mt-3">
                                <button
                                  onClick={() => {
                                    setExpandedMsg(expandedMsg === msg.id ? null : msg.id);
                                    if (!msg.read) markAsRead(msg.id);
                                  }}
                                  className="text-[10px] text-brand-400 hover:text-white transition-colors cursor-pointer"
                                >
                                  {expandedMsg === msg.id ? "Show less ↑" : "Read message ↓"}
                                </button>
                                <span className="text-[9px] text-brand-600">
                                  {new Date(msg.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                                </span>
                              </div>
                            </div>
                            <div className="flex flex-col gap-2 shrink-0">
                              <a
                                href={`mailto:${msg.email}?subject=Re: ${encodeURIComponent(msg.subject)}`}
                                className="px-3 py-1.5 rounded-lg bg-accent/10 border border-accent/20 text-accent text-[10px] font-bold hover:bg-accent/20 transition-all whitespace-nowrap text-center"
                              >
                                Reply ↗
                              </a>
                              <button
                                onClick={() => deleteMessage(msg.id, msg.name)}
                                className="px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-bold hover:bg-red-500/20 transition-all opacity-0 group-hover:opacity-100 cursor-pointer uppercase tracking-wider"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ── DAILY STATUS COMMITS ── */}
              {activeTab === "daily-status" && (
                <div className="space-y-6">
                  <div className="font-mono">
                    <h2 className="text-lg font-bold text-white mb-1">Commit Daily Workspace Logs</h2>
                    <p className="text-[10px] text-brand-400">Post what you worked on today. It will update the status timeline instantly.</p>
                  </div>

                  <form onSubmit={handleStatusSubmit} className="space-y-5 glass-strong border border-white/10 rounded-2xl p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <InputField
                        label="Log Date"
                        name="date"
                        value={statusForm.date}
                        onChange={(e) => setStatusForm((p) => ({ ...p, date: e.target.value }))}
                        type="date"
                        required
                      />
                      <InputField
                        label="Workspace Focus Vibe"
                        name="statusText"
                        value={statusForm.statusText}
                        onChange={(e) => setStatusForm((p) => ({ ...p, statusText: e.target.value }))}
                        placeholder="e.g. Coding workspace dashboard... 🚀"
                        required
                      />
                    </div>

                    <TextAreaField
                      label="Event Commits (One entry per line)"
                      name="tasksText"
                      value={statusForm.tasksText}
                      onChange={(e) => setStatusForm((p) => ({ ...p, tasksText: e.target.value }))}
                      placeholder="e.g. Refactored homepage CSS layout&#10;Integrated public system status dashboard&#10;Gated editing CRUD options under password"
                      required
                      rows={6}
                    />

                    <div className="flex items-center gap-3 pt-2 font-mono">
                      <button
                        type="submit"
                        disabled={submitting}
                        className="px-8 py-3.5 rounded-xl bg-accent hover:bg-accent-hover text-black font-bold text-xs uppercase tracking-wider transition-all hover:shadow-[0_0_20px_rgba(245,158,11,0.35)] disabled:opacity-50 cursor-pointer"
                      >
                        {submitting ? "Commiting logs…" : "Commit Daily Status"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setStatusForm({
                          date: new Date().toISOString().split("T")[0],
                          statusText: "",
                          tasksText: "",
                        })}
                        className="px-5 py-3.5 rounded-xl bg-white/5 border border-white/10 text-xs text-brand-300 hover:text-white transition-all cursor-pointer font-bold uppercase tracking-wider"
                      >
                        Reset Form
                      </button>
                    </div>
                  </form>

                  {/* Status History */}
                  <div className="space-y-4 pt-4">
                    <h3 className="text-xs uppercase font-bold text-brand-200 tracking-wider font-mono">Log History Database ({statuses.length})</h3>

                    {loading ? (
                      <div className="text-center py-6 text-brand-400 text-xs font-mono">Loading operations history database…</div>
                    ) : statuses.length === 0 ? (
                      <div className="text-center py-8 text-brand-400 text-xs bg-white/2 rounded-xl border border-white/5 font-mono">No workspace logs database entries found.</div>
                    ) : (
                      <div className="space-y-3 font-mono text-[11px]">
                        {statuses.map((item) => (
                          <div key={item.id} className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 p-5 rounded-xl border border-white/5 bg-white/2 hover:bg-white/4 transition-all group">
                            <div className="space-y-2 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-accent font-semibold">{item.date}</span>
                                <span className="text-brand-500">•</span>
                                <span className="text-xs font-bold text-white">{item.statusText}</span>
                              </div>
                              <ul className="list-disc pl-4 text-[10px] text-brand-400 space-y-1">
                                {item.tasks.map((task, idx) => (
                                  <li key={idx} className="leading-relaxed">{task}</li>
                                ))}
                              </ul>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                onClick={() => setStatusForm({
                                  date: item.date,
                                  statusText: item.statusText,
                                  tasksText: item.tasks.join("\n"),
                                })}
                                className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-brand-300 text-[10px] font-bold hover:text-white hover:border-white/20 transition-all cursor-pointer uppercase tracking-wider"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => deleteStatus(item.id, item.date)}
                                className="px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-bold hover:bg-red-500/20 transition-all opacity-0 group-hover:opacity-100 cursor-pointer uppercase tracking-wider"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

            </div>
          </div>
        )}

      </div>

      {/* LOGIN MODAL OVERLAY */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className={`relative z-10 w-full max-w-sm mx-4 ${loginShaking ? "animate-[shake_0.4s_ease]" : ""}`}>
            <div className="glass-strong border border-white/10 rounded-2xl p-8 shadow-2xl relative">
              <button 
                onClick={() => { setShowLoginModal(false); setLoginError(""); }} 
                className="absolute top-4 right-4 text-brand-500 hover:text-white transition-colors cursor-pointer text-xs font-bold font-mono"
              >
                ✕
              </button>
              
              <div className="w-14 h-14 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center mx-auto mb-5">
                <svg className="w-6 h-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
              </div>

              <h3 className="text-base font-extrabold text-white text-center mb-1 font-mono uppercase tracking-wider">Unlock CMS Console</h3>
              <p className="text-[9px] text-brand-400 text-center mb-6 font-mono">Enter system password to enable operational handlers.</p>

              <form onSubmit={(e) => { e.preventDefault(); handleLogin(adminPasswordInput); }} className="space-y-4 font-mono text-xs">
                <input
                  type="password"
                  value={adminPasswordInput}
                  onChange={(e) => { setAdminPasswordInput(e.target.value); setLoginError(""); }}
                  placeholder="Enter passcode..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white placeholder-brand-600 focus:outline-none focus:border-accent/50 transition-all text-center tracking-widest"
                  autoFocus
                />
                
                {loginError && (
                  <div className="text-[10px] text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-lg font-mono text-center">
                    ⚠ {loginError}
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-accent hover:bg-accent-hover text-black font-bold text-[10px] uppercase tracking-wider transition-all hover:shadow-[0_0_20px_rgba(245,158,11,0.35)] cursor-pointer"
                >
                  Verify Access Key
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `@keyframes shake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-8px)} 40%{transform:translateX(8px)} 60%{transform:translateX(-6px)} 80%{transform:translateX(6px)} }` }} />
    </div>
  );
}
