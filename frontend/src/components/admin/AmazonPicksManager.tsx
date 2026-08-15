"use client";

import { useState, useEffect, useRef } from "react";
import type { AmazonPick } from "@/types";
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
  const [isFeatured, setIsFeatured] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

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
      onShowToast("Failed to load Amazon picks", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPicks();
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
    setIsFeatured(false);
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
        affiliateUrl: linkInput.trim(), // Stored verbatim to preserve affiliate tag
        category: finalCategory,
        title: titleInput.trim() || "Amazon Pick",
        imageUrl: imageInput.trim(),
        price: priceInput.trim(), // Only stored if provided by admin (no guessing)
        description: descriptionInput.trim(),
        isFeatured,
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

  const handleToggleFeatured = async (pick: AmazonPick) => {
    try {
      const token = sessionStorage.getItem("admin_token");
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const updatedStatus = !pick.isFeatured;
      // Optimistic update
      setPicks((prev) => prev.map((p) => (p.id === pick.id ? { ...p, isFeatured: updatedStatus } : p)));

      const res = await fetch(`${getBackendUrl()}/api/amazon-picks/${pick.id}`, {
        method: "PUT",
        headers,
        body: JSON.stringify({ isFeatured: updatedStatus }),
      });

      if (!res.ok) {
        fetchPicks();
        throw new Error("Failed to update status");
      }
      onShowToast(updatedStatus ? "Marked as ⭐ Featured on Homepage!" : "Removed from Featured", "success");
    } catch (err: any) {
      onShowToast(err.message || "Failed to toggle featured", "error");
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
    setIsFeatured(!!pick.isFeatured);
    setShowAdvanced(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const filteredPicks = picks.filter((pick) => {
    const matchesCat = selectedCategoryFilter === "All" || pick.category === selectedCategoryFilter;
    const matchesSearch = !searchQuery.trim() ||
      pick.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pick.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="space-y-8 font-sans">
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

            {/* Thumbnail Preview Card */}
            <div className="md:col-span-4 flex items-center gap-3 bg-zinc-950/60 p-3 rounded-2xl border border-white/5 min-h-[58px]">
              <div className="w-14 h-14 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                {imageInput ? (
                  <img
                    src={imageInput}
                    alt="Preview"
                    className="w-full h-full object-contain p-1"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                ) : (
                  <span className="text-xl opacity-30">📦</span>
                )}
              </div>
              <div className="text-[11px] leading-tight text-brand-400 truncate flex-1 min-w-0">
                <span className="text-white font-semibold block truncate">{titleInput || "Product Preview"}</span>
                <span className="text-amber-400 font-mono">{priceInput || "Ready to save"}</span>
              </div>
            </div>
          </div>

          {/* Description & Toggle */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-xs text-brand-400 hover:text-amber-400 transition-colors flex items-center gap-1.5 font-mono"
              >
                <span>{showAdvanced ? "▼" : "▶"}</span>
                {showAdvanced ? "Hide Extra Note" : "+ Add Why Nishant Uses It / Description"}
              </button>

              {/* ⭐ Featured on Homepage Toggle */}
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-500 bg-zinc-900 border-white/10 focus:ring-amber-500 accent-amber-500"
                />
                <span className="text-xs font-semibold text-white flex items-center gap-1">
                  ⭐ Feature on Homepage
                </span>
              </label>
            </div>

            {showAdvanced && (
              <div className="space-y-1.5 animate-fade-in">
                <label className="text-xs font-mono text-brand-400 uppercase tracking-wider">
                  Recommendation Note / Why Nishant Uses It
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. The ergonomic mouse I use for 12+ hour coding and editing sessions without wrist fatigue."
                  value={descriptionInput}
                  onChange={(e) => setDescriptionInput(e.target.value)}
                  className="w-full bg-zinc-950/80 border border-white/10 rounded-2xl p-4 text-sm text-white placeholder-brand-600 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 resize-none"
                />
              </div>
            )}
          </div>

          {/* Submit Action Bar */}
          <div className="pt-3 flex items-center justify-end gap-3 border-t border-white/5">
            <button
              type="submit"
              disabled={submitting}
              className="px-8 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs uppercase tracking-wider shadow-[0_0_24px_rgba(245,158,11,0.25)] hover:shadow-[0_0_36px_rgba(245,158,11,0.4)] transition-all duration-300 flex items-center gap-2 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-black/40 border-t-black rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <span>🛍️</span>
                  <span>{editingId ? "Update Recommendation" : "Add to Nishant's Picks"}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* ─── MANAGE EXISTING PICKS LIST ─── */}
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <span>📦</span>
              <span>All Recommended Products ({picks.length})</span>
            </h3>
            <p className="text-xs text-brand-400 mt-0.5">
              Live on website at <code className="text-amber-400 font-mono">/amazon</code> storefront.
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
              className="bg-zinc-950/80 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-brand-300 focus:outline-none focus:border-amber-500/40"
            >
              <option value="All">All Categories</option>
              {Array.from(new Set([...DEFAULT_CATEGORIES, ...picks.map((p) => p.category)])).map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="h-40 flex items-center justify-center border border-white/5 rounded-3xl bg-zinc-950/40">
            <div className="w-6 h-6 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
          </div>
        ) : filteredPicks.length === 0 ? (
          <div className="p-12 text-center border border-white/5 rounded-3xl bg-zinc-950/30 space-y-3">
            <span className="text-4xl">🛍️</span>
            <h4 className="text-base font-bold text-white">No products found</h4>
            <p className="text-xs text-brand-400 max-w-sm mx-auto">
              {picks.length === 0
                ? "Paste an Amazon affiliate link above to add your first recommended gear or book!"
                : "No products matched your search or category filter."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPicks.map((pick) => (
              <div
                key={pick.id}
                className={`glass border rounded-2xl p-4 flex flex-col justify-between transition-all duration-300 relative group hover:border-amber-500/30 ${pick.isFeatured ? "border-amber-500/30 bg-amber-500/[0.03]" : "border-white/5 bg-zinc-950/40"
                  }`}
              >
                <div>
                  {/* Top badges & actions */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-mono text-brand-300">
                      {pick.category}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleToggleFeatured(pick)}
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border transition-colors flex items-center gap-1 ${pick.isFeatured
                          ? "bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.2)]"
                          : "bg-white/5 text-brand-400 border-white/5 hover:text-white"
                        }`}
                      title="Toggle Featured on Homepage"
                    >
                      <span>⭐</span>
                      <span>{pick.isFeatured ? "Featured" : "Feature"}</span>
                    </button>
                  </div>

                  {/* Product Image & Title */}
                  <div className="flex gap-3 mb-3">
                    <div className="w-16 h-16 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden shrink-0 p-1">
                      {pick.imageUrl ? (
                        <img
                          src={pick.imageUrl}
                          alt={pick.title}
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
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
                      ) : null}
                    </div>
                  </div>

                  {pick.description && (
                    <p className="text-xs text-brand-400 line-clamp-2 leading-relaxed mb-3 bg-white/2 p-2 rounded-xl border border-white/5">
                      &ldquo;{pick.description}&rdquo;
                    </p>
                  )}
                </div>

                {/* Card Actions */}
                <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs">
                  <a
                    href={pick.affiliateUrl}
                    target="_blank"
                    rel="noopener noreferrer sponsored"
                    className="text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 transition-colors text-[11px]"
                  >
                    View on Amazon ↗
                  </a>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleStartEdit(pick)}
                      className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-brand-300 hover:text-white border border-white/5 transition-colors text-[11px]"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(pick.id, pick.title)}
                      className="px-2.5 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-colors text-[11px]"
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
  );
}
