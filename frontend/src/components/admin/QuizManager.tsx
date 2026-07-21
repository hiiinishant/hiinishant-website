"use client";

import { useState } from "react";

const getBackendUrl = () => {
  if (typeof window !== "undefined" && window.location.hostname === "localhost") {
    return "http://localhost:5000";
  }
  return process.env.NEXT_PUBLIC_BACKEND_URL || "https://hiinishant-backend.onrender.com";
};

interface Quiz {
  id: string; // Publish Date
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

interface QuizManagerProps {
  quizzes: Quiz[];
  onRefresh: () => void;
  showToast: (msg: string, type: "success" | "error") => void;
  setConfirm: (confirm: { message: string; onConfirm: () => void } | null) => void;
}

export default function QuizManager({
  quizzes,
  onRefresh,
  showToast,
  setConfirm,
}: QuizManagerProps) {
  // Generate today's date in IST (UTC+5:30) — must match backend's todayKeyIST()
  const todayIST = () =>
    new Date(Date.now() + (5 * 60 + 30) * 60 * 1000).toISOString().slice(0, 10);

  const [form, setForm] = useState({
    id: "",
    subject: "",
    question: "",
    optionA: "",
    optionB: "",
    optionC: "",
    optionD: "",
    correctOption: "A" as "A" | "B" | "C" | "D",
    publishDate: todayIST(),
    status: "draft" as "draft" | "published",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const getAuthHeaders = () => {
    const token = sessionStorage.getItem("admin_token");
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const backendUrl = getBackendUrl();
      
      const payload = {
        id: isEditing ? form.id : undefined,
        subject: form.subject,
        question: form.question,
        optionA: form.optionA,
        optionB: form.optionB,
        optionC: form.optionC,
        optionD: form.optionD,
        correctOption: form.correctOption,
        publishDate: form.publishDate,
        status: form.status,
      };

      const endpoint = `${backendUrl}/api/quiz`;
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(endpoint, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to save quiz");
      }

      showToast(
        isEditing ? "Quiz updated successfully!" : "Quiz created successfully!",
        "success"
      );

      resetForm();
      onRefresh();
    } catch (err: any) {
      showToast(err.message || "Failed to save quiz", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setForm({
      id: "",
      subject: "",
      question: "",
      optionA: "",
      optionB: "",
      optionC: "",
      optionD: "",
      correctOption: "A",
      publishDate: todayIST(),
      status: "draft",
    });
    setIsEditing(false);
  };

  const handleEdit = (quiz: Quiz) => {
    setForm({
      id: quiz.id,
      subject: quiz.subject,
      question: quiz.question,
      optionA: quiz.optionA,
      optionB: quiz.optionB,
      optionC: quiz.optionC,
      optionD: quiz.optionD,
      correctOption: quiz.correctOption,
      publishDate: quiz.publishDate,
      status: quiz.status,
    });
    setIsEditing(true);
  };

  const handleDelete = (id: string) => {
    setConfirm({
      message: `Are you sure you want to delete the quiz scheduled for ${id}?`,
      onConfirm: async () => {
        setConfirm(null);
        try {
          const backendUrl = getBackendUrl();
          const res = await fetch(`${backendUrl}/api/quiz`, {
            method: "DELETE",
            headers: getAuthHeaders(),
            body: JSON.stringify({ id }),
          });

          if (!res.ok) {
            throw new Error("Failed to delete quiz");
          }

          showToast("Quiz deleted successfully.", "success");
          onRefresh();
        } catch (err: any) {
          showToast(err.message || "Failed to delete quiz", "error");
        }
      },
    });
  };

  const handleToggleStatus = async (quiz: Quiz) => {
    try {
      const backendUrl = getBackendUrl();
      const nextStatus = quiz.status === "published" ? "draft" : "published";

      const res = await fetch(`${backendUrl}/api/quiz`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ id: quiz.id, status: nextStatus }),
      });

      if (!res.ok) {
        throw new Error("Failed to update status");
      }

      showToast(`Quiz status updated to ${nextStatus}!`, "success");
      onRefresh();
    } catch (err: any) {
      showToast(err.message || "Failed to toggle status", "error");
    }
  };

  return (
    <div className="space-y-10 animate-fade-in font-mono text-xs text-brand-300">
      {/* ─── QUIZ FORM ─── */}
      <div className="glass-strong border border-white/5 rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 text-[10px] text-brand-600">
          {isEditing ? "EDIT_MODE" : "CREATE_MODE"}
        </div>
        <h2 className="text-sm font-bold text-white mb-6 uppercase tracking-wider">
          {isEditing ? "✏️ Edit Daily Quiz" : "🧠 Create Daily Quiz"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Subject */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-brand-400">
                Subject
              </label>
              <input
                type="text"
                name="subject"
                value={form.subject}
                onChange={handleInputChange}
                placeholder="e.g. GATE CSE, General Knowledge"
                required
                className="bg-zinc-950/40 border border-white/5 rounded-xl px-4 py-3 text-xs text-white placeholder-brand-600 focus:outline-none focus:border-accent/40 transition-all"
              />
            </div>

            {/* Publish Date */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-brand-400">
                Publish Date (IST)
              </label>
              <input
                type="date"
                name="publishDate"
                value={form.publishDate}
                onChange={handleInputChange}
                required
                disabled={isEditing}
                className="bg-zinc-950/40 border border-white/5 rounded-xl px-4 py-3 text-xs text-white placeholder-brand-600 focus:outline-none focus:border-accent/40 transition-all disabled:opacity-50"
              />
              <p className="text-[10px] text-brand-600 font-mono">
                Today in IST: <span className="text-emerald-500">{todayIST()}</span>
                {form.publishDate !== todayIST() && (
                  <span className="text-amber-400 ml-2">⚠ Scheduled for a different day</span>
                )}
              </p>
            </div>
          </div>

          {/* Question */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-brand-400">
              Question Text
            </label>
            <textarea
              name="question"
              value={form.question}
              onChange={handleInputChange}
              placeholder="Enter the quiz question details..."
              required
              rows={3}
              className="bg-zinc-950/40 border border-white/5 rounded-xl px-4 py-3 text-xs text-white placeholder-brand-600 focus:outline-none focus:border-accent/40 transition-all resize-none"
            />
          </div>

          {/* Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {["optionA", "optionB", "optionC", "optionD"].map((opt, i) => {
              const label = `Option ${["A", "B", "C", "D"][i]}`;
              return (
                <div key={opt} className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-brand-400">
                    {label}
                  </label>
                  <input
                    type="text"
                    name={opt}
                    value={(form as any)[opt]}
                    onChange={handleInputChange}
                    placeholder={`Enter value for ${label}`}
                    required
                    className="bg-zinc-950/40 border border-white/5 rounded-xl px-4 py-3 text-xs text-white placeholder-brand-600 focus:outline-none focus:border-accent/40 transition-all"
                  />
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-end">
            {/* Correct Option */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-brand-400">
                Correct Option
              </label>
              <div className="relative">
                <select
                  name="correctOption"
                  value={form.correctOption}
                  onChange={handleInputChange}
                  className="w-full bg-zinc-950/40 border border-white/5 rounded-xl px-4 py-3 pr-10 text-xs text-white focus:outline-none focus:border-accent/40 transition-all appearance-none"
                >
                  <option value="A" className="bg-zinc-900">Option A</option>
                  <option value="B" className="bg-zinc-900">Option B</option>
                  <option value="C" className="bg-zinc-900">Option C</option>
                  <option value="D" className="bg-zinc-900">Option D</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-brand-400 text-[10px]">
                  ▼
                </div>
              </div>
            </div>

            {/* Status */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-brand-400">
                Status
              </label>
              <div className="relative">
                <select
                  name="status"
                  value={form.status}
                  onChange={handleInputChange}
                  className="w-full bg-zinc-950/40 border border-white/5 rounded-xl px-4 py-3 pr-10 text-xs text-white focus:outline-none focus:border-accent/40 transition-all appearance-none"
                >
                  <option value="draft" className="bg-zinc-900">Draft (Invisible)</option>
                  <option value="published" className="bg-zinc-900">Published (Visible on Date)</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-brand-400 text-[10px]">
                  ▼
                </div>
              </div>
            </div>

            {/* Submit / Reset Actions */}
            <div className="flex gap-3">
              {isEditing && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 py-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 text-white font-bold transition-all"
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-3 bg-accent text-black font-bold rounded-xl hover:bg-accent-light transition-all disabled:opacity-50"
              >
                {submitting ? "Saving..." : isEditing ? "Update Quiz" : "Create Quiz"}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* ─── QUIZ SCHEDULE LIST ─── */}
      <div className="glass-strong border border-white/5 rounded-2xl p-6">
        <h2 className="text-sm font-bold text-white mb-6 uppercase tracking-wider">
          📅 Scheduled Quizzes
        </h2>

        {quizzes.length === 0 ? (
          <div className="text-center py-8 text-brand-500">
            No daily quizzes have been created yet.
          </div>
        ) : (
          <div className="space-y-4">
            {quizzes.map((quiz) => (
              <div
                key={quiz.id}
                className="p-4 rounded-xl border border-white/5 bg-zinc-950/20 hover:border-white/10 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-xs">{quiz.publishDate}</span>
                    <span className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-[8px] font-bold text-amber-400 uppercase tracking-widest">
                      {quiz.subject}
                    </span>
                    <span
                      onClick={() => handleToggleStatus(quiz)}
                      className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest cursor-pointer border ${
                        quiz.status === "published"
                          ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                          : "bg-red-500/10 border-red-500/20 text-red-400"
                      }`}
                    >
                      {quiz.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-brand-300 font-semibold">{quiz.question}</p>
                  <div className="grid grid-cols-2 gap-2 text-[10px] text-brand-500">
                    <div>A: {quiz.optionA}</div>
                    <div>B: {quiz.optionB}</div>
                    <div>C: {quiz.optionC}</div>
                    <div>D: {quiz.optionD}</div>
                  </div>
                  <div className="text-[10px] text-emerald-500 font-bold">
                    Correct Option: {quiz.correctOption}
                  </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0 self-end md:self-center">
                  <button
                    onClick={() => handleEdit(quiz)}
                    className="p-2 border border-white/5 bg-white/3 rounded-lg text-white hover:bg-white/10 hover:border-white/20 transition-all"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(quiz.id)}
                    className="p-2 border border-red-500/10 bg-red-500/5 text-red-400 rounded-lg hover:bg-red-500/10 transition-all font-bold"
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
  );
}
