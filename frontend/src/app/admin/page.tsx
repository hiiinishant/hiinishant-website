"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { isConfigured as isFirebaseConfigured } from "@/lib/firebase";
import type { GalleryPhoto } from "@/types";

// ─── Types ───────────────────────────────────────────────────────────────────
interface UpdateItem {
  id: string;
  category: "video" | "blog" | "instagram";
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
// Admin password is now verified securely on the backend

// ─── Category / Status Configs ───────────────────────────────────────────────
const updateCategoryConfig: Record<UpdateItem["category"], { label: string; color: string; bg: string; dot: string }> = {
  video:        { label: "YouTube Video",  color: "text-red-400",     bg: "bg-red-500/10 border-red-500/20",     dot: "bg-red-400" },
  blog:         { label: "Blog Post",      color: "text-blue-400",    bg: "bg-blue-500/10 border-blue-500/20",   dot: "bg-blue-400" },
  instagram:    { label: "Instagram Post", color: "text-[#E1306C]",   bg: "bg-[#E1306C]/10 border-[#E1306C]/20", dot: "bg-[#E1306C]" },
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
type Tab = "overview" | "daily-status" | "add-update" | "manage-updates" | "add-plan" | "manage-plans" | "messages" | "write-blog" | "manage-blogs" | "gallery-management" | "music-settings";

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
  const [blogs, setBlogs] = useState<any[]>([]);
  const [galleryPhotos, setGalleryPhotos] = useState<GalleryPhoto[]>([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [confirm, setConfirm] = useState<{ message: string; onConfirm: () => void } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [expandedMsg, setExpandedMsg] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [latency, setLatency] = useState<number | null>(null);

  const showToast = (message: string, type: "success" | "error") => setToast({ message, type });

  // Gallery Form
  const [galleryForm, setGalleryForm] = useState({
    title: "",
    story: "",
    category: "Daily Moments",
    date: new Date().toISOString().split("T")[0]
  });
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);

  // Music Corner settings
  const [musicPlaylistUrl, setMusicPlaylistUrl] = useState("https://www.youtube.com/watch?v=uNboFgKLGDY&list=PLQfqZFVQZ3To");
  const [musicSettings, setMusicSettings] = useState<{
    playlistUrl: string;
    playlistId: string;
    playlistTitle: string;
    playlistThumbnail: string;
  } | null>(null);

  // Update Form
  const [updateForm, setUpdateForm] = useState({
    category: "blog", title: "", description: "",
    date: new Date().toISOString().split("T")[0],
    href: "", badge: "", meta: "", isNew: true,
  });
  const [editingUpdateId, setEditingUpdateId] = useState<string | null>(null);

  // Plan Form
  const [planForm, setPlanForm] = useState({
    title: "", description: "", targetDate: "", category: "general", status: "planned",
  });

  // Blog Form
  const [blogForm, setBlogForm] = useState({
    slug: "", title: "", excerpt: "", date: new Date().toISOString().split("T")[0], readTime: "5 min read", tags: "", featured: false, content: ""
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
        fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || ""}/api/future-plans`),
        fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || ""}/api/status`),
      ]);
      const plansData = await planRes.json();
      const statusesData = await statusRes.json();
      setPlans(Array.isArray(plansData) ? plansData : []);
      setStatuses(Array.isArray(statusesData) ? statusesData : []);
      const end = performance.now();
      setLatency(Math.round(end - start));
    } catch (e) {
      showToast("Failed to fetch operational status logs.", "error");
      setPlans([]);
      setStatuses([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const getAuthHeaders = () => {
    const token = sessionStorage.getItem("admin_token");
    return {
      "Content-Type": "application/json",
      ...(token ? { "Authorization": `Bearer ${token}` } : {})
    };
  };

  const getAuthOnlyHeaders = (): Record<string, string> => {
    const token = sessionStorage.getItem("admin_token");
    return token ? { "Authorization": `Bearer ${token}` } : {};
  };

  // Fetch Admin Protected Databases
  const fetchAdminData = useCallback(async () => {
    setLoading(true);
    try {
      const [updRes, msgRes, blogRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || ""}/api/updates`, { headers: getAuthHeaders() }),
        fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || ""}/api/contact`, { headers: getAuthHeaders() }),
        fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || ""}/api/blog`, { headers: getAuthHeaders() }),
      ]);
      const updatesData = await updRes.json();
      const messagesData = await msgRes.json();
      const blogsData = await blogRes.json();
      setUpdates(Array.isArray(updatesData) ? updatesData : []);
      setMessages(Array.isArray(messagesData) ? messagesData : []);
      setBlogs(Array.isArray(blogsData) ? blogsData : []);
    } catch (e) {
      showToast("Failed to load admin databases.", "error");
      setUpdates([]);
      setMessages([]);
      setBlogs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchGalleryData = useCallback(async () => {
    setLoading(true);
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "";
      const res = await fetch(`${backendUrl}/api/gallery`);
      if (!res.ok) {
        throw new Error("Failed to fetch gallery photos");
      }
      const list = await res.json();
      setGalleryPhotos(list);
    } catch (e) {
      showToast("Failed to load gallery photos.", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMusicSettings = useCallback(async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || ""}/api/music`);
      if (!res.ok) throw new Error("Failed to load music settings");
      const data = await res.json();
      setMusicSettings(data);
      setMusicPlaylistUrl(data.playlistUrl || "");
    } catch {
      showToast("Failed to load music settings.", "error");
    }
  }, []);

  // On Mount: Load public statuses and session
  useEffect(() => {
    fetchPublicLogs();

    const token = sessionStorage.getItem("admin_token");
    if (token) {
      fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || ""}/api/auth/verify`, {
        headers: { "Authorization": `Bearer ${token}` }
      })
      .then((res) => {
        if (res.ok) {
          setUnlocked(true);
        } else {
          sessionStorage.removeItem("admin_token");
        }
      })
      .catch(() => {
        sessionStorage.removeItem("admin_token");
      });
    }
  }, [fetchPublicLogs]);

  // When Unlocked: Load CMS
  useEffect(() => {
    if (unlocked) {
      fetchAdminData();
      fetchGalleryData();
      fetchMusicSettings();
    }
  }, [unlocked, fetchAdminData, fetchGalleryData, fetchMusicSettings]);

  // Handle Admin Auth
  const handleLogin = async (pw: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || ""}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pw }),
      });
      const data = await res.json();
      if (res.ok && data.token) {
        sessionStorage.setItem("admin_token", data.token);
        setUnlocked(true);
        setShowLoginModal(false);
        setLoginError("");
        setAdminPasswordInput("");
        showToast("Console unlocked. Mode: Admin Write Enabled.", "success");
      } else {
        throw new Error(data.error || "Incorrect access credentials.");
      }
    } catch (err: any) {
      setLoginError(err.message || "Incorrect access credentials.");
      setLoginShaking(true);
      setTimeout(() => setLoginShaking(false), 600);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("admin_token");
    setUnlocked(false);
    setActiveTab("overview");
    showToast("Console locked. Mode: Public Read Only.", "success");
  };

  // ── Submit Update ──
  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingUpdateId) {
        // Update existing
        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || ""}/api/updates`, {
          method: "PUT",
          headers: getAuthHeaders(),
          body: JSON.stringify({ ...updateForm, id: editingUpdateId }),
        });
        if (!res.ok) throw new Error("Failed to update feed entry.");
        const updatedItem = await res.json();
        setUpdates((prev) => prev.map((u) => u.id === editingUpdateId ? updatedItem : u));
        showToast("Update edited successfully!", "success");
        setEditingUpdateId(null);
      } else {
        // Create new
        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || ""}/api/updates`, {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify(updateForm),
        });
        if (!res.ok) throw new Error("Failed to publish feed update.");
        const newItem = await res.json();
        setUpdates((prev) => [newItem, ...prev]);
        showToast("Update published successfully!", "success");
      }
      setUpdateForm({ category: "blog", title: "", description: "", date: new Date().toISOString().split("T")[0], href: "", badge: "", meta: "", isNew: true });
      setActiveTab("manage-updates");
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Edit Update ──
  const editUpdate = (update: UpdateItem) => {
    setUpdateForm({
      category: update.category,
      title: update.title,
      description: update.description,
      date: update.date,
      href: update.href || "",
      badge: update.badge || "",
      meta: update.meta || "",
      isNew: update.isNew ?? false,
    });
    setEditingUpdateId(update.id);
    setActiveTab("add-update");
  };

  // ── Submit Plan ──
  const handlePlanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || ""}/api/future-plans`, {
        method: "POST",
        headers: getAuthHeaders(),
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

  // ── Submit Blog ──
  const handleBlogSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const tagsArray = blogForm.tags.split(",").map(t => t.trim()).filter(t => t);
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || ""}/api/blog`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ ...blogForm, tags: tagsArray }),
      });
      if (!res.ok) throw new Error("Failed to publish blog.");
      showToast("Blog published successfully!", "success");
      fetchAdminData();
      setActiveTab("manage-blogs");
      setBlogForm({ slug: "", title: "", excerpt: "", date: new Date().toISOString().split("T")[0], readTime: "5 min read", tags: "", featured: false, content: "" });
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
          const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || ""}/api/updates`, {
            method: "DELETE",
            headers: getAuthHeaders(),
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
          const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || ""}/api/future-plans`, {
            method: "DELETE",
            headers: getAuthHeaders(),
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

  // ── Delete Blog ──
  const deleteBlog = (slug: string, title: string) => {
    setConfirm({
      message: `Delete blog post "${title}"?`,
      onConfirm: async () => {
        setConfirm(null);
        try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || ""}/api/blog`, {
            method: "DELETE",
            headers: getAuthHeaders(),
            body: JSON.stringify({ slug }),
          });
          if (!res.ok) throw new Error("Failed to delete blog.");
          setBlogs((prev) => prev.filter((b) => b.slug !== slug));
          showToast("Blog deleted successfully.", "success");
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
          const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || ""}/api/contact`, {
            method: "DELETE",
            headers: getAuthHeaders(),
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
      await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || ""}/api/contact`, {
        method: "PATCH",
        headers: getAuthHeaders(),
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
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || ""}/api/future-plans`, {
        method: "PATCH",
        headers: getAuthHeaders(),
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

      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || ""}/api/status`, {
        method: "POST",
        headers: getAuthHeaders(),
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
          const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || ""}/api/status`, {
            method: "DELETE",
            headers: getAuthHeaders(),
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

  // ── Submit Gallery Photo ──
  const handleGallerySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedImageFile) {
      showToast("Please select an image file to upload.", "error");
      return;
    }
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("image", selectedImageFile);
      formData.append("title", galleryForm.title.trim());
      formData.append("story", galleryForm.story.trim());
      formData.append("category", galleryForm.category);
      formData.append("date", galleryForm.date);

      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "";
      const res = await fetch(`${backendUrl}/api/gallery`, {
        method: "POST",
        headers: getAuthOnlyHeaders(),
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to upload photo");
      }

      const newPhoto = await res.json();

      setGalleryPhotos(prev => [newPhoto, ...prev]);
      setGalleryForm({
        title: "",
        story: "",
        category: "Daily Moments",
        date: new Date().toISOString().split("T")[0]
      });
      setSelectedImageFile(null);
      
      const fileInput = document.getElementById("gallery-file-input") as HTMLInputElement;
      if (fileInput) fileInput.value = "";

      showToast("Memory uploaded successfully!", "success");
    } catch (err: any) {
      showToast(err.message || "Failed to upload memory.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Delete Gallery Photo ──
  const deleteGalleryPhoto = (id: string, imagePath: string, title: string) => {
    setConfirm({
      message: `Delete photo memory "${title}"? This action will remove it permanently.`,
      onConfirm: async () => {
        setConfirm(null);
        try {
          const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "";
          const res = await fetch(`${backendUrl}/api/gallery`, {
            method: "DELETE",
            headers: getAuthHeaders(),
            body: JSON.stringify({ id }),
          });

          if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.error || "Failed to delete photo");
          }

          setGalleryPhotos(prev => prev.filter(p => p.id !== id));
          showToast("Memory deleted.", "success");
        } catch (err: any) {
          showToast(err.message || "Failed to delete memory.", "error");
        }
      }
    });
  };

  const handleMusicSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!musicPlaylistUrl.trim()) {
      showToast("Please paste a YouTube playlist URL.", "error");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || ""}/api/music`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ playlistUrl: musicPlaylistUrl.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save playlist.");
      setMusicSettings(data);
      showToast("Music Corner playlist updated! The player will reflect this on the next visit.", "success");
    } catch (err: any) {
      showToast(err.message || "Failed to save playlist.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleMusicDelete = () => {
    setConfirm({
      message: "Delete the current music playlist settings? This will remove the playlist from the Music Corner.",
      onConfirm: async () => {
        setConfirm(null);
        try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || ""}/api/music`, {
            method: "DELETE",
            headers: getAuthHeaders(),
          });
          if (!res.ok) throw new Error("Failed to delete playlist.");
          setMusicSettings(null);
          setMusicPlaylistUrl("");
          showToast("Music playlist settings deleted.", "success");
        } catch (err: any) {
          showToast(err.message || "Failed to delete playlist.", "error");
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
    const matchesText = (s.statusText || '').toLowerCase().includes(query);
    const matchesTasks = (s.tasks || []).some((t) => (t || '').toLowerCase().includes(query));
    const matchesDate = (s.date || '').toLowerCase().includes(query);
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
    instagrams: updates.filter((u) => u.category === "instagram").length,
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
    { id: "write-blog",     label: "write_blog",      icon: "✎" },
    { id: "manage-blogs",   label: "manage_blogs",    icon: "☰" },
    { id: "add-plan",       label: "queue_plan",      icon: "◎" },
    { id: "manage-plans",   label: "subsystems",      icon: "⌁" },
    { id: "messages",       label: "inboxes",         icon: "✉", badge: unreadCount },
    { id: "gallery-management", label: "gallery_admin",   icon: "📸" },
    { id: "music-settings",     label: "music_corner",    icon: "🎵" },
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
                onClick={async () => { await fetchPublicLogs(); await fetchAdminData(); await fetchGalleryData(); }}
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
                        <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
                          <StatCard value={stats.totalUpdates}  label="Total"         color="text-white"         icon="📊" />
                          <StatCard value={stats.videos}        label="Videos"        color="text-red-400"       icon="▶️" />
                          <StatCard value={stats.blogs}         label="Blogs"         color="text-blue-400"      icon="✍️" />
                          <StatCard value={stats.instagrams}    label="Instagram"     color="text-[#E1306C]"     icon="📸" />
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
                    <h2 className="text-lg font-bold text-white mb-1">{editingUpdateId ? "Edit Feed Update" : "Publish Feed Update"}</h2>
                    <p className="text-[10px] text-brand-400">{editingUpdateId ? "Update the existing feed entry." : "This updates the chronological updates stream visible on the updates page."}</p>
                  </div>

                  <form onSubmit={handleUpdateSubmit} className="space-y-5 glass-strong border border-white/10 rounded-2xl p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <SelectField label="Category" name="category" value={updateForm.category} onChange={(e) => setUpdateForm((p) => ({ ...p, category: e.target.value as any }))} required
                        options={[
                          { value: "blog", label: "✍️ Blog Post" },
                          { value: "instagram", label: "📸 Instagram Post" },
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
                        {submitting ? (editingUpdateId ? "Updating…" : "Publishing…") : (editingUpdateId ? "Update Entry" : "Publish Update")}
                      </button>
                      {editingUpdateId && (
                        <button type="button" onClick={() => { setEditingUpdateId(null); setUpdateForm({ category: "blog", title: "", description: "", date: new Date().toISOString().split("T")[0], href: "", badge: "", meta: "", isNew: true }); }}
                          className="px-5 py-3.5 rounded-xl bg-white/5 border border-white/10 text-xs text-brand-300 hover:text-white transition-all cursor-pointer font-bold uppercase tracking-wider"
                        >
                          Cancel Edit
                        </button>
                      )}
                      <button type="button" onClick={() => { setUpdateForm({ category: "blog", title: "", description: "", date: new Date().toISOString().split("T")[0], href: "", badge: "", meta: "", isNew: true }); setEditingUpdateId(null); }}
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
                      {updates.filter((u) => u.category !== "video").map((u) => {
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
                            <div className="flex items-center gap-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => editUpdate(u)}
                                className="px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-bold hover:bg-blue-500/20 cursor-pointer uppercase tracking-wider"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => deleteUpdate(u.id, u.title)}
                                className="px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-bold hover:bg-red-500/20 cursor-pointer uppercase tracking-wider"
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
              {/* ── WRITE BLOG ── */}
              {activeTab === "write-blog" && (
                <div className="space-y-6">
                  <div className="font-mono">
                    <h2 className="text-lg font-bold text-white mb-1">Write Blog Post</h2>
                    <p className="text-[10px] text-brand-400">Publish a new markdown blog post.</p>
                  </div>

                  <form onSubmit={handleBlogSubmit} className="space-y-5 glass-strong border border-white/10 rounded-2xl p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <InputField label="Title" name="title" value={blogForm.title} onChange={(e) => setBlogForm((p) => ({ ...p, title: e.target.value, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") }))} placeholder="e.g. My Journey" required />
                      <InputField label="Slug" name="slug" value={blogForm.slug} onChange={(e) => setBlogForm((p) => ({ ...p, slug: e.target.value }))} placeholder="e.g. my-journey" required />
                    </div>

                    <TextAreaField label="Excerpt" name="excerpt" value={blogForm.excerpt} onChange={(e) => setBlogForm((p) => ({ ...p, excerpt: e.target.value }))} placeholder="Brief summary of the post..." required rows={2} />

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-5">
                      <InputField label="Date" name="date" value={blogForm.date} onChange={(e) => setBlogForm((p) => ({ ...p, date: e.target.value }))} type="date" required />
                      <InputField label="Read Time" name="readTime" value={blogForm.readTime} onChange={(e) => setBlogForm((p) => ({ ...p, readTime: e.target.value }))} placeholder="e.g. 5 min read" required />
                      <div className="sm:col-span-2">
                        <InputField label="Tags" name="tags" value={blogForm.tags} onChange={(e) => setBlogForm((p) => ({ ...p, tags: e.target.value }))} placeholder="e.g. Study, Life, Code" hint="Comma separated" />
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <input type="checkbox" id="featured" checked={blogForm.featured} onChange={(e) => setBlogForm((p) => ({ ...p, featured: e.target.checked }))} className="rounded bg-zinc-900 border-white/10" />
                      <label htmlFor="featured" className="text-xs font-bold text-white">Featured Post</label>
                    </div>

                    <TextAreaField label="Markdown Content" name="content" value={blogForm.content} onChange={(e) => setBlogForm((p) => ({ ...p, content: e.target.value }))} placeholder="# Header&#10;Write your markdown here..." required rows={12} />

                    <div className="flex items-center gap-3 pt-2 font-mono">
                      <button type="submit" disabled={submitting}
                        className="px-8 py-3.5 rounded-xl bg-accent hover:bg-accent-hover text-black font-bold text-xs uppercase tracking-wider transition-all hover:shadow-[0_0_20px_rgba(245,158,11,0.35)] disabled:opacity-50 cursor-pointer"
                      >
                        {submitting ? "Publishing…" : "Publish Blog"}
                      </button>
                      <button type="button" onClick={() => setBlogForm({ slug: "", title: "", excerpt: "", date: new Date().toISOString().split("T")[0], readTime: "5 min read", tags: "", featured: false, content: "" })}
                        className="px-5 py-3.5 rounded-xl bg-white/5 border border-white/10 text-xs text-brand-300 hover:text-white transition-all cursor-pointer font-bold uppercase tracking-wider"
                      >
                        Clear Form
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* ── MANAGE BLOGS ── */}
              {activeTab === "manage-blogs" && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between font-mono">
                    <div>
                      <h2 className="text-lg font-bold text-white mb-1">Manage Blog Posts</h2>
                      <p className="text-[10px] text-brand-400">{blogs.length} total blogs published.</p>
                    </div>
                    <button onClick={() => setActiveTab("write-blog")}
                      className="px-4 py-2 rounded-xl bg-accent/10 border border-accent/20 text-accent text-[10px] font-bold hover:bg-accent/20 transition-all cursor-pointer uppercase tracking-wider"
                    >
                      ＋ Write Blog
                    </button>
                  </div>

                  {loading ? (
                    <div className="text-center py-12 text-brand-400 text-xs font-mono">Loading blogs database…</div>
                  ) : blogs.length === 0 ? (
                    <div className="text-center py-12 text-brand-400 text-xs font-mono">No blogs found.</div>
                  ) : (
                    <div className="space-y-2 font-mono text-[11px]">
                      {blogs.map((blog) => (
                        <div key={blog.slug} className="flex items-start gap-4 p-4 rounded-xl border border-white/5 bg-white/2 hover:bg-white/4 hover:border-white/10 transition-all group">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-0.5">
                              {blog.featured && <span className="text-[9px] font-bold uppercase tracking-wider text-accent bg-accent/10 px-1.5 py-0.5 rounded">Featured</span>}
                              <span className="text-[9px] text-brand-600 font-mono">{blog.date}</span>
                            </div>
                            <Link href={`/blog/${blog.slug}`} target="_blank" className="text-xs font-bold text-white hover:underline">{blog.title}</Link>
                            <p className="text-[10px] text-brand-400 line-clamp-1 mt-0.5">{blog.excerpt}</p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={() => {
                                setBlogForm({
                                  slug: blog.slug,
                                  title: blog.title,
                                  excerpt: blog.excerpt,
                                  date: blog.date,
                                  readTime: blog.readTime,
                                  tags: blog.tags.join(", "),
                                  featured: blog.featured,
                                  content: blog.content ? blog.content.join("\n\n") : "",
                                });
                                setActiveTab("write-blog");
                              }}
                              className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-brand-300 text-[10px] font-bold hover:text-white hover:border-white/20 transition-all cursor-pointer uppercase tracking-wider"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => deleteBlog(blog.slug, blog.title)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-bold hover:bg-red-500/20 cursor-pointer uppercase tracking-wider"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ── GALLERY MANAGEMENT ── */}
              {activeTab === "gallery-management" && (
                <div className="space-y-6">
                  <div className="font-mono">
                    <h2 className="text-lg font-bold text-white mb-1">Gallery Management</h2>
                    <p className="text-[10px] text-brand-400">Upload new memory photographs and manage the current visual archive logs.</p>
                  </div>

                  {!isFirebaseConfigured && (
                    <div className="bg-amber-950/20 border border-amber-500/20 rounded-xl p-4 font-mono text-[10px] text-amber-400">
                      ⚠️ <strong>Console Note:</strong> Firebase variables are not configured in `.env.local`. Image file selection will use a mock online placeholder image, and memory updates will modify temporary local state instead of Firestore permanent databases.
                    </div>
                  )}

                  {/* Upload Form */}
                  <form onSubmit={handleGallerySubmit} className="space-y-5 glass-strong border border-white/10 rounded-2xl p-6 font-mono text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div className="flex flex-col gap-1.5 font-mono">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-brand-400">
                          Photo Image File <span className="text-accent">*</span>
                        </label>
                        <input
                          id="gallery-file-input"
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              setSelectedImageFile(e.target.files[0]);
                            }
                          }}
                          required={isFirebaseConfigured}
                          className="bg-zinc-950/40 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-[10px] file:font-semibold file:bg-accent/10 file:text-accent file:cursor-pointer hover:file:bg-accent/20 cursor-pointer"
                        />
                      </div>

                      <InputField
                        label="Log Date"
                        name="date"
                        value={galleryForm.date}
                        onChange={(e) => setGalleryForm((p) => ({ ...p, date: e.target.value }))}
                        type="date"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <InputField
                        label="Title"
                        name="title"
                        value={galleryForm.title}
                        onChange={(e) => setGalleryForm((p) => ({ ...p, title: e.target.value }))}
                        placeholder="e.g. Building 2 AM Study Pitch Deck"
                        required
                      />

                      <SelectField
                        label="Category"
                        name="category"
                        value={galleryForm.category}
                        onChange={(e) => setGalleryForm((p) => ({ ...p, category: e.target.value }))}
                        required
                        options={[
                          { value: "Daily Moments", label: "Daily Moments" },
                          { value: "School", label: "School" },
                          { value: "College", label: "College" },
                          { value: "Achievements", label: "Achievements" }
                        ]}
                      />
                    </div>

                    <TextAreaField
                      label="Short Story (2–5 lines)"
                      name="story"
                      value={galleryForm.story}
                      onChange={(e) => setGalleryForm((p) => ({ ...p, story: e.target.value }))}
                      placeholder="Share the context, what was happening, and the significance of this moment..."
                      required
                      rows={3}
                    />

                    <div className="flex items-center gap-3 pt-2">
                      <button
                        type="submit"
                        disabled={submitting}
                        className="px-8 py-3.5 rounded-xl bg-accent hover:bg-accent-hover text-black font-bold text-xs uppercase tracking-wider transition-all hover:shadow-[0_0_20px_rgba(245,158,11,0.35)] disabled:opacity-50 cursor-pointer"
                      >
                        {submitting ? "Uploading memory…" : "Upload Memory"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setGalleryForm({
                            title: "",
                            story: "",
                            category: "Daily Moments",
                            date: new Date().toISOString().split("T")[0]
                          });
                          setSelectedImageFile(null);
                          const fileInput = document.getElementById("gallery-file-input") as HTMLInputElement;
                          if (fileInput) fileInput.value = "";
                        }}
                        className="px-5 py-3.5 rounded-xl bg-white/5 border border-white/10 text-xs text-brand-300 hover:text-white transition-all cursor-pointer font-bold uppercase tracking-wider"
                      >
                        Reset Form
                      </button>
                    </div>
                  </form>

                  {/* Photo logs directory */}
                  <div className="space-y-4 pt-4 font-mono">
                    <h3 className="text-xs uppercase font-bold text-brand-200 tracking-wider">Memory Feed database ({galleryPhotos.length})</h3>

                    {loading ? (
                      <div className="text-center py-6 text-brand-400 text-xs">Loading logs feed…</div>
                    ) : galleryPhotos.length === 0 ? (
                      <div className="text-center py-8 text-brand-400 text-xs bg-white/2 rounded-xl border border-white/5">No photos found in archive.</div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {galleryPhotos.map((photo) => (
                          <div
                            key={photo.id}
                            className="flex gap-4 p-4 rounded-xl border border-white/5 bg-white/2 hover:bg-white/4 hover:border-white/10 transition-all group"
                          >
                            <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-black/20 border border-white/5 relative">
                              <img src={photo.imageUrl} alt={photo.title} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-grow min-w-0 flex flex-col justify-between">
                              <div>
                                <div className="flex items-center gap-1.5 mb-0.5">
                                  <span className="text-[8px] bg-accent/10 border border-accent/20 text-accent px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                                    {photo.category}
                                  </span>
                                  <span className="text-[9px] text-brand-500 font-medium">
                                    {photo.date}
                                  </span>
                                </div>
                                <h4 className="text-xs font-bold text-white truncate">{photo.title}</h4>
                                <p className="text-[10px] text-brand-400 line-clamp-1 mt-0.5">{photo.story}</p>
                              </div>
                              <div className="flex justify-end pt-2">
                                <button
                                  onClick={() => deleteGalleryPhoto(photo.id, photo.imagePath, photo.title)}
                                  className="px-2.5 py-1 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-[9px] font-bold hover:bg-red-500/20 cursor-pointer uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity"
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
                </div>
              )}

              {/* ── MUSIC CORNER SETTINGS ── */}
              {activeTab === "music-settings" && (
                <div className="space-y-6">
                  <div className="font-mono">
                    <h2 className="text-lg font-bold text-white mb-1">Music Corner</h2>
                    <p className="text-[10px] text-brand-400">
                      Paste a YouTube playlist URL. The embedded player on /music updates automatically.
                    </p>
                  </div>

                  <form onSubmit={handleMusicSave} className="space-y-5 glass-strong border border-white/10 rounded-2xl p-6 font-mono text-xs">
                    <InputField
                      label="YouTube Playlist URL"
                      name="playlistUrl"
                      value={musicPlaylistUrl}
                      onChange={(e) => setMusicPlaylistUrl(e.target.value)}
                      placeholder="https://www.youtube.com/playlist?list=PL..."
                      hint="Open your playlist on YouTube → Share → copy link"
                      required
                    />

                    {musicSettings?.playlistId && (
                      <div className="flex gap-4 p-4 rounded-xl border border-white/5 bg-white/2">
                        {musicSettings.playlistThumbnail && (
                          <img
                            src={musicSettings.playlistThumbnail}
                            alt={musicSettings.playlistTitle}
                            className="w-20 h-20 rounded-lg object-cover shrink-0 border border-white/10"
                          />
                        )}
                        <div className="min-w-0">
                          <p className="text-[9px] uppercase tracking-widest text-brand-500 mb-1">Current playlist</p>
                          <p className="text-sm font-bold text-white truncate">{musicSettings.playlistTitle || "Untitled"}</p>
                          <p className="text-[10px] text-brand-400 mt-1 truncate font-mono">{musicSettings.playlistUrl}</p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-3 pt-2">
                      <button
                        type="submit"
                        disabled={submitting}
                        className="px-8 py-3.5 rounded-xl bg-accent hover:bg-accent-hover text-black font-bold text-xs uppercase tracking-wider transition-all hover:shadow-[0_0_20px_rgba(245,158,11,0.35)] disabled:opacity-50 cursor-pointer"
                      >
                        {submitting ? "Saving…" : "Save Playlist"}
                      </button>
                      {musicSettings && (
                        <button
                          type="button"
                          onClick={handleMusicDelete}
                          className="px-5 py-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold hover:bg-red-500/20 transition-all uppercase tracking-wider cursor-pointer"
                        >
                          Delete
                        </button>
                      )}
                      <Link
                        href="/music"
                        target="_blank"
                        className="px-5 py-3.5 rounded-xl bg-white/5 border border-white/10 text-xs text-brand-300 hover:text-white transition-all font-bold uppercase tracking-wider"
                      >
                        Preview Page ↗
                      </Link>
                    </div>
                  </form>
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
