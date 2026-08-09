"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { isConfigured as isFirebaseConfigured } from "@/lib/firebase";
import { API_BASE } from "@/lib/api";
import BlogEditor from "@/components/admin/BlogEditor";
import QuizManager from "@/components/admin/QuizManager";
import type { BlogPost, GalleryPhoto } from "@/types";

const getBackendUrl = () => {
  if (typeof window !== "undefined" && window.location.hostname === "localhost") {
    return "http://localhost:5000";
  }
  return API_BASE || "http://localhost:5000";
};

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
  statusText?: string;
  tasks?: string[];
  study?: {
    hours: number;
    subject: string;
    questions: number;
    mock?: string;
  };
  project?: {
    hours: number;
    tasks: string[];
  };
  content?: {
    videos?: number;
    blogs?: number;
    posts?: number;
  };
  health?: {
    sleep: number;
    healthyEating: number;
  };
  finance?: {
    expense: number;
    income: number;
  };
  mood?: number;
  bestMoment?: string;
  lessonLearned?: string;
  updatedAt: string;
}

interface QuizSummary {
  id: string;
  subject: string;
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: "A" | "B" | "C" | "D";
  publishDate: string;
  status: "draft" | "published";
  createdAt: string;
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

function InputField({ label, name, value, onChange, placeholder, required, type = "text", hint, min, max }: {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
  type?: string;
  hint?: string;
  min?: string;
  max?: string;
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
        min={min}
        max={max}
        className="bg-zinc-950/40 border border-white/5 rounded-xl px-4 py-3 text-xs text-white placeholder-brand-600 focus:outline-none focus:border-accent/40 focus:ring-1 focus:ring-accent/20 focus:bg-zinc-950/70 transition-all"
      />
    </div>
  );
}

function SelectField({ label, name, value, onChange, options, required }: {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: { value: string; label: string }[];
  required?: boolean;
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
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  required?: boolean;
  rows?: number;
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
type Tab = "overview" | "daily-status" | "add-update" | "manage-updates" | "add-plan" | "manage-plans" | "messages" | "write-blog" | "manage-blogs" | "gallery-management" | "music-settings" | "manage-resume" | "quiz-management";

interface ResumeItem {
  id: string;
  title: string;
  fileUrl: string;
  filePath: string;
  uploadedAt: string;
}

export default function AdminClientPage() {
  const [unlocked, setUnlocked] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginShaking, setLoginShaking] = useState(false);

  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [updates, setUpdates] = useState<UpdateItem[]>([]);
  const [plans, setPlans] = useState<FuturePlan[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const cached = localStorage.getItem("cached_plans");
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [statuses, setStatuses] = useState<DailyStatus[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const cached = localStorage.getItem("cached_statuses");
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [galleryPhotos, setGalleryPhotos] = useState<GalleryPhoto[]>([]);
  const [resumes, setResumes] = useState<ResumeItem[]>([]);
  const [quizzes, setQuizzes] = useState<QuizSummary[]>([]);
  const [resumeForm, setResumeForm] = useState({ title: "" });
  const [selectedResumeFile, setSelectedResumeFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(() => {
    if (typeof window === "undefined") return true;
    try {
      return !localStorage.getItem("cached_statuses");
    } catch {
      return true;
    }
  });
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [confirm, setConfirm] = useState<{ message: string; onConfirm: () => void } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [expandedMsg, setExpandedMsg] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [latency, setLatency] = useState<number | null>(null);
  const [showAllLogs, setShowAllLogs] = useState(false);

  const showToast = (message: string, type: "success" | "error") => setToast({ message, type });

  const getErrorMessage = (error: unknown, fallback = "An error occurred") => {
    if (error instanceof Error) return error.message;
    if (typeof error === "string") return error;
    return fallback;
  };

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
    slug: "",
    title: "",
    excerpt: "",
    date: new Date().toISOString().split("T")[0],
    readTime: "5 min read",
    tags: "",
    featured: false,
    content: "",
    writtenBy: "Nishant Kumar",
    category: "All",
    contentType: "tiptap" as "markdown" | "tiptap",
    seoTitle: ""
  });
  const [editingBlogSlug, setEditingBlogSlug] = useState<string | null>(null);
  const [selectedBlogCoverFile, setSelectedBlogCoverFile] = useState<File | null>(null);

  // Daily Status Form
  const [statusForm, setStatusForm] = useState({
    date: new Date().toISOString().split("T")[0],
    statusText: "",
    tasksText: "",
    studyHours: "0",
    studySubject: "",
    studyQuestions: "0",
    studyMock: "",
    projectHours: "0",
    projectTasksText: "",
    contentVideos: "0",
    contentBlogs: "0",
    contentPosts: "0",
    healthSleep: "7",
    healthEating: "5",
    financeExpense: "0",
    financeIncome: "0",
    mood: "8",
    bestMoment: "",
    lessonLearned: "",
  });

  // Fetch Public Logs (With Latency Ping)
  const fetchPublicLogs = useCallback(async () => {
    const start = performance.now();
    const backendUrl = getBackendUrl();

    // 1. Fetch statuses first for fast, non-blocking render of the timeline logs
    const statusPromise = fetch(`${backendUrl}/api/status`)
      .then(async (res) => {
        if (!res.ok) throw new Error("Status API returned non-OK status");
        const data = await res.json();
        if (Array.isArray(data)) {
          setStatuses(data);
          localStorage.setItem("cached_statuses", JSON.stringify(data));
        } else {
          setStatuses([]);
        }
        setLatency(Math.round(performance.now() - start));
      })
      .catch((err) => {
        console.warn("Failed to fetch status logs:", err);
        // Retain cache if offline
      })
      .finally(() => {
        setLoading(false); // Stop loading animation immediately when timeline data arrives!
      });

    // 2. Fetch future plans in parallel but don't hold up status display loading state
    const plansPromise = fetch(`${backendUrl}/api/future-plans`)
      .then(async (res) => {
        if (!res.ok) throw new Error("Plans API returned non-OK status");
        const data = await res.json();
        if (Array.isArray(data)) {
          setPlans(data);
          localStorage.setItem("cached_plans", JSON.stringify(data));
        } else {
          setPlans([]);
        }
      })
      .catch((err) => {
        console.warn("Failed to fetch future plans:", err);
      });

    await Promise.allSettled([statusPromise, plansPromise]);
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
      const backendUrl = getBackendUrl();
      const [updRes, msgRes, blogRes] = await Promise.all([
        fetch(`${backendUrl}/api/updates`, { headers: getAuthHeaders() }),
        fetch(`${backendUrl}/api/contact`, { headers: getAuthHeaders() }),
        fetch(`${backendUrl}/api/blog`, { headers: getAuthHeaders() }),
      ]);

      // Check if backend is responding
      if (!updRes.ok || !msgRes.ok || !blogRes.ok) {
        console.warn("Backend API returned non-OK status for admin data, using empty data");
        setUpdates([]);
        setMessages([]);
        setBlogs([]);
        return;
      }

      const updatesData = await updRes.json();
      const messagesData = await msgRes.json();
      const blogsData = await blogRes.json();
      setUpdates(Array.isArray(updatesData) ? updatesData : []);
      setMessages(Array.isArray(messagesData) ? messagesData : []);
      setBlogs(Array.isArray(blogsData) ? blogsData : []);
    } catch (e) {
      console.error("Failed to load admin databases:", e);
      // Don't show toast - it's expected when backend is not running
      setUpdates([]);
      setMessages([]);
      setBlogs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchResumeData = useCallback(async () => {
    try {
      const res = await fetch(`${getBackendUrl()}/api/resume`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error("Failed to fetch resumes");
      const data = await res.json();
      setResumes(Array.isArray(data) ? data : []);
    } catch {
      showToast("Failed to load resumes.", "error");
    }
  }, []);

  const fetchQuizData = useCallback(async () => {
    try {
      const res = await fetch(`${getBackendUrl()}/api/quiz`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error("Failed to fetch quizzes");
      const data = await res.json();
      setQuizzes(Array.isArray(data) ? data : []);
    } catch {
      showToast("Failed to load quizzes.", "error");
    }
  }, []);

  const fetchGalleryData = useCallback(async () => {
    setLoading(true);
    try {
      const backendUrl = getBackendUrl();
      const res = await fetch(`${backendUrl}/api/gallery`);
      if (!res.ok) {
        throw new Error("Failed to fetch gallery photos");
      }
      const list = await res.json();
      setGalleryPhotos(list);
    } catch {
      showToast("Failed to load gallery photos.", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMusicSettings = useCallback(async () => {
    try {
      const res = await fetch(`${getBackendUrl()}/api/music`);
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
      fetch(`${getBackendUrl()}/api/auth/verify`, {
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
    if (!unlocked) return;

    const loadProtectedResources = async () => {
      await Promise.all([
        fetchAdminData(),
        fetchGalleryData(),
        fetchMusicSettings(),
        fetchResumeData(),
        fetchQuizData(),
      ]);
    };

    void loadProtectedResources();
  }, [unlocked, fetchAdminData, fetchGalleryData, fetchMusicSettings, fetchResumeData, fetchQuizData]);

  // Handle Admin Auth
  const handleLogin = async (pw: string) => {
    try {
      const backendUrl = getBackendUrl();
      const res = await fetch(`${backendUrl}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pw }),
      });

      // Check if response is JSON
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Backend server not responding correctly. Check if backend is running on port 5000.");
      }

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
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Incorrect access credentials.";
      setLoginError(errorMessage);
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
        const res = await fetch(`${API_BASE}/api/updates`, {
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
        const res = await fetch(`${API_BASE}/api/updates`, {
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
    } catch (err) {
      showToast(getErrorMessage(err), "error");
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
      const res = await fetch(`${API_BASE}/api/future-plans`, {
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
    } catch (err) {
      showToast(getErrorMessage(err), "error");
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
      const isEdit = !!editingBlogSlug;

      const formData = new FormData();
      formData.append("slug", blogForm.slug);
      formData.append("title", blogForm.title);
      formData.append("seoTitle", blogForm.seoTitle || "");
      formData.append("excerpt", blogForm.excerpt);
      formData.append("date", blogForm.date);
      formData.append("readTime", blogForm.readTime);
      formData.append("tags", JSON.stringify(tagsArray));
      formData.append("featured", String(blogForm.featured));
      formData.append("content", blogForm.content);
      formData.append("writtenBy", blogForm.writtenBy);
      formData.append("category", blogForm.category);
      formData.append("contentType", blogForm.contentType);

      if (selectedBlogCoverFile) {
        formData.append("image", selectedBlogCoverFile);
      }
      if (isEdit) {
        formData.append("originalSlug", editingBlogSlug || "");
      }

      const res = await fetch(`${API_BASE}/api/blog`, {
        method: isEdit ? "PUT" : "POST",
        headers: getAuthOnlyHeaders(),
        body: formData,
      });
      if (!res.ok) throw new Error(isEdit ? "Failed to update blog." : "Failed to publish blog.");
      showToast(isEdit ? "Blog updated successfully!" : "Blog published successfully!", "success");
      fetchAdminData();
      setActiveTab("manage-blogs");
      setBlogForm({
        slug: "",
        title: "",
        seoTitle: "",
        excerpt: "",
        date: new Date().toISOString().split("T")[0],
        readTime: "5 min read",
        tags: "",
        featured: false,
        content: "",
        writtenBy: "Nishant Kumar",
        category: "All",
        contentType: "tiptap"
      });
      setSelectedBlogCoverFile(null);
      const coverInput = document.getElementById("blog-cover-file-input") as HTMLInputElement;
      if (coverInput) coverInput.value = "";
      setEditingBlogSlug(null);
    } catch (err) {
      showToast(getErrorMessage(err), "error");
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
          const res = await fetch(`${getBackendUrl()}/api/updates`, {
            method: "DELETE",
            headers: getAuthHeaders(),
            body: JSON.stringify({ id }),
          });
          if (!res.ok) throw new Error("Failed to delete update.");
          setUpdates((prev) => prev.filter((u) => u.id !== id));
          showToast("Update deleted successfully.", "success");
        } catch (err) {
          showToast(getErrorMessage(err), "error");
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
          const res = await fetch(`${getBackendUrl()}/api/future-plans`, {
            method: "DELETE",
            headers: getAuthHeaders(),
            body: JSON.stringify({ id }),
          });
          if (!res.ok) throw new Error("Failed to delete roadmap item.");
          setPlans((prev) => prev.filter((p) => p.id !== id));
          showToast("Item removed from roadmap.", "success");
        } catch (err) {
          showToast(getErrorMessage(err), "error");
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
          const res = await fetch(`${getBackendUrl()}/api/blog`, {
            method: "DELETE",
            headers: getAuthHeaders(),
            body: JSON.stringify({ slug }),
          });
          if (!res.ok) throw new Error("Failed to delete blog.");
          setBlogs((prev) => prev.filter((b) => b.slug !== slug));
          showToast("Blog deleted successfully.", "success");
        } catch (err) {
          showToast(getErrorMessage(err), "error");
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
          const res = await fetch(`${getBackendUrl()}/api/contact`, {
            method: "DELETE",
            headers: getAuthHeaders(),
            body: JSON.stringify({ id }),
          });
          if (!res.ok) throw new Error("Failed to delete message.");
          setMessages((prev) => prev.filter((m) => m.id !== id));
          showToast("Message deleted.", "success");
        } catch (err) {
          showToast(getErrorMessage(err), "error");
        }
      },
    });
  };

  // ── Mark Message as Read ──
  const markAsRead = async (id: string) => {
    try {
      await fetch(`${getBackendUrl()}/api/contact`, {
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
      const res = await fetch(`${getBackendUrl()}/api/future-plans`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({ id: plan.id, status: next }),
      });
      if (!res.ok) throw new Error("Failed to update plan status.");
      setPlans((prev) => prev.map((p) => p.id === plan.id ? { ...p, status: next } : p));
    } catch (err) {
      showToast(getErrorMessage(err), "error");
    }
  };

  // ── Submit Daily Status ──
  const handleStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const tasks = statusForm.tasksText.split("\n").map(t => t.trim()).filter(t => t);
      const projectTasks = statusForm.projectTasksText.split("\n").map(t => t.trim()).filter(t => t);
      
      const payload = {
        date: statusForm.date,
        statusText: statusForm.statusText,
        tasks: tasks.length > 0 ? tasks : undefined,
        study: statusForm.studyHours !== "0" ? {
          hours: Number(statusForm.studyHours),
          subject: statusForm.studySubject,
          questions: Number(statusForm.studyQuestions),
          mock: statusForm.studyMock || undefined,
        } : undefined,
        project: statusForm.projectHours !== "0" ? {
          hours: Number(statusForm.projectHours),
          tasks: projectTasks.length > 0 ? projectTasks : undefined,
        } : undefined,
        content: (Number(statusForm.contentVideos) > 0 || Number(statusForm.contentBlogs) > 0 || Number(statusForm.contentPosts) > 0) ? {
          videos: Number(statusForm.contentVideos) || undefined,
          blogs: Number(statusForm.contentBlogs) || undefined,
          posts: Number(statusForm.contentPosts) || undefined,
        } : undefined,
        health: {
          sleep: Number(statusForm.healthSleep),
          healthyEating: Number(statusForm.healthEating),
        },
        finance: (Number(statusForm.financeExpense) > 0 || Number(statusForm.financeIncome) > 0) ? {
          expense: Number(statusForm.financeExpense) || undefined,
          income: Number(statusForm.financeIncome) || undefined,
        } : undefined,
        mood: Number(statusForm.mood),
        bestMoment: statusForm.bestMoment || undefined,
        lessonLearned: statusForm.lessonLearned || undefined,
      };

      const res = await fetch(`${getBackendUrl()}/api/status`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Failed to submit daily status (${res.status}).`);
      }
      setStatuses((prev) => [payload as DailyStatus, ...prev]);
      showToast("Daily status logged successfully.", "success");
      setStatusForm({
        date: new Date().toISOString().split("T")[0],
        statusText: "",
        tasksText: "",
        studyHours: "0",
        studySubject: "",
        studyQuestions: "0",
        studyMock: "",
        projectHours: "0",
        projectTasksText: "",
        contentVideos: "0",
        contentBlogs: "0",
        contentPosts: "0",
        healthSleep: "7",
        healthEating: "5",
        financeExpense: "0",
        financeIncome: "0",
        mood: "8",
        bestMoment: "",
        lessonLearned: "",
      });
      setActiveTab("daily-status");
    } catch (err) {
      showToast(getErrorMessage(err), "error");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Delete Status ──
  const deleteStatus = (id: string, date: string) => {
    setConfirm({
      message: `Delete status log for ${date}?`,
      onConfirm: async () => {
        setConfirm(null);
        try {
          const res = await fetch(`${getBackendUrl()}/api/status`, {
            method: "DELETE",
            headers: getAuthHeaders(),
            body: JSON.stringify({ id }),
          });
          if (!res.ok) throw new Error("Failed to delete status.");
          setStatuses((prev) => prev.filter((s) => s.id !== id));
          showToast("Status deleted.", "success");
        } catch (err) {
          showToast(getErrorMessage(err), "error");
        }
      },
    });
  };

  // ── Submit Gallery Photo ──
  const handleGallerySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedImageFile) {
      showToast("Please select an image.", "error");
      return;
    }
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("title", galleryForm.title);
      formData.append("story", galleryForm.story);
      formData.append("category", galleryForm.category);
      formData.append("date", galleryForm.date);
      formData.append("image", selectedImageFile);

      const res = await fetch(`${getBackendUrl()}/api/gallery`, {
        method: "POST",
        headers: getAuthOnlyHeaders(),
        body: formData,
      });
      if (!res.ok) throw new Error("Failed to upload photo.");
      showToast("Photo uploaded successfully.", "success");
      fetchGalleryData();
      setGalleryForm({
        title: "",
        story: "",
        category: "Daily Moments",
        date: new Date().toISOString().split("T")[0]
      });
      setSelectedImageFile(null);
      const imageInput = document.getElementById("gallery-image-input") as HTMLInputElement;
      if (imageInput) imageInput.value = "";
      setActiveTab("gallery-management");
    } catch (err) {
      showToast(getErrorMessage(err), "error");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Delete Gallery Photo ──
  const deleteGalleryPhoto = (id: string, title: string) => {
    setConfirm({
      message: `Delete photo "${title}"?`,
      onConfirm: async () => {
        setConfirm(null);
        try {
          const res = await fetch(`${getBackendUrl()}/api/gallery`, {
            method: "DELETE",
            headers: getAuthHeaders(),
            body: JSON.stringify({ id }),
          });
          if (!res.ok) throw new Error("Failed to delete photo.");
          setGalleryPhotos((prev) => prev.filter((p) => p.id !== id));
          showToast("Photo deleted.", "success");
        } catch (err) {
          showToast(getErrorMessage(err), "error");
        }
      },
    });
  };

  // ── Submit Music Settings ──
  const handleMusicSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const playlistIdMatch = musicPlaylistUrl.match(/[?&]list=([^&]+)/);
      const playlistId = playlistIdMatch ? playlistIdMatch[1] : "";

      if (!playlistId) {
        showToast("Invalid YouTube playlist URL.", "error");
        return;
      }

      const res = await fetch(`${getBackendUrl()}/api/music`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ playlistUrl: musicPlaylistUrl, playlistId }),
      });
      if (!res.ok) throw new Error("Failed to update music settings.");
      showToast("Music settings updated.", "success");
      fetchMusicSettings();
    } catch (err) {
      showToast(getErrorMessage(err), "error");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Submit Resume ──
  const handleResumeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedResumeFile) {
      showToast("Please select a PDF file.", "error");
      return;
    }
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("title", resumeForm.title);
      formData.append("file", selectedResumeFile);

      const res = await fetch(`${getBackendUrl()}/api/resume`, {
        method: "POST",
        headers: getAuthOnlyHeaders(),
        body: formData,
      });
      if (!res.ok) throw new Error("Failed to upload resume.");
      showToast("Resume uploaded successfully.", "success");
      fetchResumeData();
      setResumeForm({ title: "" });
      setSelectedResumeFile(null);
      const resumeInput = document.getElementById("resume-file-input") as HTMLInputElement;
      if (resumeInput) resumeInput.value = "";
      setActiveTab("manage-resume");
    } catch (err) {
      showToast(getErrorMessage(err), "error");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Delete Resume ──
  const deleteResume = (id: string, title: string) => {
    setConfirm({
      message: `Delete resume "${title}"?`,
      onConfirm: async () => {
        setConfirm(null);
        try {
          const res = await fetch(`${getBackendUrl()}/api/resume`, {
            method: "DELETE",
            headers: getAuthHeaders(),
            body: JSON.stringify({ id }),
          });
          if (!res.ok) throw new Error("Failed to delete resume.");
          setResumes((prev) => prev.filter((r) => r.id !== id));
          showToast("Resume deleted.", "success");
        } catch (err) {
          showToast(getErrorMessage(err), "error");
        }
      },
    });
  };

  // ── Edit Blog ──
  const editBlog = (blog: BlogPost) => {
    setBlogForm({
      slug: blog.slug,
      title: blog.title,
      seoTitle: blog.seoTitle || "",
      excerpt: blog.excerpt,
      date: blog.date,
      readTime: blog.readTime,
      tags: blog.tags.join(", "),
      featured: blog.featured ?? false,
      content: blog.content,
      writtenBy: blog.writtenBy || "Nishant Kumar",
      category: blog.category || "All",
      contentType: blog.contentType as "markdown" | "tiptap",
    });
    setEditingBlogSlug(blog.slug);
    setActiveTab("write-blog");
  };



  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: "overview", label: "Overview", icon: "📊" },
    { id: "daily-status", label: "Daily Status", icon: "📅" },
    { id: "add-update", label: "Add Update", icon: "➕" },
    { id: "manage-updates", label: "Manage Updates", icon: "📰" },
    { id: "add-plan", label: "Add Plan", icon: "🎯" },
    { id: "manage-plans", label: "Manage Plans", icon: "🗺️" },
    { id: "messages", label: "Messages", icon: "✉️" },
    { id: "write-blog", label: "Write Blog", icon: "✍️" },
    { id: "manage-blogs", label: "Manage Blogs", icon: "📝" },
    { id: "gallery-management", label: "Gallery", icon: "🖼️" },
    { id: "music-settings", label: "Music", icon: "🎵" },
    { id: "manage-resume", label: "Resume", icon: "📄" },
    { id: "quiz-management", label: "Quiz", icon: "❓" },
  ];

  return (
    <main className="min-h-screen bg-zinc-950 text-brand-100 font-mono text-xs">
      {/* Header */}
      <header className="border-b border-white/5 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <span className="text-xl">⚡</span>
              <div>
                <h1 className="text-sm font-bold text-white">Admin Console</h1>
                <p className="text-[10px] text-brand-500">HIII-Nishant CMS</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {latency !== null && (
                <div className="text-[10px] text-brand-500">
                  Latency: {latency}ms
                </div>
              )}
              {unlocked ? (
                <button
                  onClick={handleLogout}
                  className="px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs hover:bg-red-500/20 transition-all"
                >
                  Lock Console
                </button>
              ) : (
                <button
                  onClick={() => setShowLoginModal(true)}
                  className="px-3 py-1.5 rounded-lg bg-accent/10 border border-accent/20 text-accent text-xs hover:bg-accent/20 transition-all"
                >
                  Unlock Console
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="glass-strong border border-white/8 rounded-2xl p-8 max-w-sm w-full mx-4 shadow-2xl">
            <div className="text-lg mb-4">🔐 Admin Access</div>
            <form onSubmit={(e) => { e.preventDefault(); handleLogin(adminPasswordInput); }}>
              <InputField
                label="Admin Password"
                name="password"
                type="password"
                value={adminPasswordInput}
                onChange={(e) => setAdminPasswordInput(e.target.value)}
                placeholder="Enter admin password"
                required
              />
              {loginError && (
                <div className="mt-3 text-[10px] text-red-400">{loginError}</div>
              )}
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => { setShowLoginModal(false); setLoginError(""); setAdminPasswordInput(""); }}
                  className="flex-1 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-brand-300 hover:text-white hover:border-white/20 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`flex-1 py-2.5 rounded-xl bg-accent/10 border border-accent/20 text-xs text-accent hover:bg-accent/20 transition-all ${loginShaking ? "animate-shake" : ""}`}
                >
                  Unlock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Sidebar */}
          <aside className="w-48 shrink-0 hidden lg:block">
            <nav className="space-y-1 sticky top-24">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all ${
                    activeTab === tab.id
                      ? "bg-accent/10 text-accent border border-accent/20"
                      : "text-brand-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span className="text-xs">{tab.label}</span>
                </button>
              ))}
            </nav>
          </aside>

          {/* Content Area */}
          <div className="flex-1 min-w-0">
            {/* Mobile Tab Selector */}
            <div className="lg:hidden mb-6">
              <select
                value={activeTab}
                onChange={(e) => setActiveTab(e.target.value as Tab)}
                className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-xs text-white"
              >
                {tabs.map((tab) => (
                  <option key={tab.id} value={tab.id}>{tab.icon} {tab.label}</option>
                ))}
              </select>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="flex items-center justify-center py-20">
                <div className="text-brand-500">Loading console data...</div>
              </div>
            )}

            {/* Tab Content */}
            {!loading && (
              <>
                {/* Overview Tab */}
                {activeTab === "overview" && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-lg font-bold text-white mb-4">Dashboard Overview</h2>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <StatCard value={updates.length} label="Updates" color="text-blue-400" icon="📰" />
                        <StatCard value={plans.length} label="Plans" color="text-violet-400" icon="🎯" />
                        <StatCard value={messages.length} label="Messages" color="text-amber-400" icon="✉️" />
                        <StatCard value={blogs.length} label="Blogs" color="text-emerald-400" icon="📝" />
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-bold text-white mb-3">Recent Activity</h3>
                      <div className="space-y-2">
                        {statuses.slice(0, 3).map((status) => (
                          <div key={status.id} className="glass p-3 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-[10px] text-brand-500">{status.date}</span>
                              <span className="text-[10px] text-accent">Status Log</span>
                            </div>
                            {status.statusText && <p className="text-xs text-white line-clamp-2">{status.statusText}</p>}
                          </div>
                        ))}
                        {statuses.length === 0 && (
                          <div className="text-brand-500 text-xs py-8 text-center">No recent activity</div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Daily Status Tab */}
                {activeTab === "daily-status" && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-lg font-bold text-white mb-1">📅 Daily Status Log</h2>
                      <p className="text-[10px] text-brand-500 font-mono mb-5">Fill in each section just like your daily log card.</p>

                      <form onSubmit={handleStatusSubmit} className="space-y-0 rounded-2xl border border-zinc-700/70 bg-[#09090b]/90 overflow-hidden">

                        {/* ── Header Row ── */}
                        <div className="flex items-center justify-between gap-3 px-5 py-3.5 border-b border-white/5 bg-white/2">
                          <InputField
                            label="Date *"
                            name="date"
                            type="date"
                            value={statusForm.date}
                            onChange={(e) => setStatusForm({ ...statusForm, date: e.target.value })}
                            required
                          />
                          <InputField
                            label="Mood (1-10)"
                            name="mood"
                            type="number"
                            min="1"
                            max="10"
                            value={statusForm.mood}
                            onChange={(e) => setStatusForm({ ...statusForm, mood: e.target.value })}
                          />
                        </div>

                        {/* ── Focus / Status Text ── */}
                        <div className="px-5 py-3.5 border-b border-white/[0.06]">
                          <TextAreaField
                            label="Focus / Status Text"
                            name="statusText"
                            value={statusForm.statusText}
                            onChange={(e) => setStatusForm({ ...statusForm, statusText: e.target.value })}
                            placeholder="How was your day? What were you focused on?"
                            rows={2}
                          />
                        </div>

                        {/* ── 📚 Study ── */}
                        <div className="px-5 py-3.5 border-b border-white/[0.06] space-y-3">
                          <span className="text-[10.5px] font-bold text-yellow-400 uppercase tracking-wider font-mono">📚 Study</span>
                          <div className="grid grid-cols-2 gap-3">
                            <InputField
                              label="Hours"
                              name="studyHours"
                              type="number"
                              value={statusForm.studyHours}
                              onChange={(e) => setStatusForm({ ...statusForm, studyHours: e.target.value })}
                            />
                            <InputField
                              label="Subject"
                              name="studySubject"
                              value={statusForm.studySubject}
                              onChange={(e) => setStatusForm({ ...statusForm, studySubject: e.target.value })}
                              placeholder="OS, DBMS, CN..."
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <InputField
                              label="Practice Questions"
                              name="studyQuestions"
                              type="number"
                              value={statusForm.studyQuestions}
                              onChange={(e) => setStatusForm({ ...statusForm, studyQuestions: e.target.value })}
                            />
                            <InputField
                              label="Mock Test Score"
                              name="studyMock"
                              value={statusForm.studyMock}
                              onChange={(e) => setStatusForm({ ...statusForm, studyMock: e.target.value })}
                              placeholder="e.g. 45/60 or N/A"
                            />
                          </div>
                        </div>

                        {/* ── 💻 Dev ── */}
                        <div className="px-5 py-3.5 border-b border-white/[0.06] space-y-3">
                          <span className="text-[10.5px] font-bold text-yellow-400 uppercase tracking-wider font-mono">💻 Dev</span>
                          <div className="grid grid-cols-2 gap-3">
                            <InputField
                              label="Dev Hours"
                              name="projectHours"
                              type="number"
                              value={statusForm.projectHours}
                              onChange={(e) => setStatusForm({ ...statusForm, projectHours: e.target.value })}
                            />
                            <TextAreaField
                              label="Tasks (one per line)"
                              name="projectTasksText"
                              value={statusForm.projectTasksText}
                              onChange={(e) => setStatusForm({ ...statusForm, projectTasksText: e.target.value })}
                              placeholder={"Hiii Nishant team\nFixed auth bug"}
                              rows={2}
                            />
                          </div>
                        </div>

                        {/* ── 🎥 Content ── */}
                        <div className="px-5 py-3.5 border-b border-white/[0.06] space-y-3">
                          <span className="text-[10.5px] font-bold text-yellow-400 uppercase tracking-wider font-mono">🎥 Content</span>
                          <div className="grid grid-cols-3 gap-3">
                            <InputField
                              label="YouTube Videos"
                              name="contentVideos"
                              type="number"
                              value={statusForm.contentVideos}
                              onChange={(e) => setStatusForm({ ...statusForm, contentVideos: e.target.value })}
                            />
                            <InputField
                              label="Blogs"
                              name="contentBlogs"
                              type="number"
                              value={statusForm.contentBlogs}
                              onChange={(e) => setStatusForm({ ...statusForm, contentBlogs: e.target.value })}
                            />
                            <InputField
                              label="Insta Posts"
                              name="contentPosts"
                              type="number"
                              value={statusForm.contentPosts}
                              onChange={(e) => setStatusForm({ ...statusForm, contentPosts: e.target.value })}
                            />
                          </div>
                        </div>

                        {/* ── 😴 Health ── */}
                        <div className="px-5 py-3.5 border-b border-white/[0.06] space-y-3">
                          <span className="text-[10.5px] font-bold text-yellow-400 uppercase tracking-wider font-mono">😴 Health</span>
                          <div className="grid grid-cols-2 gap-3">
                            <InputField
                              label="Sleep Hours"
                              name="healthSleep"
                              type="number"
                              value={statusForm.healthSleep}
                              onChange={(e) => setStatusForm({ ...statusForm, healthSleep: e.target.value })}
                            />
                            <InputField
                              label="Diet Rating (1-5)"
                              name="healthEating"
                              type="number"
                              min="1"
                              max="5"
                              value={statusForm.healthEating}
                              onChange={(e) => setStatusForm({ ...statusForm, healthEating: e.target.value })}
                            />
                          </div>
                        </div>

                        {/* ── 💸 Finance ── */}
                        <div className="px-5 py-3.5 border-b border-white/[0.06] space-y-3">
                          <span className="text-[10.5px] font-bold text-yellow-400 uppercase tracking-wider font-mono">💸 Finance</span>
                          <div className="grid grid-cols-2 gap-3">
                            <InputField
                              label="Income (₹)"
                              name="financeIncome"
                              type="number"
                              value={statusForm.financeIncome}
                              onChange={(e) => setStatusForm({ ...statusForm, financeIncome: e.target.value })}
                            />
                            <InputField
                              label="Expense (₹)"
                              name="financeExpense"
                              type="number"
                              value={statusForm.financeExpense}
                              onChange={(e) => setStatusForm({ ...statusForm, financeExpense: e.target.value })}
                            />
                          </div>
                        </div>

                        {/* ── ⭐ Best Moment ── */}
                        <div className="px-5 py-3.5 border-b border-white/[0.06] space-y-3">
                          <span className="text-[10.5px] font-bold text-yellow-400 uppercase tracking-wider font-mono">⭐ Best Moment</span>
                          <TextAreaField
                            label=""
                            name="bestMoment"
                            value={statusForm.bestMoment}
                            onChange={(e) => setStatusForm({ ...statusForm, bestMoment: e.target.value })}
                            placeholder='"stayed focused."'
                            rows={2}
                          />
                        </div>

                        {/* ── 💡 Lesson ── */}
                        <div className="px-5 py-3.5 space-y-3">
                          <span className="text-[10.5px] font-bold text-yellow-400 uppercase tracking-wider font-mono">💡 Lesson Learned</span>
                          <TextAreaField
                            label=""
                            name="lessonLearned"
                            value={statusForm.lessonLearned}
                            onChange={(e) => setStatusForm({ ...statusForm, lessonLearned: e.target.value })}
                            placeholder="Planning ahead saves time."
                            rows={2}
                          />
                        </div>

                        {/* ── Submit ── */}
                        <div className="px-5 py-4 border-t border-white/5 bg-white/[0.01]">
                          <button
                            type="submit"
                            disabled={submitting}
                            className="w-full py-3 rounded-xl bg-accent/10 border border-accent/20 text-accent text-xs font-bold hover:bg-accent/20 transition-all disabled:opacity-50 font-mono tracking-wide"
                          >
                            {submitting ? "Saving log..." : "✓ Submit Status Log"}
                          </button>
                        </div>
                      </form>
                    </div>

                    {/* Recent Logs */}
                    <div>
                      <h3 className="text-sm font-bold text-white mb-3">Recent Status Logs</h3>
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {statuses.map((status) => (
                          <div key={status.id} className="rounded-xl border border-zinc-700/50 bg-zinc-950/40 p-3">
                            <div className="flex items-center justify-between mb-1.5">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-white font-mono">{status.date}</span>
                                {status.mood && <span className="text-[10px] text-amber-400">{status.mood}/10</span>}
                              </div>
                              <button
                                onClick={() => deleteStatus(status.id, status.date)}
                                className="text-[10px] text-red-400 hover:text-red-300 transition-colors"
                              >
                                Delete
                              </button>
                            </div>
                            {status.statusText && <p className="text-[10px] text-zinc-300 border-l-2 border-accent/30 pl-2 mb-1.5 italic">{status.statusText}</p>}
                            <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[9px] text-zinc-500 font-mono">
                              {status.study && <span className="text-yellow-500">📚 {status.study.hours}h {status.study.subject}</span>}
                              {status.project && <span className="text-cyan-500">💻 {status.project.hours}h</span>}
                              {status.health && <span>😴 {status.health.sleep}h</span>}
                              {status.finance && <span className={status.finance.income >= status.finance.expense ? "text-emerald-500" : "text-red-400"}>₹{status.finance.income - status.finance.expense}</span>}
                            </div>
                          </div>
                        ))}
                        {statuses.length === 0 && (
                          <div className="text-brand-500 text-xs py-8 text-center font-mono">No status logs yet</div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Add Update Tab */}
                {activeTab === "add-update" && (
                  <div>
                    <h2 className="text-lg font-bold text-white mb-4">{editingUpdateId ? "Edit Update" : "Add New Update"}</h2>
                    <form onSubmit={handleUpdateSubmit} className="space-y-4">
                      <SelectField
                        label="Category"
                        name="category"
                        value={updateForm.category}
                        onChange={(e) => setUpdateForm({ ...updateForm, category: e.target.value as UpdateItem["category"] })}
                        options={[
                          { value: "video", label: "YouTube Video" },
                          { value: "blog", label: "Blog Post" },
                          { value: "instagram", label: "Instagram Post" },
                        ]}
                        required
                      />
                      <InputField
                        label="Title"
                        name="title"
                        value={updateForm.title}
                        onChange={(e) => setUpdateForm({ ...updateForm, title: e.target.value })}
                        placeholder="Update title"
                        required
                      />
                      <TextAreaField
                        label="Description"
                        name="description"
                        value={updateForm.description}
                        onChange={(e) => setUpdateForm({ ...updateForm, description: e.target.value })}
                        placeholder="Brief description"
                        rows={3}
                        required
                      />
                      <InputField
                        label="Date"
                        name="date"
                        type="date"
                        value={updateForm.date}
                        onChange={(e) => setUpdateForm({ ...updateForm, date: e.target.value })}
                        required
                      />
                      <InputField
                        label="Link (optional)"
                        name="href"
                        value={updateForm.href}
                        onChange={(e) => setUpdateForm({ ...updateForm, href: e.target.value })}
                        placeholder="https://..."
                      />
                      <InputField
                        label="Badge (optional)"
                        name="badge"
                        value={updateForm.badge}
                        onChange={(e) => setUpdateForm({ ...updateForm, badge: e.target.value })}
                        placeholder="NEW, FEATURED, etc."
                      />
                      <InputField
                        label="Meta (optional)"
                        name="meta"
                        value={updateForm.meta}
                        onChange={(e) => setUpdateForm({ ...updateForm, meta: e.target.value })}
                        placeholder="Additional metadata"
                      />
                      <label className="flex items-center gap-2 text-xs text-brand-300">
                        <input
                          type="checkbox"
                          checked={updateForm.isNew}
                          onChange={(e) => setUpdateForm({ ...updateForm, isNew: e.target.checked })}
                          className="rounded"
                        />
                        Mark as new
                      </label>
                      <button
                        type="submit"
                        disabled={submitting}
                        className="w-full py-3 rounded-xl bg-accent/10 border border-accent/20 text-accent text-xs font-semibold hover:bg-accent/20 transition-all disabled:opacity-50"
                      >
                        {submitting ? "Submitting..." : (editingUpdateId ? "Update Feed" : "Publish Update")}
                      </button>
                      {editingUpdateId && (
                        <button
                          type="button"
                          onClick={() => { setEditingUpdateId(null); setUpdateForm({ category: "blog", title: "", description: "", date: new Date().toISOString().split("T")[0], href: "", badge: "", meta: "", isNew: true }); }}
                          className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-brand-300 text-xs font-semibold hover:bg-white/10 transition-all"
                        >
                          Cancel Edit
                        </button>
                      )}
                    </form>
                  </div>
                )}

                {/* Manage Updates Tab */}
                {activeTab === "manage-updates" && (
                  <div>
                    <h2 className="text-lg font-bold text-white mb-4">Manage Updates</h2>
                    <div className="space-y-2">
                      {updates.map((update) => (
                        <div key={update.id} className="glass p-4 rounded-lg">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${updateCategoryConfig[update.category].bg} ${updateCategoryConfig[update.category].color}`}>
                                {updateCategoryConfig[update.category].label}
                              </span>
                              {update.isNew && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-accent/10 text-accent">
                                  NEW
                                </span>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => editUpdate(update)}
                                className="text-[10px] text-brand-400 hover:text-white"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => deleteUpdate(update.id, update.title)}
                                className="text-[10px] text-red-400 hover:text-red-300"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                          <h3 className="text-sm font-semibold text-white mb-1">{update.title}</h3>
                          <p className="text-xs text-brand-400 mb-2">{update.description}</p>
                          <div className="flex items-center gap-4 text-[10px] text-brand-500">
                            <span>{update.date}</span>
                            {update.href && (
                              <a href={update.href} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
                                View Link
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                      {updates.length === 0 && (
                        <div className="text-brand-500 text-xs py-8 text-center">No updates yet</div>
                      )}
                    </div>
                  </div>
                )}

                {/* Add Plan Tab */}
                {activeTab === "add-plan" && (
                  <div>
                    <h2 className="text-lg font-bold text-white mb-4">Add New Plan</h2>
                    <form onSubmit={handlePlanSubmit} className="space-y-4">
                      <InputField
                        label="Title"
                        name="title"
                        value={planForm.title}
                        onChange={(e) => setPlanForm({ ...planForm, title: e.target.value })}
                        placeholder="Plan title"
                        required
                      />
                      <TextAreaField
                        label="Description"
                        name="description"
                        value={planForm.description}
                        onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })}
                        placeholder="Plan description"
                        rows={3}
                        required
                      />
                      <InputField
                        label="Target Date"
                        name="targetDate"
                        type="date"
                        value={planForm.targetDate}
                        onChange={(e) => setPlanForm({ ...planForm, targetDate: e.target.value })}
                        required
                      />
                      <SelectField
                        label="Category"
                        name="category"
                        value={planForm.category}
                        onChange={(e) => setPlanForm({ ...planForm, category: e.target.value as FuturePlan["category"] })}
                        options={[
                          { value: "general", label: "General" },
                          { value: "academic", label: "Academic / GATE" },
                          { value: "business", label: "Business / Startup" },
                          { value: "community", label: "Community" },
                        ]}
                        required
                      />
                      <SelectField
                        label="Status"
                        name="status"
                        value={planForm.status}
                        onChange={(e) => setPlanForm({ ...planForm, status: e.target.value as FuturePlan["status"] })}
                        options={[
                          { value: "planned", label: "Planned" },
                          { value: "in-progress", label: "In Progress" },
                          { value: "completed", label: "Completed" },
                        ]}
                        required
                      />
                      <button
                        type="submit"
                        disabled={submitting}
                        className="w-full py-3 rounded-xl bg-accent/10 border border-accent/20 text-accent text-xs font-semibold hover:bg-accent/20 transition-all disabled:opacity-50"
                      >
                        {submitting ? "Submitting..." : "Add Plan"}
                      </button>
                    </form>
                  </div>
                )}

                {/* Manage Plans Tab */}
                {activeTab === "manage-plans" && (
                  <div>
                    <h2 className="text-lg font-bold text-white mb-4">Manage Plans</h2>
                    <div className="space-y-2">
                      {plans.map((plan) => (
                        <div key={plan.id} className="glass p-4 rounded-lg">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${planCategoryConfig[plan.category].color}`}>
                                {planCategoryConfig[plan.category].label}
                              </span>
                              <button
                                onClick={() => togglePlanStatus(plan)}
                                className={`px-2 py-0.5 rounded text-[10px] font-semibold ${statusConfig[plan.status].bg} ${statusConfig[plan.status].color}`}
                              >
                                {statusConfig[plan.status].icon} {statusConfig[plan.status].label}
                              </button>
                            </div>
                            <button
                              onClick={() => deletePlan(plan.id, plan.title)}
                              className="text-[10px] text-red-400 hover:text-red-300"
                            >
                              Delete
                            </button>
                          </div>
                          <h3 className="text-sm font-semibold text-white mb-1">{plan.title}</h3>
                          <p className="text-xs text-brand-400 mb-2">{plan.description}</p>
                          <div className="text-[10px] text-brand-500">Target: {plan.targetDate}</div>
                        </div>
                      ))}
                      {plans.length === 0 && (
                        <div className="text-brand-500 text-xs py-8 text-center">No plans yet</div>
                      )}
                    </div>
                  </div>
                )}

                {/* Messages Tab */}
                {activeTab === "messages" && (
                  <div>
                    <h2 className="text-lg font-bold text-white mb-4">Contact Messages</h2>
                    <div className="space-y-2">
                      {messages.map((msg) => (
                        <div key={msg.id} className={`glass p-4 rounded-lg ${!msg.read ? "border-l-2 border-accent" : ""}`}>
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-white">{msg.name}</span>
                              {!msg.read && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-accent/10 text-accent">
                                  NEW
                                </span>
                              )}
                            </div>
                            <div className="flex gap-2">
                              {!msg.read && (
                                <button
                                  onClick={() => markAsRead(msg.id)}
                                  className="text-[10px] text-brand-400 hover:text-white"
                                >
                                  Mark Read
                                </button>
                              )}
                              <button
                                onClick={() => deleteMessage(msg.id, msg.name)}
                                className="text-[10px] text-red-400 hover:text-red-300"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                          <div className="text-xs text-brand-400 mb-2">{msg.email}</div>
                          <div className="text-xs text-brand-400 mb-1">{msg.subject}</div>
                          <div className="text-xs text-brand-300 mb-2">{msg.message}</div>
                          <div className="text-[10px] text-brand-500">{msg.date}</div>
                        </div>
                      ))}
                      {messages.length === 0 && (
                        <div className="text-brand-500 text-xs py-8 text-center">No messages yet</div>
                      )}
                    </div>
                  </div>
                )}

                {/* Write Blog Tab */}
                {activeTab === "write-blog" && (
                  <div>
                    <h2 className="text-lg font-bold text-white mb-4">{editingBlogSlug ? "Edit Blog" : "Write New Blog"}</h2>
                    <form onSubmit={handleBlogSubmit} className="space-y-4">
                      <InputField
                        label="Slug"
                        name="slug"
                        value={blogForm.slug}
                        onChange={(e) => setBlogForm({ ...blogForm, slug: e.target.value })}
                        placeholder="blog-post-slug"
                        required
                        hint="URL-friendly identifier"
                      />
                      <InputField
                        label="Title"
                        name="title"
                        value={blogForm.title}
                        onChange={(e) => setBlogForm({ ...blogForm, title: e.target.value })}
                        placeholder="Blog title"
                        required
                      />
                      <InputField
                        label="SEO Title"
                        name="seoTitle"
                        value={blogForm.seoTitle}
                        onChange={(e) => setBlogForm({ ...blogForm, seoTitle: e.target.value })}
                        placeholder="SEO-optimized title"
                        hint="For search engines"
                      />
                      <TextAreaField
                        label="Excerpt"
                        name="excerpt"
                        value={blogForm.excerpt}
                        onChange={(e) => setBlogForm({ ...blogForm, excerpt: e.target.value })}
                        placeholder="Brief summary"
                        rows={2}
                        required
                      />
                      <InputField
                        label="Date"
                        name="date"
                        type="date"
                        value={blogForm.date}
                        onChange={(e) => setBlogForm({ ...blogForm, date: e.target.value })}
                        required
                      />
                      <InputField
                        label="Read Time"
                        name="readTime"
                        value={blogForm.readTime}
                        onChange={(e) => setBlogForm({ ...blogForm, readTime: e.target.value })}
                        placeholder="5 min read"
                      />
                      <TextAreaField
                        label="Tags (comma-separated)"
                        name="tags"
                        value={blogForm.tags}
                        onChange={(e) => setBlogForm({ ...blogForm, tags: e.target.value })}
                        placeholder="tag1, tag2, tag3"
                      />
                      <SelectField
                        label="Category"
                        name="category"
                        value={blogForm.category}
                        onChange={(e) => setBlogForm({ ...blogForm, category: e.target.value })}
                        options={[
                          { value: "All", label: "All" },
                          { value: "GATE", label: "GATE" },
                          { value: "JEE", label: "JEE" },
                          { value: "UPSC", label: "UPSC" },
                          { value: "Lifestyle", label: "Lifestyle" },
                        ]}
                      />
                      <SelectField
                        label="Content Type"
                        name="contentType"
                        value={blogForm.contentType}
                        onChange={(e) => setBlogForm({ ...blogForm, contentType: e.target.value as "markdown" | "tiptap" })}
                        options={[
                          { value: "tiptap", label: "Rich Text (TipTap)" },
                          { value: "markdown", label: "Markdown" },
                        ]}
                      />
                      <label className="flex items-center gap-2 text-xs text-brand-300">
                        <input
                          type="checkbox"
                          checked={blogForm.featured}
                          onChange={(e) => setBlogForm({ ...blogForm, featured: e.target.checked })}
                          className="rounded"
                        />
                        Featured post
                      </label>
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-widest text-brand-400 mb-2 block">Cover Image</label>
                        <input
                          id="blog-cover-file-input"
                          type="file"
                          accept="image/*"
                          onChange={(e) => setSelectedBlogCoverFile(e.target.files?.[0] || null)}
                          className="w-full bg-zinc-950/40 border border-white/5 rounded-xl px-4 py-3 text-xs text-white"
                        />
                      </div>
                      <div className="min-h-[300px]">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-brand-400 mb-2 block">Content</label>
                        <BlogEditor
                          value={blogForm.content}
                          onChange={(content) => setBlogForm({ ...blogForm, content })}
                        />
                      </div>
                      <InputField
                        label="Written By"
                        name="writtenBy"
                        value={blogForm.writtenBy}
                        onChange={(e) => setBlogForm({ ...blogForm, writtenBy: e.target.value })}
                      />
                      <button
                        type="submit"
                        disabled={submitting}
                        className="w-full py-3 rounded-xl bg-accent/10 border border-accent/20 text-accent text-xs font-semibold hover:bg-accent/20 transition-all disabled:opacity-50"
                      >
                        {submitting ? "Submitting..." : (editingBlogSlug ? "Update Blog" : "Publish Blog")}
                      </button>
                      {editingBlogSlug && (
                        <button
                          type="button"
                          onClick={() => { setEditingBlogSlug(null); setBlogForm({ slug: "", title: "", seoTitle: "", excerpt: "", date: new Date().toISOString().split("T")[0], readTime: "5 min read", tags: "", featured: false, content: "", writtenBy: "Nishant Kumar", category: "All", contentType: "tiptap" }); }}
                          className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-brand-300 text-xs font-semibold hover:bg-white/10 transition-all"
                        >
                          Cancel Edit
                        </button>
                      )}
                    </form>
                  </div>
                )}

                {/* Manage Blogs Tab */}
                {activeTab === "manage-blogs" && (
                  <div>
                    <h2 className="text-lg font-bold text-white mb-4">Manage Blogs</h2>
                    <div className="space-y-2">
                      {blogs.map((blog) => (
                        <div key={blog.slug} className="glass p-4 rounded-lg">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              {blog.featured && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-accent/10 text-accent">
                                  FEATURED
                                </span>
                              )}
                              <span className="text-[10px] text-brand-500">{blog.category}</span>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => editBlog(blog)}
                                className="text-[10px] text-brand-400 hover:text-white"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => deleteBlog(blog.slug, blog.title)}
                                className="text-[10px] text-red-400 hover:text-red-300"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                          <h3 className="text-sm font-semibold text-white mb-1">{blog.title}</h3>
                          <p className="text-xs text-brand-400 mb-2 line-clamp-2">{blog.excerpt}</p>
                          <div className="flex items-center gap-4 text-[10px] text-brand-500">
                            <span>{blog.date}</span>
                            <span>{blog.readTime}</span>
                          </div>
                        </div>
                      ))}
                      {blogs.length === 0 && (
                        <div className="text-brand-500 text-xs py-8 text-center">No blogs yet</div>
                      )}
                    </div>
                  </div>
                )}

                {/* Gallery Management Tab */}
                {activeTab === "gallery-management" && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-lg font-bold text-white mb-4">Upload Photo</h2>
                      <form onSubmit={handleGallerySubmit} className="space-y-4">
                        <InputField
                          label="Title"
                          name="title"
                          value={galleryForm.title}
                          onChange={(e) => setGalleryForm({ ...galleryForm, title: e.target.value })}
                          placeholder="Photo title"
                          required
                        />
                        <TextAreaField
                          label="Story"
                          name="story"
                          value={galleryForm.story}
                          onChange={(e) => setGalleryForm({ ...galleryForm, story: e.target.value })}
                          placeholder="Photo story/description"
                          rows={2}
                        />
                        <SelectField
                          label="Category"
                          name="category"
                          value={galleryForm.category}
                          onChange={(e) => setGalleryForm({ ...galleryForm, category: e.target.value })}
                          options={[
                            { value: "Daily Moments", label: "Daily Moments" },
                            { value: "School", label: "School" },
                            { value: "College", label: "College" },
                            { value: "Trips", label: "Trips" },
                            { value: "Events", label: "Events" },
                            { value: "Achievements", label: "Achievements" },
                            { value: "Behind The Scenes", label: "Behind The Scenes" },
                          ]}
                          required
                        />
                        <InputField
                          label="Date"
                          name="date"
                          type="date"
                          value={galleryForm.date}
                          onChange={(e) => setGalleryForm({ ...galleryForm, date: e.target.value })}
                          required
                        />
                        <div>
                          <label className="text-[10px] font-bold uppercase tracking-widest text-brand-400 mb-2 block">Image</label>
                          <input
                            id="gallery-image-input"
                            type="file"
                            accept="image/*"
                            onChange={(e) => setSelectedImageFile(e.target.files?.[0] || null)}
                            className="w-full bg-zinc-950/40 border border-white/5 rounded-xl px-4 py-3 text-xs text-white"
                            required
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={submitting}
                          className="w-full py-3 rounded-xl bg-accent/10 border border-accent/20 text-accent text-xs font-semibold hover:bg-accent/20 transition-all disabled:opacity-50"
                        >
                          {submitting ? "Uploading..." : "Upload Photo"}
                        </button>
                      </form>
                    </div>

                    <div>
                      <h3 className="text-sm font-bold text-white mb-3">Gallery Photos</h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {galleryPhotos.map((photo) => (
                          <div key={photo.id} className="glass p-3 rounded-lg">
                            <div className="aspect-square bg-zinc-900 rounded-lg mb-2 overflow-hidden">
                              <img src={photo.imageUrl} alt={photo.title} className="w-full h-full object-cover" />
                            </div>
                            <div className="text-xs font-semibold text-white truncate mb-1">{photo.title}</div>
                            <div className="text-[10px] text-brand-500 mb-2">{photo.category}</div>
                            <button
                              onClick={() => deleteGalleryPhoto(photo.id, photo.title)}
                              className="w-full py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] hover:bg-red-500/20 transition-all"
                            >
                              Delete
                            </button>
                          </div>
                        ))}
                      </div>
                      {galleryPhotos.length === 0 && (
                        <div className="text-brand-500 text-xs py-8 text-center">No photos yet</div>
                      )}
                    </div>
                  </div>
                )}

                {/* Music Settings Tab */}
                {activeTab === "music-settings" && (
                  <div>
                    <h2 className="text-lg font-bold text-white mb-4">Music Corner Settings</h2>
                    <form onSubmit={handleMusicSubmit} className="space-y-4">
                      <InputField
                        label="YouTube Playlist URL"
                        name="playlistUrl"
                        value={musicPlaylistUrl}
                        onChange={(e) => setMusicPlaylistUrl(e.target.value)}
                        placeholder="https://www.youtube.com/playlist?list=..."
                        required
                        hint="Must be a YouTube playlist URL"
                      />
                      {musicSettings && (
                        <div className="glass p-4 rounded-lg">
                          <div className="text-xs text-brand-400 mb-2">Current Settings:</div>
                          <div className="text-xs text-white">{musicSettings.playlistTitle}</div>
                          <div className="text-[10px] text-brand-500">{musicSettings.playlistId}</div>
                        </div>
                      )}
                      <button
                        type="submit"
                        disabled={submitting}
                        className="w-full py-3 rounded-xl bg-accent/10 border border-accent/20 text-accent text-xs font-semibold hover:bg-accent/20 transition-all disabled:opacity-50"
                      >
                        {submitting ? "Updating..." : "Update Settings"}
                      </button>
                    </form>
                  </div>
                )}

                {/* Resume Management Tab */}
                {activeTab === "manage-resume" && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-lg font-bold text-white mb-4">Upload Resume</h2>
                      <form onSubmit={handleResumeSubmit} className="space-y-4">
                        <InputField
                          label="Title"
                          name="title"
                          value={resumeForm.title}
                          onChange={(e) => setResumeForm({ ...resumeForm, title: e.target.value })}
                          placeholder="Resume title (e.g., 'Software Engineer')"
                          required
                        />
                        <div>
                          <label className="text-[10px] font-bold uppercase tracking-widest text-brand-400 mb-2 block">PDF File</label>
                          <input
                            id="resume-file-input"
                            type="file"
                            accept=".pdf"
                            onChange={(e) => setSelectedResumeFile(e.target.files?.[0] || null)}
                            className="w-full bg-zinc-950/40 border border-white/5 rounded-xl px-4 py-3 text-xs text-white"
                            required
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={submitting}
                          className="w-full py-3 rounded-xl bg-accent/10 border border-accent/20 text-accent text-xs font-semibold hover:bg-accent/20 transition-all disabled:opacity-50"
                        >
                          {submitting ? "Uploading..." : "Upload Resume"}
                        </button>
                      </form>
                    </div>

                    <div>
                      <h3 className="text-sm font-bold text-white mb-3">Uploaded Resumes</h3>
                      <div className="space-y-2">
                        {resumes.map((resume) => (
                          <div key={resume.id} className="glass p-4 rounded-lg">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h4 className="text-sm font-semibold text-white">{resume.title}</h4>
                                <div className="text-[10px] text-brand-500">{resume.uploadedAt}</div>
                              </div>
                              <button
                                onClick={() => deleteResume(resume.id, resume.title)}
                                className="text-[10px] text-red-400 hover:text-red-300"
                              >
                                Delete
                              </button>
                            </div>
                            <a
                              href={resume.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-accent hover:underline"
                            >
                              View Resume
                            </a>
                          </div>
                        ))}
                        {resumes.length === 0 && (
                          <div className="text-brand-500 text-xs py-8 text-center">No resumes uploaded</div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Quiz Management Tab */}
                {activeTab === "quiz-management" && (
                  <div>
                    <h2 className="text-lg font-bold text-white mb-4">Quiz Management</h2>
                    <QuizManager
                      quizzes={quizzes}
                      onRefresh={fetchQuizData}
                      showToast={showToast}
                      setConfirm={setConfirm}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Confirm Dialog */}
      {confirm && (
        <ConfirmDialog
          message={confirm.message}
          onConfirm={confirm.onConfirm}
          onCancel={() => setConfirm(null)}
        />
      )}
    </main>
  );
}
