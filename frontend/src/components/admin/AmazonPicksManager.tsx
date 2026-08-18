"use client";

import { useState, useEffect, useRef } from "react";
import type { AmazonPick, StudyPick } from "@/types";
import { API_BASE, LIVE_BACKEND_URL } from "@/lib/api";

const getBackendUrl = () => {
  if (process.env.NEXT_PUBLIC_BACKEND_URL) return process.env.NEXT_PUBLIC_BACKEND_URL;
  if (typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")) {
    return "http://localhost:5000";
  }
  return API_BASE || LIVE_BACKEND_URL;
};

const DEFAULT_CATEGORIES = [
  "Tech & Desk Setup",
  "Study Essentials",
  "Books & Learning",
  "Audio & Accessories",
  "Productivity & Tools",
  "Lifestyle & Health",
  "Beauty",
];

interface AmazonPicksManagerProps {
  onShowToast: (message: string, type: "success" | "error") => void;
}

export default function AmazonPicksManager({ onShowToast }: AmazonPicksManagerProps) {
  const [activeTab, setActiveTab] = useState<"amazon" | "2amstudy">("amazon");

  // Amazon Picks State
  const [picks, setPicks] = useState<AmazonPick[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("All");

  // Minimal Add Form state: Paste Link → Select Category → Add
  const [linkInput, setLinkInput] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Tech & Desk Setup");
  const [customCategory, setCustomCategory] = useState("");
  const [titleInput, setTitleInput] = useState("");
  const [imageInput, setImageInput] = useState("");
  const [imageVerified, setImageVerified] = useState<boolean | null>(null);
  const [priceInput, setPriceInput] = useState("");
  const [descriptionInput, setDescriptionInput] = useState("");
  const [statusSelect, setStatusSelect] = useState<"In Stock" | "Out of Stock" | "Featured">("In Stock");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // 2 AM Study Picks State
  const [studyPicks, setStudyPicks] = useState<StudyPick[]>([]);
  const [loadingStudy, setLoadingStudy] = useState(true);
  const [studyResolving, setStudyResolving] = useState(false);
  const [studyUploadingImage, setStudyUploadingImage] = useState(false);
  const [studySubmitting, setStudySubmitting] = useState(false);
  const [studySearchQuery, setStudySearchQuery] = useState("");
  const [studySelectedCategoryFilter, setStudySelectedCategoryFilter] = useState("All");

  // 2 AM Study Add/Edit Form State
  const [studyLinkInput, setStudyLinkInput] = useState("");
  const [studySelectedCategory, setStudySelectedCategory] = useState("2 AM Study");
  const [studyCustomCategory, setStudyCustomCategory] = useState("");
  const [studyTitleInput, setStudyTitleInput] = useState("");
  const [studyImageInput, setStudyImageInput] = useState("");
  const [studyImageVerified, setStudyImageVerified] = useState<boolean | null>(null);
  const [studyPriceInput, setStudyPriceInput] = useState("");
  const [studyDescriptionInput, setStudyDescriptionInput] = useState("");
  const [studyStatusSelect, setStudyStatusSelect] = useState<"In Stock" | "Out of Stock" | "Featured">("In Stock");
  const [studyEditingId, setStudyEditingId] = useState<string | null>(null);
  const [studyShowAdvanced, setStudyShowAdvanced] = useState(false);

  const studyFileInputRef = useRef<HTMLInputElement>(null);

  // Fetch picks on mount
  const fetchPicks = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${getBackendUrl()}/api/amazon-picks`);
      if (res.ok) {
        const data = await res.json();
        setPicks(data || []);
      }
    } catch (err) {
      console.error("Failed to fetch amazon picks:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudyPicks = async () => {
    try {
      setLoadingStudy(true);
      const res = await fetch(`${getBackendUrl()}/api/study-picks`);
      if (res.ok) {
        const data = await res.json();
        setStudyPicks(data || []);
      }
    } catch (err) {
      console.error("Failed to fetch study picks:", err);
    } finally {
      setLoadingStudy(false);
    }
  };

  useEffect(() => {
    fetchPicks();
    fetchStudyPicks();
  }, []);

  // Auto-preview when Amazon link is entered
  const handleUrlBlurOrChange = async (url: string) => {
    const trimmed = url.trim();
    setLinkInput(trimmed);
    if (!trimmed || trimmed.length < 8) return;

    try {
      setResolving(true);
      const res = await fetch(`${getBackendUrl()}/api/amazon-picks/preview`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: trimmed }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.suggestedTitle && (!titleInput || titleInput.startsWith("Amazon Product"))) {
          setTitleInput(data.suggestedTitle);
        }
        if (data.suggestedImage && !imageInput) {
          setImageInput(data.suggestedImage);
        }
        setImageVerified(!!data.isImageVerified);
      }
    } catch (err) {
      console.warn("Auto-preview failed, fallback remains active:", err);
    } finally {
      setResolving(false);
    }
  };

  // Direct Image File Upload via Cloudinary
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingImage(true);
      const token = sessionStorage.getItem("admin_token");
      const formData = new FormData();
      formData.append("image", file);

      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`${getBackendUrl()}/api/amazon-picks/upload-image`, {
        method: "POST",
        headers,
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Failed to upload image");
      }

      const data = await res.json();
      if (data.imageUrl) {
        setImageInput(data.imageUrl);
        setImageVerified(true);
        onShowToast("Custom image uploaded successfully!", "success");
      }
    } catch (err: any) {
      onShowToast(err.message || "Image upload failed", "error");
    } finally {
      setUploadingImage(false);
    }
  };

  const resetForm = () => {
    setLinkInput("");
    setTitleInput("");
    setImageInput("");
    setImageVerified(null);
    setPriceInput("");
    setDescriptionInput("");
    setStatusSelect("In Stock");
    setEditingId(null);
    setCustomCategory("");
    setShowAdvanced(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkInput.trim()) {
      onShowToast("Please paste an Amazon affiliate/product link", "error");
      return;
    }

    const finalCategory = customCategory.trim() || selectedCategory;

    setSubmitting(true);
    try {
      const token = sessionStorage.getItem("admin_token");
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const payload = {
        affiliateUrl: linkInput.trim(),
        category: finalCategory,
        title: titleInput.trim() || "Amazon Pick",
        imageUrl: imageInput.trim(),
        price: priceInput.trim(),
        description: descriptionInput.trim(),
        isFeatured: statusSelect === "Featured",
        inStock: statusSelect !== "Out of Stock",
      };

      let res: Response;
      if (editingId) {
        res = await fetch(`${getBackendUrl()}/api/amazon-picks/${editingId}`, {
          method: "PUT",
          headers,
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch(`${getBackendUrl()}/api/amazon-picks`, {
          method: "POST",
          headers,
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save product");
      }

      onShowToast(editingId ? "Product updated successfully!" : "Product added to Nishant's Picks!", "success");
      resetForm();
      fetchPicks();
    } catch (err: any) {
      onShowToast(err.message || "Failed to save Amazon pick", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // Unified cycle handler for Amazon card badge (In Stock → Out of Stock → Featured → In Stock)
  const handleCycleAmazonStatus = async (pick: AmazonPick) => {
    const currentStatus = pick.isFeatured ? "Featured" : pick.inStock === false ? "Out of Stock" : "In Stock";
    const next: Record<string, { isFeatured: boolean; inStock: boolean; label: string }> = {
      "In Stock":     { isFeatured: false, inStock: false, label: "❌ Marked Out of Stock" },
      "Out of Stock": { isFeatured: true,  inStock: true,  label: "⭐ Marked as Featured" },
      "Featured":     { isFeatured: false, inStock: true,  label: "✅ Marked In Stock" },
    };
    const { isFeatured: newFeatured, inStock: newInStock, label } = next[currentStatus];
    try {
      const token = sessionStorage.getItem("admin_token");
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      setPicks((prev) => prev.map((p) => p.id === pick.id ? { ...p, isFeatured: newFeatured, inStock: newInStock } : p));
      const res = await fetch(`${getBackendUrl()}/api/amazon-picks/${pick.id}`, {
        method: "PUT", headers,
        body: JSON.stringify({ isFeatured: newFeatured, inStock: newInStock }),
      });
      if (!res.ok) { fetchPicks(); throw new Error("Failed to update"); }
      onShowToast(label, "success");
    } catch (err: any) {
      onShowToast(err.message || "Failed to update status", "error");
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) return;

    try {
      const token = sessionStorage.getItem("admin_token");
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      setPicks((prev) => prev.filter((p) => p.id !== id));

      const res = await fetch(`${getBackendUrl()}/api/amazon-picks/${id}`, {
        method: "DELETE",
        headers,
      });

      if (!res.ok) {
        fetchPicks();
        throw new Error("Failed to delete product");
      }
      onShowToast("Product deleted successfully", "success");
    } catch (err: any) {
      onShowToast(err.message || "Failed to delete product", "error");
    }
  };

  const handleStartEdit = (pick: AmazonPick) => {
    setEditingId(pick.id);
    setLinkInput(pick.affiliateUrl);
    setSelectedCategory(DEFAULT_CATEGORIES.includes(pick.category) ? pick.category : "Custom");
    if (!DEFAULT_CATEGORIES.includes(pick.category)) setCustomCategory(pick.category);
    setTitleInput(pick.title);
    setImageInput(pick.imageUrl || "");
    setImageVerified(!!pick.imageUrl);
    setPriceInput(pick.price || "");
    setDescriptionInput(pick.description || "");
    // Derive unified status
    setStatusSelect(pick.isFeatured ? "Featured" : pick.inStock === false ? "Out of Stock" : "In Stock");
    setShowAdvanced(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ─── 2 AM Study Handlers ──────────────────────────────────────────────────
  const handleStudyUrlBlurOrChange = async (url: string) => {
    const trimmed = url.trim();
    setStudyLinkInput(trimmed);
    if (!trimmed || trimmed.length < 8) return;

    try {
      setStudyResolving(true);
      const res = await fetch(`${getBackendUrl()}/api/study-picks/preview`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: trimmed }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.title && (!studyTitleInput || studyTitleInput.startsWith("2 AM Study Product"))) {
          setStudyTitleInput(data.title);
        }
        if (data.imageUrl && !studyImageInput) {
          setStudyImageInput(data.imageUrl);
          setStudyImageVerified(true);
        }
        if (data.price && !studyPriceInput) {
          setStudyPriceInput(data.price);
        }
        if (data.description && !studyDescriptionInput) {
          setStudyDescriptionInput(data.description);
        }
        setStudyImageVerified(!!data.imageUrl);
      }
    } catch (err) {
      console.warn("Auto-preview failed:", err);
    } finally {
      setStudyResolving(false);
    }
  };

  const handleStudyFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setStudyUploadingImage(true);
      const token = sessionStorage.getItem("admin_token");
      const formData = new FormData();
      formData.append("image", file);

      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`${getBackendUrl()}/api/amazon-picks/upload-image`, {
        method: "POST",
        headers,
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Failed to upload image");
      }

      const data = await res.json();
      if (data.imageUrl) {
        setStudyImageInput(data.imageUrl);
        setStudyImageVerified(true);
        onShowToast("Custom image uploaded successfully!", "success");
      }
    } catch (err: any) {
      onShowToast(err.message || "Image upload failed", "error");
    } finally {
      setStudyUploadingImage(false);
    }
  };

  const resetStudyForm = () => {
    setStudyLinkInput("");
    setStudyTitleInput("");
    setStudyImageInput("");
    setStudyImageVerified(null);
    setStudyPriceInput("");
    setStudyDescriptionInput("");
    setStudyStatusSelect("In Stock");
    setStudyEditingId(null);
    setStudyCustomCategory("");
    setStudyShowAdvanced(false);
    if (studyFileInputRef.current) studyFileInputRef.current.value = "";
  };

  const handleSaveStudyProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studyLinkInput.trim()) {
      onShowToast("Please paste a 2 AM Study product URL", "error");
      return;
    }

    const finalCategory = studyCustomCategory.trim() || studySelectedCategory;

    setStudySubmitting(true);
    try {
      const token = sessionStorage.getItem("admin_token");
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const payload = {
        productUrl: studyLinkInput.trim(),
        category: finalCategory,
        title: studyTitleInput.trim() || "2 AM Study Product",
        imageUrl: studyImageInput.trim(),
        price: studyPriceInput.trim(),
        description: studyDescriptionInput.trim(),
        isFeatured: studyStatusSelect === "Featured",
        availability: studyStatusSelect === "Out of Stock" ? "Out of Stock" : "In Stock",
        displayOrder: studyPicks.length,
      };

      let res: Response;
      if (studyEditingId) {
        res = await fetch(`${getBackendUrl()}/api/study-picks/${studyEditingId}`, {
          method: "PUT",
          headers,
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch(`${getBackendUrl()}/api/study-picks`, {
          method: "POST",
          headers,
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save product");
      }

      onShowToast(studyEditingId ? "2 AM Study product updated!" : "Product added to 2 AM Study Picks!", "success");
      resetStudyForm();
      fetchStudyPicks();
    } catch (err: any) {
      onShowToast(err.message || "Failed to save 2 AM Study pick", "error");
    } finally {
      setStudySubmitting(false);
    }
  };

  const handleStartStudyEdit = (pick: StudyPick) => {
    setStudyEditingId(pick.id);
    setStudyLinkInput(pick.productUrl);
    const cat = pick.category || "2 AM Study";
    const allStudyCats = ["2 AM Study", ...DEFAULT_CATEGORIES];
    setStudySelectedCategory(allStudyCats.includes(cat) ? cat : "Custom");
    if (!allStudyCats.includes(cat)) setStudyCustomCategory(cat);
    setStudyTitleInput(pick.title);
    setStudyImageInput(pick.imageUrl || "");
    setStudyImageVerified(!!pick.imageUrl);
    setStudyPriceInput(pick.price || "");
    setStudyDescriptionInput(pick.description || "");
    // Derive unified status
    setStudyStatusSelect(pick.isFeatured ? "Featured" : pick.availability === "Out of Stock" ? "Out of Stock" : "In Stock");
    setStudyShowAdvanced(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Unified cycle handler for Study card badge (In Stock → Out of Stock → Featured → In Stock)
  const handleCycleStudyStatus = async (pick: StudyPick) => {
    const currentStatus = pick.isFeatured ? "Featured" : pick.availability === "Out of Stock" ? "Out of Stock" : "In Stock";
    const next: Record<string, { isFeatured: boolean; availability: string; label: string }> = {
      "In Stock":     { isFeatured: false, availability: "Out of Stock", label: "❌ Marked Out of Stock" },
      "Out of Stock": { isFeatured: true,  availability: "In Stock",    label: "⭐ Marked as Featured" },
      "Featured":     { isFeatured: false, availability: "In Stock",    label: "✅ Marked In Stock" },
    };
    const { isFeatured: newFeatured, availability: newAvail, label } = next[currentStatus];
    try {
      const token = sessionStorage.getItem("admin_token");
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      setStudyPicks((prev) => prev.map((p) => p.id === pick.id ? { ...p, isFeatured: newFeatured, availability: newAvail } : p));
      const res = await fetch(`${getBackendUrl()}/api/study-picks/${pick.id}`, {
        method: "PUT", headers,
        body: JSON.stringify({ isFeatured: newFeatured, availability: newAvail }),
      });
      if (!res.ok) { fetchStudyPicks(); throw new Error("Failed to update"); }
      onShowToast(label, "success");
    } catch (err: any) {
      onShowToast(err.message || "Failed to update status", "error");
    }
  };

  const handleDeleteStudyPick = async (id: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) return;
    try {
      const token = sessionStorage.getItem("admin_token");
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;
      setStudyPicks((prev) => prev.filter((p) => p.id !== id));
      const res = await fetch(`${getBackendUrl()}/api/study-picks/${id}`, { method: "DELETE", headers });
      if (!res.ok) { fetchStudyPicks(); throw new Error("Failed to delete"); }
      onShowToast("2 AM Study pick deleted successfully", "success");
    } catch (err: any) {
      onShowToast(err.message || "Failed to delete pick", "error");
    }
  };

  const filteredPicks = picks.filter((pick) => {
    const matchesCat = selectedCategoryFilter === "All" || pick.category === selectedCategoryFilter;
    const matchesSearch = !searchQuery.trim() ||
      pick.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pick.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const filteredStudyPicks = studyPicks.filter((pick) => {
    const pickCat = pick.category || "2 AM Study";
    const matchesCat = studySelectedCategoryFilter === "All" || pickCat === studySelectedCategoryFilter;
    const matchesSearch = !studySearchQuery.trim() ||
      pick.title.toLowerCase().includes(studySearchQuery.toLowerCase()) ||
      pickCat.toLowerCase().includes(studySearchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="space-y-8 font-sans">
      {/* ─── TOP TAB SELECTOR ─── */}
      <div className="flex items-center gap-3 border-b border-white/10 pb-4">
        <button
          type="button"
          onClick={() => setActiveTab("amazon")}
          className={`px-5 py-3 rounded-2xl font-bold text-sm transition-all duration-300 flex items-center gap-2 ${
            activeTab === "amazon"
              ? "bg-amber-500 text-black shadow-[0_0_25px_rgba(245,158,11,0.3)] scale-[1.02]"
              : "bg-white/5 text-brand-300 hover:text-white hover:bg-white/10"
          }`}
        >
          <span>🛍️</span>
          <span>Amazon Picks ({picks.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("2amstudy")}
          className={`px-5 py-3 rounded-2xl font-bold text-sm transition-all duration-300 flex items-center gap-2 ${
            activeTab === "2amstudy"
              ? "bg-amber-500 text-black shadow-[0_0_25px_rgba(245,158,11,0.3)] scale-[1.02]"
              : "bg-white/5 text-brand-300 hover:text-white hover:bg-white/10"
          }`}
        >
          <span>📚</span>
          <span>2 AM Study Picks ({studyPicks.length})</span>
        </button>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* TAB 1: 🛍️ AMAZON PICKS                                              */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeTab === "amazon" && (
        <div className="space-y-8 animate-fade-in">
          {/* ─── ADD / EDIT PRODUCT CARD (Minimal 3-Step Workflow) ─── */}
          <div className="glass-strong border border-white/10 rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-mono uppercase tracking-widest mb-2 font-bold">
                  🛍️ Amazon Affiliate & Influencer Hub
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  {editingId ? "Edit Amazon Recommendation" : "Add Product to Nishant's Picks"}
                </h2>
                <p className="text-xs text-brand-400 mt-1">
                  Minimal Workflow: <span className="text-amber-400 font-semibold">Paste Link → Select Category → Add Product</span>.
                </p>
              </div>

              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-3.5 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-brand-300 hover:text-white transition-colors"
                >
                  Cancel Edit
                </button>
              )}
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-5">
              {/* Step 1 & 2: Link & Category Inputs */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                {/* Amazon Affiliate Link */}
                <div className="md:col-span-8 space-y-1.5">
                  <label className="text-xs font-mono text-brand-400 uppercase tracking-wider flex items-center justify-between">
                    <span>1. Paste Amazon / Affiliate Link *</span>
                    {resolving && (
                      <span className="text-amber-400 text-[10px] animate-pulse flex items-center gap-1 font-sans">
                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                        Resolving link info...
                      </span>
                    )}
                  </label>
                  <div className="relative">
                    <input
                      type="url"
                      required
                      placeholder="https://amzn.to/3xyz or https://www.amazon.in/dp/B0..."
                      value={linkInput}
                      onChange={(e) => setLinkInput(e.target.value)}
                      onBlur={(e) => handleUrlBlurOrChange(e.target.value)}
                      className="w-full bg-zinc-950/80 border border-white/10 rounded-2xl px-4 py-3.5 text-sm text-white placeholder-brand-600 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-all font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => handleUrlBlurOrChange(linkInput)}
                      disabled={resolving || !linkInput}
                      className="absolute right-2.5 top-2.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-mono text-brand-300 hover:text-white border border-white/5 transition-colors disabled:opacity-30"
                      title="Auto-fetch info from link"
                    >
                      ⚡ Preview
                    </button>
                  </div>
                </div>

                {/* Category Selector */}
                <div className="md:col-span-4 space-y-1.5">
                  <label className="text-xs font-mono text-brand-400 uppercase tracking-wider">
                    2. Category *
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full bg-zinc-950/80 border border-white/10 rounded-2xl px-4 py-3.5 text-sm text-white focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-all cursor-pointer"
                  >
                    {DEFAULT_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat} className="bg-zinc-900 text-white">
                        {cat}
                      </option>
                    ))}
                    <option value="Custom" className="bg-zinc-900 text-amber-400">+ Custom Category...</option>
                  </select>
                </div>
              </div>

              {/* Custom Category Input if selected */}
              {selectedCategory === "Custom" && (
                <div className="space-y-1.5 animate-fade-in">
                  <label className="text-xs font-mono text-amber-400 uppercase tracking-wider">
                    Enter Custom Category Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Video & Camera Gear"
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    className="w-full bg-zinc-950/80 border border-amber-500/30 rounded-2xl px-4 py-3 text-sm text-white placeholder-brand-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20"
                  />
                </div>
              )}

              {/* Title & Price Row */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                {/* Product Title */}
                <div className="md:col-span-8 space-y-1.5">
                  <label className="text-xs font-mono text-brand-400 uppercase tracking-wider flex items-center justify-between">
                    <span>Product Name / Title</span>
                    <span className="text-[10px] text-brand-500 lowercase">(auto-filled or customize)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Logitech MX Master 3S Wireless Mouse"
                    value={titleInput}
                    onChange={(e) => setTitleInput(e.target.value)}
                    className="w-full bg-zinc-950/80 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder-brand-600 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-all font-medium"
                  />
                </div>

                {/* Price (optional — never guessed) */}
                <div className="md:col-span-4 space-y-1.5">
                  <label className="text-xs font-mono text-brand-400 uppercase tracking-wider flex items-center justify-between">
                    <span>Price (Optional)</span>
                    <span className="text-[10px] text-brand-500 lowercase">Leave blank to hide</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. ₹7,995 or $99"
                    value={priceInput}
                    onChange={(e) => setPriceInput(e.target.value)}
                    className="w-full bg-zinc-950/80 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder-brand-600 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 font-mono"
                  />
                </div>
              </div>

              {/* Image URL & Upload Options with Verification Indicator */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                <div className="md:col-span-8 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-mono text-brand-400 uppercase tracking-wider flex items-center gap-2">
                      <span>Product Image URL</span>
                      {imageVerified === true && (
                        <span className="text-emerald-400 text-[10px] font-mono font-normal">✓ Verified</span>
                      )}
                      {imageVerified === false && (
                        <span className="text-amber-400 text-[10px] font-mono font-normal">⚠️ CDN image unverified (use custom or upload below)</span>
                      )}
                    </label>
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="https://images-na.ssl-images-amazon.com/images/... or custom image URL"
                      value={imageInput}
                      onChange={(e) => {
                        setImageInput(e.target.value);
                        setImageVerified(null);
                      }}
                      className="w-full bg-zinc-950/80 border border-white/10 rounded-2xl px-4 py-3 text-xs text-brand-300 placeholder-brand-600 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 font-mono"
                    />

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingImage}
                      className="px-3.5 py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-xs font-mono text-brand-300 hover:text-white border border-white/10 transition-colors shrink-0 flex items-center gap-1.5"
                      title="Upload image from computer"
                    >
                      {uploadingImage ? "⏳ Uploading..." : "📁 Upload"}
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </div>
                </div>

                {/* Live Image Preview Thumbnail */}
                <div className="md:col-span-4 flex items-center gap-3 pt-6 sm:pt-0">
                  <div className="w-16 h-16 rounded-2xl bg-zinc-950/80 border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                    {imageInput ? (
                      <img
                        src={imageInput}
                        alt="Product preview"
                        className="w-full h-full object-contain p-1"
                        onError={() => setImageVerified(false)}
                        onLoad={() => setImageVerified(true)}
                      />
                    ) : (
                      <span className="text-xl">📦</span>
                    )}
                  </div>
                  <div className="text-xs text-brand-400">
                    <p className="font-semibold text-white truncate max-w-[150px]">{titleInput || "Product Title"}</p>
                    <p className="text-[10px] text-brand-500">{imageInput ? "Ready to save" : "Paste link to auto-fill"}</p>
                  </div>
                </div>
              </div>

              {/* Optional: Why Nishant Uses It / Recommendation Note */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="text-xs font-mono text-brand-400 hover:text-white flex items-center gap-1.5 transition-colors"
                >
                  <span>{showAdvanced ? "▼" : "▶"}</span>
                  <span>{showAdvanced ? "Hide Recommendation Note" : "+ Add Why Nishant Uses It / Description"}</span>
                </button>

                {showAdvanced && (
                  <div className="mt-3 space-y-1.5 animate-fade-in">
                    <textarea
                      rows={2}
                      placeholder="e.g. The best ergonomic mouse I've used for late night coding sessions. Battery lasts weeks."
                      value={descriptionInput}
                      onChange={(e) => setDescriptionInput(e.target.value)}
                      className="w-full bg-zinc-950/80 border border-white/10 rounded-2xl p-4 text-xs text-white placeholder-brand-600 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-all leading-relaxed"
                    />
                  </div>
                )}
              </div>

              {/* Status Selector + Submit */}
              <div className="pt-4 border-t border-white/10 space-y-4">
                <div className="flex items-center gap-3">
                  <label className="text-xs font-mono text-brand-400 uppercase tracking-wider shrink-0">Card Status</label>
                  <select
                    value={statusSelect}
                    onChange={(e) => setStatusSelect(e.target.value as "In Stock" | "Out of Stock" | "Featured")}
                    className="bg-zinc-950/80 border border-white/10 rounded-xl px-3 py-2 text-sm text-white font-semibold focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-all cursor-pointer"
                  >
                    <option value="In Stock">✅ In Stock</option>
                    <option value="Out of Stock">❌ Out of Stock</option>
                    <option value="Featured">⭐ Featured on Homepage</option>
                  </select>
                </div>

                <div className="flex items-center justify-end gap-3">
                  {editingId && (
                    <button
                      type="button"
                      onClick={resetForm}
                      className="px-5 py-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-brand-300 hover:text-white transition-colors"
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-7 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs uppercase tracking-wider shadow-[0_0_25px_rgba(245,158,11,0.3)] hover:shadow-[0_0_35px_rgba(245,158,11,0.5)] transition-all duration-300 flex items-center gap-2 disabled:opacity-50 hover:-translate-y-0.5"
                  >
                    <span>{editingId ? "💾" : "🛍️"}</span>
                    <span>{submitting ? "Saving..." : editingId ? "Save Changes" : "Add to Nishant's Picks"}</span>
                  </button>
                </div>
              </div>

            </form>
          </div>

          {/* ─── MANAGE EXISTING AMAZON PICKS LIST ─── */}
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <span>📦</span>
                  <span>All Recommended Products ({picks.length})</span>
                </h3>
                <p className="text-xs text-brand-400 mt-0.5">
                  Live on website at <code className="text-amber-400 font-mono">/amazon-feed</code> storefront.
                </p>
              </div>

              {/* Search and Category Filter */}
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-zinc-950/80 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white placeholder-brand-600 focus:outline-none focus:border-amber-500/40 w-40 sm:w-48"
                />

                <select
                  value={selectedCategoryFilter}
                  onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                  className="bg-zinc-950/80 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500/40"
                >
                  <option value="All">All Categories</option>
                  {Array.from(new Set(picks.map((p) => p.category).filter(Boolean))).map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {loading ? (
              <div className="h-48 flex items-center justify-center border border-white/5 rounded-3xl bg-zinc-950/30">
                <div className="w-6 h-6 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
              </div>
            ) : filteredPicks.length === 0 ? (
              <div className="p-12 text-center border border-white/5 rounded-3xl bg-zinc-950/30 space-y-3">
                <span className="text-4xl">🛍️</span>
                <h4 className="text-base font-bold text-white">No products found</h4>
                <p className="text-xs text-brand-400">
                  {picks.length === 0 ? "Paste a link above to add your first recommendation." : "No products matched your search."}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredPicks.map((pick) => (
                  <div
                    key={pick.id}
                    className={`glass border rounded-2xl p-4 flex flex-col justify-between transition-all duration-300 relative group hover:border-amber-500/30 ${
                      pick.isFeatured ? "border-amber-500/30 bg-amber-500/[0.03]" : "border-white/5 bg-zinc-950/40"
                    }`}
                  >
                    <div>
                      {/* Card Top: Category, Stock Badge & Featured Tag */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-mono text-brand-400 uppercase tracking-wider font-semibold">
                          {pick.category}
                        </span>

                        {/* Single smart status badge — top-right, click cycles status */}
                        {pick.isFeatured ? (
                          <button
                            type="button"
                            onClick={() => handleCycleAmazonStatus(pick)}
                            className="px-2 py-0.5 rounded-full text-[10px] font-bold border transition-all flex items-center gap-1 bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.2)] hover:bg-amber-500/30"
                            title="Click to cycle status"
                          >
                            <span>⭐</span>
                            <span>Featured</span>
                          </button>
                        ) : pick.inStock === false ? (
                          <button
                            type="button"
                            onClick={() => handleCycleAmazonStatus(pick)}
                            className="px-2 py-0.5 rounded-full text-[10px] font-bold border transition-all flex items-center gap-1 bg-red-500/15 text-red-400 border-red-500/30 hover:bg-red-500/25"
                            title="Click to cycle status"
                          >
                            <span>❌</span>
                            <span>Out of Stock</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleCycleAmazonStatus(pick)}
                            className="px-2 py-0.5 rounded-full text-[10px] font-bold border transition-all flex items-center gap-1 bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25"
                            title="Click to cycle status"
                          >
                            <span>✅</span>
                            <span>In Stock</span>
                          </button>
                        )}
                      </div>

                      {/* Product Thumbnail & Details */}
                      <div className="flex gap-3 mb-3">
                        <div className="w-16 h-16 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden shrink-0 p-1">
                          {pick.imageUrl ? (
                            <img
                              src={pick.imageUrl}
                              alt={pick.title}
                              className="w-full h-full object-contain"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = "none";
                              }}
                            />
                          ) : (
                            <span className="text-xl">🛍️</span>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-bold text-white line-clamp-2 leading-snug group-hover:text-amber-300 transition-colors">
                            {pick.title}
                          </h4>
                          {pick.price ? (
                            <p className="text-xs font-mono font-bold text-amber-400 mt-1">
                              {pick.price}
                            </p>
                          ) : (
                            <p className="text-[10px] text-brand-500 mt-1 italic">Price not listed</p>
                          )}
                        </div>
                      </div>

                      {pick.description && (
                        <p className="text-xs text-brand-400 line-clamp-2 italic border-l-2 border-amber-500/30 pl-2 mb-3">
                          &ldquo;{pick.description}&rdquo;
                        </p>
                      )}
                    </div>

                    {/* Actions: Edit, Live Link, Delete */}
                    <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => handleStartEdit(pick)}
                          className="text-brand-300 hover:text-amber-400 transition-colors font-medium flex items-center gap-1 text-[11px]"
                        >
                          <span>✏️</span>
                          <span>Edit</span>
                        </button>

                        <a
                          href={pick.affiliateUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-brand-400 hover:text-white transition-colors text-[11px]"
                          title="Open affiliate link"
                        >
                          View ↗
                        </a>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDelete(pick.id, pick.title)}
                        className="px-2.5 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-colors text-[11px]"
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

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* TAB 2: 📚 2 AM STUDY PICKS (Rich Full Workflow matching Amazon Hub) */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeTab === "2amstudy" && (
        <div className="space-y-8 animate-fade-in">
          {/* ─── ADD / EDIT 2 AM STUDY PRODUCT CARD ─── */}
          <div className="glass-strong border border-white/10 rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-mono uppercase tracking-widest mb-2 font-bold">
                  📚 2 AM Study Official Storefront
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  {studyEditingId ? "Edit 2 AM Study Recommendation" : "Add Product to 2 AM Study Picks"}
                </h2>
                <p className="text-xs text-brand-400 mt-1">
                  Minimal Workflow: <span className="text-amber-400 font-semibold">Paste Link → Select Category → Add Product</span>.
                </p>
              </div>

              {studyEditingId && (
                <button
                  type="button"
                  onClick={resetStudyForm}
                  className="px-3.5 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-brand-300 hover:text-white transition-colors"
                >
                  Cancel Edit
                </button>
              )}
            </div>

            <form onSubmit={handleSaveStudyProduct} className="space-y-5">
              {/* Step 1 & 2: Link & Category Inputs */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                {/* 2 AM Study Link */}
                <div className="md:col-span-8 space-y-1.5">
                  <label className="text-xs font-mono text-brand-400 uppercase tracking-wider flex items-center justify-between">
                    <span>1. Paste 2 AM Study / Store Link *</span>
                    {studyResolving && (
                      <span className="text-amber-400 text-[10px] animate-pulse flex items-center gap-1 font-sans">
                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                        Resolving product info...
                      </span>
                    )}
                  </label>
                  <div className="relative">
                    <input
                      type="url"
                      required
                      placeholder="https://2amstudy.com/products/notebook or store URL..."
                      value={studyLinkInput}
                      onChange={(e) => setStudyLinkInput(e.target.value)}
                      onBlur={(e) => handleStudyUrlBlurOrChange(e.target.value)}
                      className="w-full bg-zinc-950/80 border border-white/10 rounded-2xl px-4 py-3.5 text-sm text-white placeholder-brand-600 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-all font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => handleStudyUrlBlurOrChange(studyLinkInput)}
                      disabled={studyResolving || !studyLinkInput}
                      className="absolute right-2.5 top-2.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-mono text-brand-300 hover:text-white border border-white/5 transition-colors disabled:opacity-30"
                      title="Auto-fetch info from link"
                    >
                      ⚡ Preview
                    </button>
                  </div>
                </div>

                {/* Category Selector */}
                <div className="md:col-span-4 space-y-1.5">
                  <label className="text-xs font-mono text-brand-400 uppercase tracking-wider">
                    2. Category *
                  </label>
                  <select
                    value={studySelectedCategory}
                    onChange={(e) => setStudySelectedCategory(e.target.value)}
                    className="w-full bg-zinc-950/80 border border-white/10 rounded-2xl px-4 py-3.5 text-sm text-white focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-all cursor-pointer"
                  >
                    <option value="2 AM Study" className="bg-zinc-900 text-amber-400 font-bold">📚 2 AM Study</option>
                    {DEFAULT_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat} className="bg-zinc-900 text-white">
                        {cat}
                      </option>
                    ))}
                    <option value="Custom" className="bg-zinc-900 text-amber-400">+ Custom Category...</option>
                  </select>
                </div>
              </div>

              {/* Custom Category Input if selected */}
              {studySelectedCategory === "Custom" && (
                <div className="space-y-1.5 animate-fade-in">
                  <label className="text-xs font-mono text-amber-400 uppercase tracking-wider">
                    Enter Custom Category Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. GATE Prep Resources"
                    value={studyCustomCategory}
                    onChange={(e) => setStudyCustomCategory(e.target.value)}
                    className="w-full bg-zinc-950/80 border border-amber-500/30 rounded-2xl px-4 py-3 text-sm text-white placeholder-brand-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20"
                  />
                </div>
              )}

              {/* Title & Price Row */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                {/* Product Title */}
                <div className="md:col-span-8 space-y-1.5">
                  <label className="text-xs font-mono text-brand-400 uppercase tracking-wider flex items-center justify-between">
                    <span>Product Name / Title</span>
                    <span className="text-[10px] text-brand-500 lowercase">(auto-filled or customize)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 2 AM Study Smart Notebook"
                    value={studyTitleInput}
                    onChange={(e) => setStudyTitleInput(e.target.value)}
                    className="w-full bg-zinc-950/80 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder-brand-600 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-all font-medium"
                  />
                </div>

                {/* Price (optional) */}
                <div className="md:col-span-4 space-y-1.5">
                  <label className="text-xs font-mono text-brand-400 uppercase tracking-wider flex items-center justify-between">
                    <span>Price (Optional)</span>
                    <span className="text-[10px] text-brand-500 lowercase">Leave blank to hide</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. ₹299 or ₹499"
                    value={studyPriceInput}
                    onChange={(e) => setStudyPriceInput(e.target.value)}
                    className="w-full bg-zinc-950/80 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder-brand-600 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 font-mono"
                  />
                </div>
              </div>

              {/* Image URL & Upload Options with Verification Indicator */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                <div className="md:col-span-8 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-mono text-brand-400 uppercase tracking-wider flex items-center gap-2">
                      <span>Product Image URL</span>
                      {studyImageVerified === true && (
                        <span className="text-emerald-400 text-[10px] font-mono font-normal">✓ Verified</span>
                      )}
                      {studyImageVerified === false && (
                        <span className="text-amber-400 text-[10px] font-mono font-normal">⚠️ Custom or uploaded photo recommended</span>
                      )}
                    </label>
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="https://... image URL or upload directly"
                      value={studyImageInput}
                      onChange={(e) => {
                        setStudyImageInput(e.target.value);
                        setStudyImageVerified(null);
                      }}
                      className="w-full bg-zinc-950/80 border border-white/10 rounded-2xl px-4 py-3 text-xs text-brand-300 placeholder-brand-600 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 font-mono"
                    />

                    <button
                      type="button"
                      onClick={() => studyFileInputRef.current?.click()}
                      disabled={studyUploadingImage}
                      className="px-3.5 py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-xs font-mono text-brand-300 hover:text-white border border-white/10 transition-colors shrink-0 flex items-center gap-1.5"
                      title="Upload image from computer"
                    >
                      {studyUploadingImage ? "⏳ Uploading..." : "📁 Upload"}
                    </button>
                    <input
                      ref={studyFileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleStudyFileUpload}
                      className="hidden"
                    />
                  </div>
                </div>

                {/* Live Image Preview Thumbnail */}
                <div className="md:col-span-4 flex items-center gap-3 pt-6 sm:pt-0">
                  <div className="w-16 h-16 rounded-2xl bg-zinc-950/80 border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                    {studyImageInput ? (
                      <img
                        src={studyImageInput}
                        alt="Product preview"
                        className="w-full h-full object-contain p-1"
                        onError={() => setStudyImageVerified(false)}
                        onLoad={() => setStudyImageVerified(true)}
                      />
                    ) : (
                      <span className="text-xl">📚</span>
                    )}
                  </div>
                  <div className="text-xs text-brand-400">
                    <p className="font-semibold text-white truncate max-w-[150px]">{studyTitleInput || "Product Title"}</p>
                    <p className="text-[10px] text-brand-500">{studyImageInput ? "Ready to save" : "Paste link to auto-fill"}</p>
                  </div>
                </div>
              </div>

              {/* Optional: Why Nishant Uses It / Recommendation Note */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setStudyShowAdvanced(!studyShowAdvanced)}
                  className="text-xs font-mono text-brand-400 hover:text-white flex items-center gap-1.5 transition-colors"
                >
                  <span>{studyShowAdvanced ? "▼" : "▶"}</span>
                  <span>{studyShowAdvanced ? "Hide Recommendation Note" : "+ Add Why Nishant Uses It / Description"}</span>
                </button>

                {studyShowAdvanced && (
                  <div className="mt-3 space-y-1.5 animate-fade-in">
                    <textarea
                      rows={2}
                      placeholder="e.g. Crafted specifically for student focus sessions, with premium paper quality and structured templates."
                      value={studyDescriptionInput}
                      onChange={(e) => setStudyDescriptionInput(e.target.value)}
                      className="w-full bg-zinc-950/80 border border-white/10 rounded-2xl p-4 text-xs text-white placeholder-brand-600 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-all leading-relaxed"
                    />
                  </div>
                )}
              </div>

              {/* Status Selector + Submit */}
              <div className="pt-4 border-t border-white/10 space-y-4">
                <div className="flex items-center gap-3">
                  <label className="text-xs font-mono text-brand-400 uppercase tracking-wider shrink-0">Card Status</label>
                  <select
                    value={studyStatusSelect}
                    onChange={(e) => setStudyStatusSelect(e.target.value as "In Stock" | "Out of Stock" | "Featured")}
                    className="bg-zinc-950/80 border border-white/10 rounded-xl px-3 py-2 text-sm text-white font-semibold focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-all cursor-pointer"
                  >
                    <option value="In Stock">✅ In Stock</option>
                    <option value="Out of Stock">❌ Out of Stock</option>
                    <option value="Featured">⭐ Featured on Homepage</option>
                  </select>
                </div>

                <div className="flex items-center justify-end gap-3">
                  {studyEditingId && (
                    <button
                      type="button"
                      onClick={resetStudyForm}
                      className="px-5 py-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-brand-300 hover:text-white transition-colors"
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={studySubmitting}
                    className="px-7 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs uppercase tracking-wider shadow-[0_0_25px_rgba(245,158,11,0.3)] hover:shadow-[0_0_35px_rgba(245,158,11,0.5)] transition-all duration-300 flex items-center gap-2 disabled:opacity-50 hover:-translate-y-0.5"
                  >
                    <span>{studyEditingId ? "💾" : "📚"}</span>
                    <span>{studySubmitting ? "Saving..." : studyEditingId ? "Save Changes" : "Add to 2 AM Study Picks"}</span>
                  </button>
                </div>
              </div>

            </form>
          </div>

          {/* ─── MANAGE EXISTING 2 AM STUDY PICKS LIST ─── */}
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <span>📚</span>
                  <span>Active 2 AM Study Picks ({studyPicks.length})</span>
                </h3>
                <p className="text-xs text-brand-400 mt-0.5">
                  Live on website at <code className="text-amber-400 font-mono">/amazon-feed</code> with direct link to 2amstudy checkout.
                </p>
              </div>

              {/* Search and Category Filter */}
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={studySearchQuery}
                  onChange={(e) => setStudySearchQuery(e.target.value)}
                  className="bg-zinc-950/80 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white placeholder-brand-600 focus:outline-none focus:border-amber-500/40 w-40 sm:w-48"
                />

                <select
                  value={studySelectedCategoryFilter}
                  onChange={(e) => setStudySelectedCategoryFilter(e.target.value)}
                  className="bg-zinc-950/80 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500/40"
                >
                  <option value="All">All Categories</option>
                  {Array.from(new Set(studyPicks.map((p) => p.category || "2 AM Study").filter(Boolean))).map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {loadingStudy ? (
              <div className="h-48 flex items-center justify-center border border-white/5 rounded-3xl bg-zinc-950/30">
                <div className="w-6 h-6 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
              </div>
            ) : filteredStudyPicks.length === 0 ? (
              <div className="p-12 text-center border border-white/5 rounded-3xl bg-zinc-950/30 space-y-3">
                <span className="text-4xl">📚</span>
                <h4 className="text-base font-bold text-white">No 2 AM Study picks found</h4>
                <p className="text-xs text-brand-400">
                  {studyPicks.length === 0 ? "Paste a link above to add your first official 2 AM Study product." : "No products matched your search."}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredStudyPicks.map((pick) => (
                  <div
                    key={pick.id}
                    className={`glass border rounded-2xl p-4 flex flex-col justify-between transition-all duration-300 relative group hover:border-amber-500/30 ${
                      pick.isFeatured ? "border-amber-500/30 bg-amber-500/[0.03]" : "border-white/5 bg-zinc-950/40"
                    }`}
                  >
                    <div>
                      {/* Card Top: Category, Stock Badge & Featured Tag */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-mono text-brand-400 uppercase tracking-wider font-semibold">
                          {pick.category || "2 AM Study"}
                        </span>

                        {/* Single smart status badge — top-right, click cycles status */}
                        {pick.isFeatured ? (
                          <button
                            type="button"
                            onClick={() => handleCycleStudyStatus(pick)}
                            className="px-2 py-0.5 rounded-full text-[10px] font-bold border transition-all flex items-center gap-1 bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.2)] hover:bg-amber-500/30"
                            title="Click to cycle status"
                          >
                            <span>⭐</span>
                            <span>Featured</span>
                          </button>
                        ) : pick.availability === "Out of Stock" ? (
                          <button
                            type="button"
                            onClick={() => handleCycleStudyStatus(pick)}
                            className="px-2 py-0.5 rounded-full text-[10px] font-bold border transition-all flex items-center gap-1 bg-red-500/15 text-red-400 border-red-500/30 hover:bg-red-500/25"
                            title="Click to cycle status"
                          >
                            <span>❌</span>
                            <span>Out of Stock</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleCycleStudyStatus(pick)}
                            className="px-2 py-0.5 rounded-full text-[10px] font-bold border transition-all flex items-center gap-1 bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25"
                            title="Click to cycle status"
                          >
                            <span>✅</span>
                            <span>In Stock</span>
                          </button>
                        )}
                      </div>

                      {/* Product Thumbnail & Details */}
                      <div className="flex gap-3 mb-3">
                        <div className="w-16 h-16 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden shrink-0 p-1">
                          {pick.imageUrl ? (
                            <img
                              src={pick.imageUrl}
                              alt={pick.title}
                              className="w-full h-full object-contain"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = "none";
                              }}
                            />
                          ) : (
                            <span className="text-xl">📚</span>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-bold text-white line-clamp-2 leading-snug group-hover:text-amber-300 transition-colors">
                            {pick.title}
                          </h4>
                          {pick.price ? (
                            <p className="text-xs font-mono font-bold text-amber-400 mt-1">
                              {pick.price}
                            </p>
                          ) : (
                            <p className="text-[10px] text-brand-500 mt-1 italic">Price not listed</p>
                          )}
                        </div>
                      </div>

                      {pick.description && (
                        <p className="text-xs text-brand-400 line-clamp-2 italic border-l-2 border-amber-500/30 pl-2 mb-3">
                          &ldquo;{pick.description}&rdquo;
                        </p>
                      )}
                    </div>

                    {/* Actions: Edit, Live Link, Delete */}
                    <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => handleStartStudyEdit(pick)}
                          className="text-brand-300 hover:text-amber-400 transition-colors font-medium flex items-center gap-1 text-[11px]"
                        >
                          <span>✏️</span>
                          <span>Edit</span>
                        </button>

                        <a
                          href={pick.productUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-brand-400 hover:text-white transition-colors text-[11px]"
                          title="Open product link"
                        >
                          View ↗
                        </a>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteStudyPick(pick.id, pick.title)}
                        className="px-2.5 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-colors text-[11px]"
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
  );
}
