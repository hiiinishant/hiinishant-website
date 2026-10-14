"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, getIdToken, type User as FirebaseUser } from "firebase/auth";
import { auth, db, isConfigured } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { API_BASE } from "@/lib/api";
import {
  BioPage,
  BioLink,
  BioThemeId,
  CustomColorPalette,
  ButtonStyle,
  BIO_THEMES,
  BUTTON_STYLES,
  SUPPORTED_LINK_ICONS,
  isValidBioUrl,
  isValidUsernameFormat,
  isReservedUsername,
  normalizeUsername,
} from "@/types/bio";
import CustomColorCustomizer from "@/components/bio/CustomColorCustomizer";
import SortableLinkList from "@/components/bio/SortableLinkList";
import QRCodeModal from "@/components/bio/QRCodeModal";
import AnalyticsChart from "@/components/bio/AnalyticsChart";
import {
  Plus,
  Trash2,
  ExternalLink,
  MoreVertical,
  Copy,
  Check,
  Eye,
  MousePointerClick,
  Sparkles,
  Palette,
  Share2,
  ArrowUp,
  ArrowDown,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Settings,
  Link as LinkIcon,
  Globe,
  Send,
  MessageCircle,
  Mail,
  ShoppingBag,
  BookOpen,
  Video,
  Code,
  Briefcase,
  Star,
  Heart,
  Smartphone,
  X,
  Upload,
  Camera,
  Edit3,
  QrCode,
} from "lucide-react";
import {
  renderBioIcon,
  InstagramIcon,
  YouTubeIcon,
  TwitterIcon,
  LinkedInIcon,
  GitHubIcon,
  TelegramIcon,
  SpotifyIcon,
  DiscordIcon,
  FacebookIcon,
  TikTokIcon,
} from "@/components/bio/BioIcons";

export default function DashboardClient() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<BioPage | null>(null);
  const [activeTab, setActiveTab] = useState<"links" | "appearance" | "socials" | "settings">("links");

  // Onboarding username claim state
  const [claimInput, setClaimInput] = useState("");
  const [claimLoading, setClaimLoading] = useState(false);
  const [claimError, setClaimError] = useState("");
  const [claimAvailable, setClaimAvailable] = useState<boolean | null>(null);

  // Link addition modal/card state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [newIcon, setNewIcon] = useState("website");

  // Link editing state
  const [editingLink, setEditingLink] = useState<BioLink | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editUrl, setEditUrl] = useState("");
  const [editIcon, setEditIcon] = useState("website");

  // Mobile preview drawer
  const [showMobilePreview, setShowMobilePreview] = useState(false);

  // QR code modal
  const [showQRModal, setShowQRModal] = useState(false);

  // Toast / feedback alert
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Avatar file upload state & ref
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const showToast = useCallback((message: string, type: "success" | "error" | "info" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  // Avatar image file upload handler (dual backend Cloudinary + compressed canvas fallback)
  const handleAvatarFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showToast("Please choose an image file (PNG, JPG, WebP, GIF)", "error");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast("Image must be smaller than 5MB", "error");
      return;
    }

    try {
      setUploadingAvatar(true);

      // Attempt 1: Upload via Backend API to Cloudinary
      let uploadedUrl: string | null = null;
      if (currentUser) {
        try {
          const token = await getIdToken(currentUser);
          const formData = new FormData();
          formData.append("image", file);

          const res = await fetch(`${API_BASE}/api/bio/upload-avatar`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: formData,
          });

          if (res.ok) {
            const data = await res.json();
            if (data.url) {
              uploadedUrl = data.url;
            }
          }
        } catch (apiErr) {
          console.warn("Backend avatar upload failed, falling back to local compressed data URL:", apiErr);
        }
      }

      // Attempt 2: If API upload is not available, compress client-side to square WebP data URL
      if (!uploadedUrl) {
        uploadedUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (readerEvent) => {
            const img = new (window as any).Image();
            img.onload = () => {
              const canvas = document.createElement("canvas");
              // Keep small to stay well under Firestore 1MB doc limit
              const MAX_SIZE = 200;
              let width = img.width;
              let height = img.height;

              if (width > height) {
                if (width > MAX_SIZE) {
                  height = Math.round((height * MAX_SIZE) / width);
                  width = MAX_SIZE;
                }
              } else {
                if (height > MAX_SIZE) {
                  width = Math.round((width * MAX_SIZE) / height);
                  height = MAX_SIZE;
                }
              }

              canvas.width = width;
              canvas.height = height;
              const ctx = canvas.getContext("2d");
              if (!ctx) {
                resolve(readerEvent.target?.result as string);
                return;
              }
              ctx.drawImage(img, 0, 0, width, height);
              resolve(canvas.toDataURL("image/webp", 0.6));
            };
            img.onerror = reject;
            img.src = readerEvent.target?.result as string;
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      }

      if (uploadedUrl && profile) {
        const updated: BioPage = {
          ...profile,
          avatarType: "custom" as const,
          avatarUrl: uploadedUrl,
        };
        setProfile(updated);
        await handleSaveProfile(updated);
        showToast("Profile image updated!", "success");
      }
    } catch (err: any) {
      console.error("Avatar upload error:", err);
      showToast(err.message || "Failed to upload image", "error");
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // 1. Observe Authentication
  useEffect(() => {
    if (!isConfigured || !auth) {
      setAuthChecking(false);
      return;
    }

    const unsub = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      setAuthChecking(false);
      if (user) {
        fetchUserProfile(user);
      }
    });

    return () => unsub();
  }, []);

  // Helper to generate a default initial Bio Profile
  const createDefaultProfile = async (user: FirebaseUser): Promise<BioPage> => {
    let initialUsername = "";
    let displayName = user.displayName || "My Profile";
    let bio = "Welcome to my official links page! ✨";
    let avatarType: "initials" | "boy" | "girl" = "initials";
    let avatarUrl = user.photoURL || "";

    if (db) {
      try {
        const uSnap = await getDoc(doc(db, "users", user.uid));
        if (uSnap.exists()) {
          const uData = uSnap.data();
          if (uData.username && !isReservedUsername(normalizeUsername(uData.username))) {
            initialUsername = normalizeUsername(uData.username);
          }
          if (uData.displayName) displayName = uData.displayName;
          if (uData.bio) bio = uData.bio;
          if (uData.avatar === "boy" || uData.avatar === "girl") avatarType = uData.avatar;
          if (uData.photoURL) avatarUrl = uData.photoURL;
        }
      } catch {}
    }

    const now = new Date().toISOString();
    return {
      uid: user.uid,
      username: initialUsername,
      displayName,
      bio,
      avatarType,
      avatarUrl,
      theme: "dark-modern",
      buttonStyle: "rounded",
      isPublished: Boolean(initialUsername),
      links: [
        {
          id: `link-${Date.now()}-1`,
          title: "My Official Website",
          url: "https://hiiinishant.com",
          icon: "website",
          isActive: true,
          order: 0,
          clicks: 0,
          createdAt: now,
        },
      ],
      socials: {},
      views: 0,
      totalClicks: 0,
      createdAt: now,
      updatedAt: now,
    };
  };

  // 2. Fetch or initialize Bio Profile with resilient fallback
  const fetchUserProfile = async (user: FirebaseUser) => {
    try {
      setLoadingProfile(true);

      let loadedProfile: BioPage | null = null;

      // Attempt 1: Fetch via Backend REST API
      try {
        const token = await getIdToken(user);
        const res = await fetch(`${API_BASE}/api/bio/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.ok) {
          const data = await res.json();
          if (data.profile) {
            loadedProfile = data.profile;
          }
        } else {
          const errData = await res.json().catch(() => null);
          console.warn("Backend /api/bio/me returned status:", res.status, errData);
        }
      } catch (netErr) {
        console.warn("Backend /api/bio/me network fetch failed, falling back to direct Firestore:", netErr);
      }

      // Attempt 2: If API did not return profile, read/create directly from Firestore
      if (!loadedProfile && db) {
        try {
          const bioDocRef = doc(db, "bio_pages", user.uid);
          const bioSnap = await getDoc(bioDocRef);
          if (bioSnap.exists()) {
            loadedProfile = { ...(bioSnap.data() as BioPage), uid: user.uid };
          } else {
            const newProfile = await createDefaultProfile(user);
            await setDoc(bioDocRef, newProfile);
            loadedProfile = newProfile;
          }
        } catch (fsErr) {
          console.error("Firestore direct profile fetch error:", fsErr);
        }
      }

      if (loadedProfile) {
        setProfile(loadedProfile);
        if (!loadedProfile.username) {
          setClaimInput("");
        }
      } else {
        // Fallback local state if offline
        const localFallback = await createDefaultProfile(user);
        setProfile(localFallback);
      }
    } catch (err: any) {
      console.error("Error fetching bio page:", err);
      showToast(err.message || "Could not load profile", "error");
    } finally {
      setLoadingProfile(false);
    }
  };

  // 3. Save profile changes with dual API + Firestore fallback
  // Accept a fully-merged BioPage snapshot to avoid stale closure bugs
  // where rapid consecutive calls could clobber each other's changes.
  const handleSaveProfile = async (snapshot: BioPage) => {
    if (!currentUser) return;
    try {
      setSaving(true);
      const dataToSave: BioPage = {
        ...snapshot,
        updatedAt: new Date().toISOString(),
      };

      let savedSuccessfully = false;

      // Attempt 1: Save via Backend REST API
      try {
        const token = await getIdToken(currentUser);
        const res = await fetch(`${API_BASE}/api/bio/me`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(dataToSave),
        });

        if (res.ok) {
          const resData = await res.json();
          if (resData.profile) {
            setProfile(resData.profile);
            savedSuccessfully = true;
          }
        }
      } catch (netErr) {
        console.warn("Backend save failed, using direct Firestore fallback:", netErr);
      }

      // Attempt 2: Direct Firestore fallback
      if (!savedSuccessfully && db) {
        const bioDocRef = doc(db, "bio_pages", currentUser.uid);
        await setDoc(bioDocRef, dataToSave, { merge: true });
        setProfile(dataToSave);
        savedSuccessfully = true;
      }

      if (savedSuccessfully) {
        showToast("Changes saved successfully!", "success");
      } else {
        throw new Error("Unable to save changes. Please check your connection.");
      }
    } catch (err: any) {
      showToast(err.message || "Error saving profile", "error");
    } finally {
      setSaving(false);
    }
  };

  // 4. Live Check Username Availability during onboarding or change
  useEffect(() => {
    if (!claimInput.trim()) {
      setClaimAvailable(null);
      setClaimError("");
      return;
    }

    const normalized = normalizeUsername(claimInput);
    if (!isValidUsernameFormat(normalized)) {
      setClaimAvailable(false);
      setClaimError("3-30 lowercase characters, letters, numbers, and underscores only.");
      return;
    }

    if (isReservedUsername(normalized)) {
      setClaimAvailable(false);
      setClaimError("This handle is reserved. Please pick another.");
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`${API_BASE}/api/bio/check-username?username=${encodeURIComponent(normalized)}`);
        const json = await res.json();
        if (json.available) {
          setClaimAvailable(true);
          setClaimError("");
        } else {
          setClaimAvailable(false);
          setClaimError(json.error || "Handle is already taken.");
        }
      } catch {
        // silent fallback
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [claimInput]);

  // 5. Claim Username with API + Firestore fallback
  const handleClaimUsername = async () => {
    if (!currentUser || !claimInput.trim() || !claimAvailable) return;
    try {
      setClaimLoading(true);
      const normalized = normalizeUsername(claimInput);
      let claimed = false;

      // Attempt 1: Claim via API
      try {
        const token = await getIdToken(currentUser);
        const res = await fetch(`${API_BASE}/api/bio/claim-username`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ username: normalized }),
        });

        if (res.ok) {
          claimed = true;
        } else {
          const errData = await res.json().catch(() => null);
          if (errData?.error) throw new Error(errData.error);
        }
      } catch (err: any) {
        if (err.message && !err.message.includes("fetch")) {
          throw err;
        }
      }

      // Attempt 2: Direct Firestore fallback if API unreachable
      if (!claimed && db) {
        const bioDocRef = doc(db, "bio_pages", currentUser.uid);
        await setDoc(bioDocRef, { username: normalized, isPublished: true, updatedAt: new Date().toISOString() }, { merge: true });
        claimed = true;
      }

      if (claimed) {
        if (profile) {
          const updated: BioPage = { ...profile, username: normalized, isPublished: true };
          setProfile(updated);
        } else {
          setProfile((prev) => (prev ? { ...prev, username: normalized, isPublished: true } : null));
        }
        showToast(`Congratulations! Your handle @${normalized} is active.`, "success");
      }
    } catch (err: any) {
      setClaimError(err.message || "Failed to claim handle.");
      showToast(err.message || "Failed to claim handle", "error");
    } finally {
      setClaimLoading(false);
    }
  };

  // 5b. Open Edit Link
  const handleOpenEditLink = (link: BioLink) => {
    setEditingLink(link);
    setEditTitle(link.title);
    setEditUrl(link.url);
    setEditIcon(link.icon || "website");
  };

  // 5c. Update existing Link in-place
  const handleUpdateLink = () => {
    if (!editingLink || !editTitle.trim() || !editUrl.trim() || !profile) return;
    let url = editUrl.trim();
    const wasAutoFixed = !url.includes("://") && !url.startsWith("mailto:") && !url.startsWith("tel:");
    if (wasAutoFixed) {
      url = `https://${url}`;
    }

    if (!isValidBioUrl(url)) {
      showToast("Please enter a valid URL (https://, http://, mailto:, or tel:)", "error");
      return;
    }

    const updatedLinks = profile.links.map((l) =>
      l.id === editingLink.id
        ? {
            ...l,
            title: editTitle.trim(),
            url,
            icon: editIcon,
          }
        : l
    );

    const updated: BioPage = { ...profile, links: updatedLinks };
    setProfile(updated);
    handleSaveProfile(updated);

    if (wasAutoFixed) {
      showToast(`URL updated as ${url}`, "info");
    } else {
      showToast("Link updated successfully!", "success");
    }

    setEditingLink(null);
  };

  // 6. Add new Link
  const handleAddLink = () => {
    if (!newTitle.trim() || !newUrl.trim() || !profile) return;
    let url = newUrl.trim();
    const wasAutoFixed = !url.includes("://") && !url.startsWith("mailto:") && !url.startsWith("tel:");
    if (wasAutoFixed) {
      url = `https://${url}`;
    }

    if (!isValidBioUrl(url)) {
      showToast("Please enter a valid URL (https://, http://, mailto:, or tel:)", "error");
      return;
    }

    const newLinkItem: BioLink = {
      id: `link-${Date.now()}`,
      title: newTitle.trim(),
      url,
      icon: newIcon,
      isActive: true,
      order: profile.links.length,
      clicks: 0,
      createdAt: new Date().toISOString(),
    };

    const updatedLinks = [...profile.links, newLinkItem];
    const updated: BioPage = { ...profile, links: updatedLinks };
    setProfile(updated);
    handleSaveProfile(updated);

    if (wasAutoFixed) {
      showToast(`URL saved as ${url}`, "info");
    }
    setNewTitle("");
    setNewUrl("");
    setNewIcon("website");
    setShowAddModal(false);
  };

  // 7. Delete Link
  const handleDeleteLink = (linkId: string) => {
    if (!profile) return;
    const updatedLinks = profile.links.filter((l) => l.id !== linkId);
    const updated: BioPage = { ...profile, links: updatedLinks };
    setProfile(updated);
    handleSaveProfile(updated);
    showToast("Link deleted", "info");
  };

  // 8. Toggle Link Active Status
  const handleToggleLinkActive = (linkId: string) => {
    if (!profile) return;
    const updatedLinks = profile.links.map((l) => (l.id === linkId ? { ...l, isActive: !l.isActive } : l));
    const updated: BioPage = { ...profile, links: updatedLinks };
    setProfile(updated);
    handleSaveProfile(updated);
  };

  // 9b. Drag-and-drop reorder (from SortableLinkList)
  const handleReorderLinks = (reorderedLinks: BioLink[]) => {
    if (!profile) return;
    const updated: BioPage = { ...profile, links: reorderedLinks };
    setProfile(updated);
    handleSaveProfile(updated);
  };

  // 9. Move Link Up / Down (keyboard fallback)
  const handleMoveLink = (index: number, direction: "up" | "down") => {
    if (!profile) return;
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= profile.links.length) return;

    const newLinks = [...profile.links];
    const temp = newLinks[index];
    newLinks[index] = newLinks[targetIndex];
    newLinks[targetIndex] = temp;

    // re-assign sequential orders
    const reordered = newLinks.map((l, idx) => ({ ...l, order: idx }));
    const updated: BioPage = { ...profile, links: reordered };
    setProfile(updated);
    handleSaveProfile(updated);
  };

  // 10. Copy profile link
  const publicUrl = useMemo(() => {
    if (!profile?.username) return "";
    return typeof window !== "undefined"
      ? `${window.location.origin}/${profile.username}`
      : `https://hiiinishant.com/${profile.username}`;
  }, [profile?.username]);

  const handleCopyLink = () => {
    if (!publicUrl) return;
    navigator.clipboard.writeText(publicUrl);
    setCopiedLink(true);
    showToast("Profile link copied to clipboard!", "success");
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Current theme config for live preview
  const activeTheme = useMemo(() => {
    return BIO_THEMES[profile?.theme || "dark-modern"];
  }, [profile?.theme]);

  const activeButtonStyle = useMemo(() => {
    return BUTTON_STYLES[profile?.buttonStyle || "rounded"];
  }, [profile?.buttonStyle]);

  // Computed custom color styles for live preview
  const previewCustomColors = profile?.useCustomColors ? profile?.customColors : undefined;

  const previewCustomBg = useMemo(() => {
    if (!previewCustomColors) return undefined;
    if (previewCustomColors.backgroundGradient) {
      return { background: previewCustomColors.backgroundGradient };
    }
    if (previewCustomColors.backgroundColor) {
      return { backgroundColor: previewCustomColors.backgroundColor };
    }
    return undefined;
  }, [previewCustomColors]);

  const previewTextColor = useMemo(() => {
    if (!previewCustomColors?.textColor) return undefined;
    return { color: previewCustomColors.textColor };
  }, [previewCustomColors]);

  const previewAccentColor = useMemo(() => {
    if (!previewCustomColors?.accentColor) return undefined;
    return { color: previewCustomColors.accentColor };
  }, [previewCustomColors]);

  const previewAvatarBorder = useMemo(() => {
    if (!previewCustomColors?.accentColor) return undefined;
    return {
      borderColor: previewCustomColors.accentColor,
      boxShadow: `0 0 20px ${previewCustomColors.accentColor}40`,
    };
  }, [previewCustomColors]);

  const previewButtonCustomStyle = useMemo(() => {
    if (!previewCustomColors) return undefined;
    const style: React.CSSProperties = {};
    if (previewCustomColors.buttonColor) {
      style.backgroundColor = previewCustomColors.buttonColor;
      style.borderColor = `${previewCustomColors.buttonColor}40`;
    }
    if (previewCustomColors.buttonTextColor) {
      style.color = previewCustomColors.buttonTextColor;
    }
    return style;
  }, [previewCustomColors]);

  // Loading state
  if (authChecking || loadingProfile) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center">
        <Loader2 className="w-10 h-10 animate-spin text-accent mb-4" />
        <h2 className="text-xl font-bold text-white tracking-tight">Loading Bio Studio...</h2>
        <p className="text-sm text-brand-400 mt-1">Connecting to your personalized profile</p>
      </div>
    );
  }

  // Not logged in state
  if (!currentUser) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-3xl bg-zinc-950/80 border border-white/10 p-8 shadow-2xl backdrop-blur-xl text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent to-accent-light flex items-center justify-center text-black mx-auto mb-6 shadow-[0_0_30px_rgba(245,158,11,0.3)]">
            <Sparkles className="w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-2">
            Create Your Bio Link
          </h1>
          <p className="text-sm text-brand-300 leading-relaxed mb-8">
            Build your personalized link-in-bio page on <span className="text-white font-semibold">Hiii Nishant</span>. Share all your links, music, social profiles, and content in one place.
          </p>
          <div className="space-y-3">
            <Link
              href="/login?mode=signup&redirect=/dashboard"
              className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-accent hover:bg-accent-hover text-black font-bold text-sm transition-all duration-300 shadow-[0_0_25px_rgba(245,158,11,0.35)] hover:-translate-y-0.5"
            >
              <span>Get Started — Claim Your Link</span>
            </Link>
            <Link
              href="/login?redirect=/dashboard"
              className="w-full inline-flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-brand-300 hover:text-white font-medium text-sm transition-all"
            >
              <span>Already have an account? Log In</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Onboarding: Username Claim Step (if user hasn't set one yet)
  if (!profile?.username) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-3xl bg-zinc-950/80 border border-white/10 p-8 shadow-2xl backdrop-blur-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-xs font-semibold uppercase tracking-wider mb-4">
            Step 1: Choose Your Handle
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-2">
            Claim Your Unique URL
          </h1>
          <p className="text-sm text-brand-300 leading-relaxed mb-6">
            Pick your username to activate your link-in-bio page. Your public address will be:
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-brand-400 uppercase tracking-wider mb-2">
                Your Public Link
              </label>
              <div className="relative flex items-center rounded-xl bg-brand-900/60 border border-white/10 focus-within:border-accent transition-all overflow-hidden">
                <span className="pl-4 pr-1 text-sm text-brand-400 font-mono select-none">
                  hiiinishant.com/
                </span>
                <input
                  type="text"
                  value={claimInput}
                  onChange={(e) => setClaimInput(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                  placeholder="yourname"
                  maxLength={30}
                  className="w-full py-3.5 pr-10 bg-transparent text-white placeholder-brand-500 font-mono text-sm focus:outline-none"
                />
                <div className="absolute right-3">
                  {claimLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-accent" />
                  ) : claimAvailable === true ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : claimAvailable === false ? (
                    <AlertCircle className="w-4 h-4 text-red-400" />
                  ) : null}
                </div>
              </div>
              {claimError ? (
                <p className="text-xs text-red-400 mt-1.5 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{claimError}</span>
                </p>
              ) : claimAvailable ? (
                <p className="text-xs text-emerald-400 mt-1.5 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>Username is available!</span>
                </p>
              ) : (
                <p className="text-[11px] text-brand-500 mt-1.5">
                  Letters, numbers, and underscores only. 3-30 characters.
                </p>
              )}
            </div>

            <button
              onClick={handleClaimUsername}
              disabled={!claimAvailable || claimLoading}
              className="w-full py-3.5 px-6 rounded-xl bg-accent hover:bg-accent-hover disabled:opacity-50 disabled:hover:bg-accent text-black font-bold text-sm transition-all duration-300 shadow-[0_0_20px_rgba(245,158,11,0.35)] cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {claimLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>Claim Handle &amp; Create Page &rarr;</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-20 right-6 z-50 animate-fadeIn">
          <div
            className={`px-4 py-3 rounded-2xl shadow-2xl backdrop-blur-xl border flex items-center gap-2.5 text-sm font-medium ${
              toast.type === "success"
                ? "bg-emerald-950/90 border-emerald-500/40 text-emerald-200"
                : toast.type === "error"
                ? "bg-red-950/90 border-red-500/40 text-red-200"
                : "bg-zinc-900/90 border-white/20 text-white"
            }`}
          >
            {toast.type === "success" && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
            {toast.type === "error" && <AlertCircle className="w-4 h-4 text-red-400" />}
            <span>{toast.message}</span>
          </div>
        </div>
      )}


      {/* Main Workspace Layout: Sidebar + Content + Phone Preview */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* Mobile: horizontal tab bar + preview toggle */}
        <div className="flex lg:hidden items-center gap-1 p-1 mb-4 rounded-2xl bg-zinc-900/60 border border-white/10 overflow-x-auto">
          {([
            { tab: "links" as const, icon: <LinkIcon className="w-4 h-4" />, label: `Links (${profile.links.length})` },
            { tab: "appearance" as const, icon: <Palette className="w-4 h-4" />, label: "Appearance" },
            { tab: "socials" as const, icon: <Share2 className="w-4 h-4" />, label: "Socials" },
            { tab: "settings" as const, icon: <Settings className="w-4 h-4" />, label: "Stats & Settings" },
          ]).map(({ tab, icon, label }) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 min-w-[90px] py-2 px-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === tab
                  ? "bg-accent text-black shadow-[0_0_15px_rgba(245,158,11,0.3)]"
                  : "text-brand-400 hover:text-white hover:bg-white/5"
              }`}
            >
              {icon}
              <span>{label}</span>
            </button>
          ))}
          <button
            onClick={() => setShowMobilePreview(true)}
            className="shrink-0 py-2 px-3 rounded-xl bg-accent text-black text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <Smartphone className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT SIDEBAR: Navigation */}
          <div className="hidden lg:flex lg:col-span-2 flex-col sticky top-20">
            <div className="rounded-2xl bg-zinc-900/70 border border-white/8 backdrop-blur-md overflow-hidden">
              {/* Sidebar User Mini-header */}
              <div className="px-4 py-4 border-b border-white/8">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent/30 to-accent/10 border border-accent/20 flex items-center justify-center text-accent font-extrabold text-sm shrink-0">
                    {profile.avatarType === "girl" ? "👧" : profile.avatarType === "boy" ? "👦" : profile.displayName.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">{profile.displayName}</p>
                    <p className="text-[10px] text-brand-400 font-mono truncate">@{profile.username}</p>
                  </div>
                </div>
              </div>

              {/* Nav Items */}
              <nav className="p-2 space-y-0.5">
                {([
                  {
                    tab: "links" as const,
                    icon: <LinkIcon className="w-4 h-4" />,
                    label: "Links",
                    badge: profile.links.length,
                  },
                  {
                    tab: "appearance" as const,
                    icon: <Palette className="w-4 h-4" />,
                    label: "Appearance",
                    badge: null,
                  },
                  {
                    tab: "socials" as const,
                    icon: <Share2 className="w-4 h-4" />,
                    label: "Socials",
                    badge: Object.values(profile.socials || {}).filter(Boolean).length || null,
                  },
                  {
                    tab: "settings" as const,
                    icon: <Settings className="w-4 h-4" />,
                    label: "Stats & Settings",
                    badge: null,
                  },
                ]).map(({ tab, icon, label, badge }) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer group ${
                      activeTab === tab
                        ? "bg-accent/15 text-accent border border-accent/25"
                        : "text-brand-400 hover:text-white hover:bg-white/5 border border-transparent"
                    }`}
                  >
                    <span className={`shrink-0 transition-colors ${
                      activeTab === tab ? "text-accent" : "text-brand-500 group-hover:text-white"
                    }`}>
                      {icon}
                    </span>
                    <span className="truncate text-xs">{label}</span>
                    {badge !== null && badge !== undefined && badge > 0 && (
                      <span className={`ml-auto shrink-0 min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-bold flex items-center justify-center ${
                        activeTab === tab
                          ? "bg-accent/20 text-accent"
                          : "bg-white/10 text-brand-400"
                      }`}>
                        {badge}
                      </span>
                    )}
                  </button>
                ))}
              </nav>

              {/* Sidebar Footer Actions */}
              <div className="p-3 border-t border-white/8 space-y-1.5">
                <Link
                  href={`/${profile.username}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-brand-400 hover:text-white hover:bg-white/5 transition-all border border-transparent"
                >
                  <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                  <span>View Live</span>
                </Link>
                <button
                  onClick={handleCopyLink}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-brand-400 hover:text-white hover:bg-white/5 transition-all border border-transparent cursor-pointer"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 shrink-0" />}
                  <span>{copiedLink ? "Copied!" : "Copy Link"}</span>
                </button>
              </div>
            </div>
          </div>

          {/* MIDDLE: Tab Content */}
          <div className="lg:col-span-6 xl:col-span-6 space-y-5">

            {/* TAB 1: LINKS MANAGEMENT */}
            {activeTab === "links" && (
              <div className="space-y-4 animate-fadeIn">
                {/* Add Link Trigger */}
                <button
                  onClick={() => setShowAddModal(true)}
                  className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-accent to-accent-light hover:brightness-110 text-black font-extrabold text-sm transition-all duration-300 shadow-[0_0_30px_rgba(245,158,11,0.35)] flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.01]"
                >
                  <Plus className="w-5 h-5 stroke-[2.5]" />
                  <span>Add New Link</span>
                </button>

                {/* Inline Add Link Form Modal / Drawer */}
                {showAddModal && (
                  <div className="rounded-2xl bg-zinc-900 border border-white/15 p-5 shadow-2xl animate-fadeIn space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-base font-bold text-white flex items-center gap-2">
                        <Plus className="w-4 h-4 text-accent" />
                        <span>Add Link</span>
                      </h3>
                      <button
                        onClick={() => setShowAddModal(false)}
                        className="p-1 rounded-lg hover:bg-white/10 text-brand-400 hover:text-white"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-brand-300 mb-1">
                          Link Title
                        </label>
                        <input
                          type="text"
                          value={newTitle}
                          onChange={(e) => setNewTitle(e.target.value)}
                          placeholder="e.g. My YouTube Channel, Portfolio, Book notes..."
                          maxLength={100}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/10 text-white placeholder-brand-500 text-sm focus:outline-none focus:border-accent"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-brand-300 mb-1">
                          Destination URL
                        </label>
                        <input
                          type="url"
                          value={newUrl}
                          onChange={(e) => setNewUrl(e.target.value)}
                          placeholder="https://..."
                          className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/10 text-white placeholder-brand-500 text-sm focus:outline-none focus:border-accent font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-brand-300 mb-1">
                          Link Icon
                        </label>
                        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-36 overflow-y-auto p-1">
                          {SUPPORTED_LINK_ICONS.map((icon) => (
                            <button
                              key={icon.id}
                              type="button"
                              onClick={() => setNewIcon(icon.id)}
                              className={`p-2 rounded-xl border flex flex-col items-center gap-1 text-[11px] transition-all cursor-pointer ${
                                newIcon === icon.id
                                  ? "bg-accent/20 border-accent text-accent"
                                  : "bg-white/5 border-white/10 text-brand-400 hover:text-white hover:bg-white/10"
                              }`}
                            >
                              {renderBioIcon(icon.id, "w-4 h-4")}
                              <span className="truncate max-w-[50px]">{icon.id}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setShowAddModal(false)}
                          className="px-4 py-2 rounded-xl text-xs font-semibold text-brand-300 hover:text-white"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleAddLink}
                          disabled={!newTitle.trim() || !newUrl.trim()}
                          className="px-5 py-2 rounded-xl bg-accent hover:bg-accent-hover disabled:opacity-50 text-black font-bold text-xs shadow-md"
                        >
                          Save Link
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Inline Edit Link Form Modal */}
                {editingLink && (
                  <div className="rounded-2xl bg-zinc-900 border border-accent/40 p-5 shadow-2xl animate-fadeIn space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-base font-bold text-white flex items-center gap-2">
                        <Edit3 className="w-4 h-4 text-accent" />
                        <span>Edit Link</span>
                      </h3>
                      <button
                        onClick={() => setEditingLink(null)}
                        className="p-1 rounded-lg hover:bg-white/10 text-brand-400 hover:text-white cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-brand-300 mb-1">
                          Link Title
                        </label>
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          placeholder="e.g. My YouTube Channel, Portfolio, Book notes..."
                          maxLength={100}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/10 text-white placeholder-brand-500 text-sm focus:outline-none focus:border-accent"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-brand-300 mb-1">
                          Destination URL
                        </label>
                        <input
                          type="url"
                          value={editUrl}
                          onChange={(e) => setEditUrl(e.target.value)}
                          placeholder="https://..."
                          className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/10 text-white placeholder-brand-500 text-sm focus:outline-none focus:border-accent font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-brand-300 mb-1">
                          Link Icon
                        </label>
                        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-36 overflow-y-auto p-1">
                          {SUPPORTED_LINK_ICONS.map((icon) => (
                            <button
                              key={icon.id}
                              type="button"
                              onClick={() => setEditIcon(icon.id)}
                              className={`p-2 rounded-xl border flex flex-col items-center gap-1 text-[11px] transition-all cursor-pointer ${
                                editIcon === icon.id
                                  ? "bg-accent/20 border-accent text-accent"
                                  : "bg-white/5 border-white/10 text-brand-400 hover:text-white hover:bg-white/10"
                              }`}
                            >
                              {renderBioIcon(icon.id, "w-4 h-4")}
                              <span className="truncate max-w-[50px]">{icon.id}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setEditingLink(null)}
                          className="px-4 py-2 rounded-xl text-xs font-semibold text-brand-300 hover:text-white cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleUpdateLink}
                          disabled={!editTitle.trim() || !editUrl.trim()}
                          className="px-5 py-2 rounded-xl bg-accent hover:bg-accent-hover disabled:opacity-50 text-black font-bold text-xs shadow-md cursor-pointer"
                        >
                          Update Link
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* List of existing links — drag-and-drop + keyboard arrows */}
                {profile.links.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-white/15 p-12 text-center">
                    <LinkIcon className="w-8 h-8 text-brand-500 mx-auto mb-3" />
                    <h4 className="text-base font-semibold text-white">No links added yet</h4>
                    <p className="text-xs text-brand-400 mt-1 max-w-sm mx-auto">
                      Click the &ldquo;Add New Link&rdquo; button above to start building your personalized bio page.
                    </p>
                  </div>
                ) : (
                  <SortableLinkList
                    links={profile.links}
                    onReorder={handleReorderLinks}
                    onToggle={handleToggleLinkActive}
                    onEdit={handleOpenEditLink}
                    onDelete={handleDeleteLink}
                    onMove={handleMoveLink}
                  />
                )}
              </div>
            )}

            {/* TAB 2: APPEARANCE & THEMES */}
            {activeTab === "appearance" && (
              <div className="space-y-6 animate-fadeIn">
                {/* 1. Profile Picture & Names */}
                <div className="rounded-3xl bg-zinc-900/60 border border-white/10 p-6 space-y-5">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-accent" />
                    <span>Profile Details</span>
                  </h3>

                  {/* Avatar Picker */}
                  <div>
                    <label className="block text-xs font-semibold text-brand-300 uppercase tracking-wider mb-2">
                      Avatar Style
                    </label>
                    <div className="grid grid-cols-4 gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          const updated: BioPage = { ...profile, avatarType: "boy" };
                          setProfile(updated);
                          handleSaveProfile(updated);
                        }}
                        className={`p-3 rounded-2xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                          profile.avatarType === "boy"
                            ? "bg-accent/15 border-accent text-accent"
                            : "bg-white/5 border-white/10 text-brand-300 hover:bg-white/10"
                        }`}
                      >
                        <span className="text-2xl">👦</span>
                        <span className="text-xs font-medium">Boy</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const updated: BioPage = { ...profile, avatarType: "girl" };
                          setProfile(updated);
                          handleSaveProfile(updated);
                        }}
                        className={`p-3 rounded-2xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                          profile.avatarType === "girl"
                            ? "bg-accent/15 border-accent text-accent"
                            : "bg-white/5 border-white/10 text-brand-300 hover:bg-white/10"
                        }`}
                      >
                        <span className="text-2xl">👧</span>
                        <span className="text-xs font-medium">Girl</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const updated: BioPage = { ...profile, avatarType: "initials" };
                          setProfile(updated);
                          handleSaveProfile(updated);
                        }}
                        className={`p-3 rounded-2xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                          profile.avatarType === "initials"
                            ? "bg-accent/15 border-accent text-accent"
                            : "bg-white/5 border-white/10 text-brand-300 hover:bg-white/10"
                        }`}
                      >
                        <div className="w-7 h-7 rounded-full bg-accent/20 flex items-center justify-center font-bold text-xs text-accent">
                          {profile.displayName.charAt(0) || "U"}
                        </div>
                        <span className="text-xs font-medium">Initials</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setProfile({ ...profile, avatarType: "custom" });
                        }}
                        className={`p-3 rounded-2xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                          profile.avatarType === "custom"
                            ? "bg-accent/15 border-accent text-accent"
                            : "bg-white/5 border-white/10 text-brand-300 hover:bg-white/10"
                        }`}
                      >
                        <span className="text-2xl">🖼️</span>
                        <span className="text-xs font-medium">Custom</span>
                      </button>
                    </div>

                    {profile.avatarType === "custom" && (
                      <div className="mt-4 p-4 rounded-2xl bg-black/40 border border-white/10 space-y-4">
                        {/* Hidden file input */}
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/png,image/jpeg,image/webp,image/gif"
                          onChange={handleAvatarFileUpload}
                          className="hidden"
                        />

                        {/* Upload Card / Dropzone */}
                        <div>
                          <label className="block text-xs font-semibold text-brand-300 uppercase tracking-wider mb-2">
                            Upload Avatar Photo
                          </label>

                          <div className="flex flex-col sm:flex-row items-center gap-4 p-3.5 rounded-2xl bg-zinc-900/80 border border-dashed border-white/20 hover:border-accent/40 transition-all">
                            {/* Avatar Preview thumbnail */}
                            <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-accent/40 bg-zinc-800 shrink-0 flex items-center justify-center shadow-lg">
                              {profile.avatarUrl ? (
                                <Image
                                  src={profile.avatarUrl}
                                  alt="Custom Avatar Preview"
                                  fill
                                  sizes="64px"
                                  className="object-cover"
                                  unoptimized
                                />
                              ) : (
                                <Camera className="w-6 h-6 text-brand-400" />
                              )}
                              {uploadingAvatar && (
                                <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                                  <Loader2 className="w-5 h-5 animate-spin text-accent" />
                                </div>
                              )}
                            </div>

                            {/* Action Buttons */}
                            <div className="flex-1 text-center sm:text-left">
                              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                                <button
                                  type="button"
                                  onClick={() => fileInputRef.current?.click()}
                                  disabled={uploadingAvatar}
                                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-accent hover:bg-accent-hover text-black font-bold text-xs transition-all shadow-md cursor-pointer disabled:opacity-50"
                                >
                                  {uploadingAvatar ? (
                                    <>
                                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                      <span>Uploading...</span>
                                    </>
                                  ) : (
                                    <>
                                      <Upload className="w-3.5 h-3.5" />
                                      <span>{profile.avatarUrl ? "Change Photo" : "Upload Image"}</span>
                                    </>
                                  )}
                                </button>

                                {profile.avatarUrl && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const updated: BioPage = { ...profile, avatarUrl: "" };
                                      setProfile(updated);
                                      handleSaveProfile(updated);
                                    }}
                                    className="px-3 py-2 rounded-xl border border-white/10 hover:border-red-500/40 hover:bg-red-500/10 text-brand-400 hover:text-red-400 text-xs font-semibold transition-all cursor-pointer"
                                  >
                                    Remove
                                  </button>
                                )}
                              </div>
                              <p className="text-[11px] text-brand-400 mt-1.5">
                                PNG, JPG, WebP, or GIF up to 5MB (auto-cropped to square)
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Divider */}
                        <div className="relative flex items-center justify-center">
                          <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-white/10" />
                          </div>
                          <span className="relative px-3 bg-zinc-900 text-[10px] font-semibold text-brand-400 uppercase tracking-wider">
                            Or Paste Direct Image Link
                          </span>
                        </div>

                        {/* Custom Image URL input */}
                        <div>
                          <label className="block text-xs text-brand-400 mb-1">Custom Image URL</label>
                          <input
                            type="url"
                            value={profile.avatarUrl || ""}
                            onChange={(e) => setProfile({ ...profile, avatarUrl: e.target.value })}
                            onBlur={() => handleSaveProfile({ ...profile, avatarUrl: profile.avatarUrl })}
                            placeholder="https://images.unsplash.com/... or your image link"
                            className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/10 text-white placeholder-brand-500 text-xs focus:outline-none focus:border-accent font-mono"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Display Name Input */}
                  <div>
                    <label className="block text-xs font-semibold text-brand-300 uppercase tracking-wider mb-1.5">
                      Display Name
                    </label>
                    <input
                      type="text"
                      value={profile.displayName}
                      onChange={(e) => setProfile({ ...profile, displayName: e.target.value })}
                      onBlur={() => handleSaveProfile({ ...profile, displayName: profile.displayName })}
                      maxLength={60}
                      className="w-full px-4 py-3 rounded-xl bg-black/60 border border-white/10 text-white placeholder-brand-500 text-sm focus:outline-none focus:border-accent"
                    />
                  </div>

                  {/* Bio Textarea */}
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="text-xs font-semibold text-brand-300 uppercase tracking-wider">
                        Bio / Headline
                      </label>
                      <span className="text-[11px] text-brand-500 font-mono">
                        {(profile.bio || "").length} / 300
                      </span>
                    </div>
                    <textarea
                      value={profile.bio}
                      onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                      onBlur={() => handleSaveProfile({ ...profile, bio: profile.bio })}
                      maxLength={300}
                      rows={3}
                      placeholder="Tell visitors about yourself, your mission, or what they will find here..."
                      className="w-full px-4 py-3 rounded-xl bg-black/60 border border-white/10 text-white placeholder-brand-500 text-sm focus:outline-none focus:border-accent resize-none"
                    />
                  </div>
                </div>

                {/* 2. Theme Selection Grid */}
                <div className="rounded-3xl bg-zinc-900/60 border border-white/10 p-6 space-y-4">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Palette className="w-4 h-4 text-accent" />
                    <span>Themes &amp; Aesthetics</span>
                  </h3>
                  <p className="text-xs text-brand-400">
                    Choose a curated theme designed to wow your audience across dark, cyberpunk, neon, and minimal styles.
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                    {(Object.keys(BIO_THEMES) as BioThemeId[]).map((themeKey) => {
                      const t = BIO_THEMES[themeKey];
                      const isSelected = profile.theme === themeKey;
                      return (
                        <button
                          key={themeKey}
                          type="button"
                          onClick={() => {
                            const updated: BioPage = { ...profile, theme: themeKey };
                            setProfile(updated);
                            handleSaveProfile(updated);
                          }}
                          className={`p-3 rounded-2xl border text-left transition-all relative overflow-hidden group cursor-pointer ${
                            isSelected
                              ? "border-accent ring-2 ring-accent/30 shadow-[0_0_20px_rgba(245,158,11,0.25)]"
                              : "border-white/10 hover:border-white/20 bg-zinc-950/60"
                          }`}
                        >
                          {/* Mini Theme Color Visualizer */}
                          <div
                            className="h-14 rounded-xl mb-2.5 flex items-center justify-center p-2 relative overflow-hidden border border-white/10"
                            style={{ backgroundColor: t.previewBg }}
                          >
                            <div
                              className="w-full h-4 rounded-md shadow-sm"
                              style={{ backgroundColor: t.previewAccent, opacity: 0.85 }}
                            />
                            {isSelected && (
                              <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-accent flex items-center justify-center text-black">
                                <Check className="w-3 h-3 stroke-[3]" />
                              </div>
                            )}
                          </div>
                          <h4 className="text-xs font-bold text-white truncate">{t.name}</h4>
                          <p className="text-[10px] text-brand-400 line-clamp-1">{t.description}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Button Styles Selector */}
                <div className="rounded-3xl bg-zinc-900/60 border border-white/10 p-6 space-y-4">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-accent" />
                    <span>Button Styles</span>
                  </h3>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {(Object.keys(BUTTON_STYLES) as ButtonStyle[]).map((btnKey) => {
                      const b = BUTTON_STYLES[btnKey];
                      const isSelected = profile.buttonStyle === btnKey;
                      return (
                        <button
                          key={btnKey}
                          type="button"
                          onClick={() => {
                            const updated: BioPage = { ...profile, buttonStyle: btnKey };
                            setProfile(updated);
                            handleSaveProfile(updated);
                          }}
                          className={`p-3.5 border transition-all cursor-pointer ${b.previewClass} ${
                            isSelected
                              ? "border-accent bg-accent/15 text-white ring-2 ring-accent/30"
                              : "border-white/10 hover:border-white/20 text-brand-300 bg-white/5"
                          }`}
                        >
                          <div className="text-xs font-semibold text-center">{b.name}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 4. Linktree-Style Custom Color Customizer */}
                <CustomColorCustomizer
                  currentTheme={profile.theme}
                  customColors={profile.customColors}
                  useCustomColors={profile.useCustomColors}
                  saving={saving}
                  onChange={(newColors, isCustom) => {
                    setProfile((prev) =>
                      prev
                        ? {
                            ...prev,
                            customColors: newColors,
                            useCustomColors: isCustom,
                          }
                        : null
                    );
                  }}
                  onSave={(newColors, isCustom) => {
                    const updated: BioPage = {
                      ...profile,
                      customColors: newColors,
                      useCustomColors: isCustom,
                    };
                    setProfile(updated);
                    handleSaveProfile(updated);
                  }}
                />
              </div>
            )}

            {/* TAB 3: SOCIAL ICONS */}
            {activeTab === "socials" && (
              <div className="rounded-3xl bg-zinc-900/60 border border-white/10 p-6 space-y-5 animate-fadeIn">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Share2 className="w-4 h-4 text-accent" />
                    <span>Social Media Channels</span>
                  </h3>
                  <p className="text-xs text-brand-400 mt-1">
                    These appear as a prominent row of interactive icons directly below your bio.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { key: "instagram", label: "Instagram", placeholder: "https://instagram.com/username or @username", icon: <InstagramIcon className="w-4 h-4 text-[#e1306c]" /> },
                    { key: "youtube", label: "YouTube", placeholder: "https://youtube.com/@channel", icon: <YouTubeIcon className="w-4 h-4 text-[#ff0000]" /> },
                    { key: "twitter", label: "Twitter / X", placeholder: "https://twitter.com/handle", icon: <TwitterIcon className="w-4 h-4 text-white" /> },
                    { key: "linkedin", label: "LinkedIn", placeholder: "https://linkedin.com/in/username", icon: <LinkedInIcon className="w-4 h-4 text-[#0077b5]" /> },
                    { key: "github", label: "GitHub", placeholder: "https://github.com/username", icon: <GitHubIcon className="w-4 h-4 text-white" /> },
                    { key: "telegram", label: "Telegram", placeholder: "https://t.me/username", icon: <TelegramIcon className="w-4 h-4 text-[#0088cc]" /> },
                    { key: "whatsapp", label: "WhatsApp", placeholder: "https://wa.me/phonenumber", icon: <MessageCircle className="w-4 h-4 text-[#25d366]" /> },
                    { key: "spotify", label: "Spotify", placeholder: "https://open.spotify.com/...", icon: <SpotifyIcon className="w-4 h-4 text-[#1db954]" /> },
                    { key: "discord", label: "Discord", placeholder: "https://discord.gg/invite", icon: <DiscordIcon className="w-4 h-4 text-[#5865f2]" /> },
                    { key: "facebook", label: "Facebook", placeholder: "https://facebook.com/username or @username", icon: <FacebookIcon className="w-4 h-4 text-[#1877f2]" /> },
                    { key: "tiktok", label: "TikTok", placeholder: "https://tiktok.com/@username or @username", icon: <TikTokIcon className="w-4 h-4 text-white" /> },
                    { key: "email", label: "Email", placeholder: "yourname@domain.com", icon: <Mail className="w-4 h-4 text-amber-400" /> },
                  ].map((item) => (
                    <div key={item.key}>
                      <label className="text-xs font-semibold text-brand-300 flex items-center gap-1.5 mb-1.5">
                        {item.icon}
                        <span>{item.label}</span>
                      </label>
                      <input
                        type="text"
                        value={((profile.socials as any)?.[item.key] as string) || ""}
                        onChange={(e) => {
                          const updated = {
                            ...(profile.socials || {}),
                            [item.key]: e.target.value,
                          };
                          setProfile({ ...profile, socials: updated });
                        }}
                        onBlur={() => handleSaveProfile({ ...profile, socials: profile.socials })}
                        placeholder={item.placeholder}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/10 text-white placeholder-brand-500 text-xs focus:outline-none focus:border-accent"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 4: SETTINGS & ANALYTICS */}
            {activeTab === "settings" && (
              <div className="space-y-6 animate-fadeIn">
                {/* Time-series Analytics Chart */}
                <div className="rounded-3xl bg-zinc-900/60 border border-white/10 p-6">
                  <AnalyticsChart
                    currentViews={profile.views || 0}
                    currentClicks={profile.totalClicks || 0}
                  />
                </div>

                {/* Publish / Unpublish Toggle */}
                <div className="rounded-3xl bg-zinc-900/60 border border-white/10 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h4 className="text-base font-bold text-white">Publication Status</h4>
                    <p className="text-xs text-brand-400 mt-0.5">
                      {profile.isPublished
                        ? "Your page is public and accessible to anyone via your link."
                        : "Your page is currently unpublished. Visitors will see a placeholder."}
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      const next = !profile.isPublished;
                      const updated: BioPage = { ...profile, isPublished: next };
                      setProfile(updated);
                      handleSaveProfile(updated);
                      showToast(next ? "Page published live!" : "Page unpublished to draft", "info");
                    }}
                    className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                      profile.isPublished
                        ? "bg-emerald-500/20 border border-emerald-500 text-emerald-300 hover:bg-emerald-500/30"
                        : "bg-amber-500 text-black hover:bg-amber-400"
                    }`}
                  >
                    {profile.isPublished ? "Published (Live) — Click to Unpublish" : "Unpublished — Click to Publish"}
                  </button>
                </div>

                {/* Share + QR code */}
                <div className="rounded-3xl bg-zinc-900/60 border border-white/10 p-6 space-y-3">
                  <h4 className="text-base font-bold text-white">Share Your Profile</h4>
                  <p className="text-xs text-brand-400">
                    Add this link to your Instagram bio, TikTok, Twitter/X, YouTube description, and WhatsApp status:
                  </p>
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-black/60 border border-white/10 font-mono text-xs text-accent">
                    <span className="truncate flex-1">{publicUrl}</span>
                    <button
                      onClick={handleCopyLink}
                      className="px-3 py-1.5 rounded-lg bg-accent text-black font-bold text-[11px] hover:bg-accent-hover transition-colors shrink-0"
                    >
                      {copiedLink ? "Copied!" : "Copy"}
                    </button>
                  </div>

                  {/* QR Code trigger */}
                  <button
                    onClick={() => setShowQRModal(true)}
                    className="w-full py-2.5 px-4 rounded-xl border border-white/10 hover:bg-white/5 text-sm font-semibold text-brand-300 hover:text-white transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <QrCode className="w-4 h-4 text-accent" />
                    <span>Generate QR Code for this Profile</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT: Phone Preview */}
          <div className="hidden lg:block lg:col-span-4 xl:col-span-4 sticky top-28">
            <div className="flex items-center justify-between mb-3 px-2">
              <span className="text-xs font-semibold text-brand-400 uppercase tracking-wider flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-accent" />
                <span>Live Interactive Preview</span>
              </span>
              <span className="text-[11px] text-brand-500 font-mono">Real-time sync</span>
            </div>

            {/* Phone Case Container */}
            <div className="relative mx-auto w-[320px] h-[640px] rounded-[44px] p-3 bg-zinc-900 border-[6px] border-zinc-800 shadow-[0_25px_60px_rgba(0,0,0,0.8)] overflow-hidden">
              {/* Dynamic Island / Speaker Notch */}
              <div className="absolute top-5 left-1/2 -translate-x-1/2 w-24 h-4 rounded-full bg-black z-30 flex items-center justify-center">
                <div className="w-2.5 h-2.5 rounded-full bg-zinc-800" />
              </div>

              {/* Screen Content inside phone frame */}
              <div
                className={`w-full h-full rounded-[34px] overflow-y-auto px-4 py-6 relative ${!previewCustomColors ? activeTheme.backgroundClass : ""}`}
                style={{ scrollbarWidth: "none", ...(previewCustomColors?.backgroundGradient ? { background: previewCustomColors.backgroundGradient } : previewCustomColors?.backgroundColor ? { backgroundColor: previewCustomColors.backgroundColor } : {}) }}
              >
                {/* Top preview controls bar (website logo on left, share button on right) */}
                <div className="flex items-center justify-between mb-3 pt-2">
                  <div className="h-7 w-7 rounded-full bg-black/20 border border-white/15 backdrop-blur-md flex items-center justify-center shadow-sm">
                    <Image
                      src="/favicon.ico"
                      alt="Hiii Nishant"
                      width={14}
                      height={14}
                      className="w-3.5 h-3.5 object-contain"
                      unoptimized
                    />
                  </div>
                  <div className="h-7 w-7 rounded-full bg-black/20 border border-white/15 backdrop-blur-md flex items-center justify-center text-white/80 shadow-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 256 256">
                      <path d="M216,112v96a16,16,0,0,1-16,16H56a16,16,0,0,1-16-16V112A16,16,0,0,1,56,96H80a8,8,0,0,1,0,16H56v96H200V112H176a8,8,0,0,1,0-16h24A16,16,0,0,1,216,112ZM93.66,69.66,120,43.31V136a8,8,0,0,0,16,0V43.31l26.34,26.35a8,8,0,0,0,11.32-11.32l-40-40a8,8,0,0,0-11.32,0l-40,40A8,8,0,0,0,93.66,69.66Z" />
                    </svg>
                  </div>
                </div>

                {/* Header profile */}
                <div className="text-center mb-6">
                  <div
                    className={`w-20 h-20 rounded-full mx-auto mb-3 flex items-center justify-center text-2xl font-black overflow-hidden ${!previewCustomColors?.accentColor ? activeTheme.avatarBorder : "border-2 shadow-lg"}`}
                    style={{ backgroundColor: previewCustomColors?.backgroundColor || activeTheme.previewBg, ...(previewCustomColors?.accentColor ? { borderColor: previewCustomColors.accentColor, boxShadow: `0 0 20px ${previewCustomColors.accentColor}40` } : {}) }}
                  >
                    {profile.avatarType === "girl" ? (
                      "👧"
                    ) : profile.avatarType === "boy" ? (
                      "👦"
                    ) : profile.avatarType === "custom" && profile.avatarUrl ? (
                      <Image
                        src={profile.avatarUrl}
                        alt={profile.displayName}
                        width={80}
                        height={80}
                        unoptimized
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className={!previewCustomColors?.accentColor ? activeTheme.accentClass : ""} style={previewCustomColors?.accentColor ? { color: previewCustomColors.accentColor } : undefined}>
                        {profile.displayName.charAt(0) || "U"}
                      </span>
                    )}
                  </div>

                  <h3
                    className={`text-base font-extrabold tracking-tight ${!previewCustomColors?.textColor ? activeTheme.textPrimary : ""}`}
                    style={previewCustomColors?.textColor ? { color: previewCustomColors.textColor } : undefined}
                  >
                    {profile.displayName || "Your Name"}
                  </h3>
                  <p
                    className={`text-xs font-mono mt-0.5 opacity-80 ${!previewCustomColors?.accentColor ? activeTheme.accentClass : ""}`}
                    style={previewCustomColors?.accentColor ? { color: previewCustomColors.accentColor } : undefined}
                  >
                    {profile.username}
                  </p>
                  {profile.bio && (
                    <p
                      className={`text-xs mt-2 leading-relaxed px-2 ${!previewCustomColors?.textColor ? activeTheme.textSecondary : ""}`}
                      style={previewCustomColors?.textColor ? { color: previewCustomColors.textColor, opacity: 0.85 } : undefined}
                    >
                      {profile.bio}
                    </p>
                  )}

                  {/* Social icons row preview — all 12 platforms */}
                  {profile.socials && Object.values(profile.socials).some(Boolean) && (
                    <div className="flex flex-wrap items-center justify-center gap-2 mt-3.5">
                      {profile.socials.instagram && <InstagramIcon className="w-3.5 h-3.5 opacity-80" />}
                      {profile.socials.youtube && <YouTubeIcon className="w-3.5 h-3.5 opacity-80" />}
                      {profile.socials.twitter && <TwitterIcon className="w-3.5 h-3.5 opacity-80" />}
                      {profile.socials.linkedin && <LinkedInIcon className="w-3.5 h-3.5 opacity-80" />}
                      {profile.socials.github && <GitHubIcon className="w-3.5 h-3.5 opacity-80" />}
                      {profile.socials.telegram && <TelegramIcon className="w-3.5 h-3.5 opacity-80" />}
                      {profile.socials.whatsapp && <MessageCircle className="w-3.5 h-3.5 text-[#25d366] opacity-80" />}
                      {profile.socials.spotify && <SpotifyIcon className="w-3.5 h-3.5 opacity-80" />}
                      {profile.socials.discord && <DiscordIcon className="w-3.5 h-3.5 opacity-80" />}
                      {profile.socials.facebook && <FacebookIcon className="w-3.5 h-3.5 opacity-80" />}
                      {profile.socials.tiktok && <TikTokIcon className="w-3.5 h-3.5 opacity-80" />}
                      {profile.socials.email && <Mail className="w-3.5 h-3.5 text-amber-400 opacity-80" />}
                    </div>
                  )}
                </div>

                {/* Links List in Phone */}
                <div className="space-y-2.5 pb-10">
                  {profile.links.filter((l) => l.isActive).length === 0 ? (
                    <div className="p-4 rounded-xl border border-dashed border-white/10 text-center text-xs opacity-50">
                      No active links
                    </div>
                  ) : (
                    profile.links
                      .filter((l) => l.isActive)
                      .map((l) => (
                        <div
                          key={l.id}
                          className={`w-full py-3 px-3.5 text-center transition-all flex items-center justify-between gap-2 ${activeButtonStyle.previewClass} ${!previewCustomColors ? activeTheme.cardClass : "border hover:scale-[1.01] shadow-lg"}`}
                          style={previewCustomColors ? { backgroundColor: previewCustomColors.buttonColor, borderColor: previewCustomColors.buttonColor ? `${previewCustomColors.buttonColor}40` : undefined } : undefined}
                        >
                          <div
                            className="w-5 h-5 flex items-center justify-center opacity-80"
                            style={previewCustomColors?.buttonTextColor ? { color: previewCustomColors.buttonTextColor } : undefined}
                          >
                            {renderBioIcon(l.icon, "w-3.5 h-3.5")}
                          </div>
                          <span
                            className="text-xs font-bold truncate flex-1 text-center"
                            style={previewCustomColors?.buttonTextColor ? { color: previewCustomColors.buttonTextColor } : undefined}
                          >
                            {l.title}
                          </span>
                          <div className="w-5 h-5 flex items-center justify-center opacity-60">
                            <MoreVertical className="w-3.5 h-3.5" />
                          </div>
                        </div>
                      ))
                  )}
                </div>

                {/* Footer branding pill inside phone */}
                <div className="text-center pt-2 pb-4">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-[9px] font-semibold text-white/80">
                    <span>hiiinishant</span>
                    <span>•</span>
                    <span>Create your link</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Phone Preview Modal */}
      {showMobilePreview && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 lg:hidden animate-fadeIn">
          <div className="relative w-full max-w-[340px] max-h-[90vh] flex flex-col items-center">
            <button
              onClick={() => setShowMobilePreview(false)}
              className="absolute -top-12 right-0 p-2 rounded-full bg-white/10 text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="w-[310px] h-[580px] rounded-[40px] p-2.5 bg-zinc-900 border-4 border-zinc-700 shadow-2xl overflow-hidden">
              <div
                className={`w-full h-full rounded-[32px] overflow-y-auto px-4 py-8 relative ${!previewCustomColors ? activeTheme.backgroundClass : ""}`}
                style={previewCustomColors?.backgroundGradient ? { background: previewCustomColors.backgroundGradient } : previewCustomColors?.backgroundColor ? { backgroundColor: previewCustomColors.backgroundColor } : undefined}
              >
                <div className="text-center mb-6 pt-2">
                  <div
                    className={`w-16 h-16 rounded-full mx-auto mb-2 flex items-center justify-center text-xl font-bold overflow-hidden ${!previewCustomColors?.accentColor ? activeTheme.avatarBorder : "border-2 shadow-lg"}`}
                    style={{ backgroundColor: previewCustomColors?.backgroundColor || activeTheme.previewBg, ...(previewCustomColors?.accentColor ? { borderColor: previewCustomColors.accentColor, boxShadow: `0 0 16px ${previewCustomColors.accentColor}40` } : {}) }}
                  >
                    {profile.avatarType === "girl"
                      ? "👧"
                      : profile.avatarType === "boy"
                      ? "👦"
                      : profile.avatarType === "custom" && profile.avatarUrl ? (
                        <Image
                          src={profile.avatarUrl}
                          alt={profile.displayName}
                          width={64}
                          height={64}
                          unoptimized
                          className="w-full h-full object-cover"
                        />
                      )
                      : profile.displayName.charAt(0) || "U"}
                  </div>
                  <h3
                    className={`text-sm font-bold ${!previewCustomColors?.textColor ? activeTheme.textPrimary : ""}`}
                    style={previewCustomColors?.textColor ? { color: previewCustomColors.textColor } : undefined}
                  >
                    {profile.displayName}
                  </h3>
                  <p
                    className={`text-[11px] font-mono opacity-80 ${!previewCustomColors?.accentColor ? activeTheme.accentClass : ""}`}
                    style={previewCustomColors?.accentColor ? { color: previewCustomColors.accentColor } : undefined}
                  >
                    {profile.username}
                  </p>
                  {/* Social icons row in mobile preview */}
                  {profile.socials && Object.values(profile.socials).some(Boolean) && (
                    <div className="flex flex-wrap items-center justify-center gap-1.5 mt-2.5">
                      {profile.socials.instagram && <InstagramIcon className="w-3 h-3 opacity-80" />}
                      {profile.socials.youtube && <YouTubeIcon className="w-3 h-3 opacity-80" />}
                      {profile.socials.twitter && <TwitterIcon className="w-3 h-3 opacity-80" />}
                      {profile.socials.linkedin && <LinkedInIcon className="w-3 h-3 opacity-80" />}
                      {profile.socials.github && <GitHubIcon className="w-3 h-3 opacity-80" />}
                      {profile.socials.telegram && <TelegramIcon className="w-3 h-3 opacity-80" />}
                      {profile.socials.whatsapp && <MessageCircle className="w-3 h-3 text-[#25d366] opacity-80" />}
                      {profile.socials.spotify && <SpotifyIcon className="w-3 h-3 opacity-80" />}
                      {profile.socials.discord && <DiscordIcon className="w-3 h-3 opacity-80" />}
                      {profile.socials.facebook && <FacebookIcon className="w-3 h-3 opacity-80" />}
                      {profile.socials.tiktok && <TikTokIcon className="w-3 h-3 opacity-80" />}
                      {profile.socials.email && <Mail className="w-3 h-3 text-amber-400 opacity-80" />}
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  {profile.links
                    .filter((l) => l.isActive)
                    .map((l) => (
                      <div
                        key={l.id}
                        className={`w-full py-2.5 px-3 text-center flex items-center justify-between text-xs font-semibold ${activeButtonStyle.previewClass} ${!previewCustomColors ? activeTheme.cardClass : "border shadow"}`}
                        style={previewCustomColors ? { backgroundColor: previewCustomColors.buttonColor, color: previewCustomColors.buttonTextColor, borderColor: previewCustomColors.buttonColor ? `${previewCustomColors.buttonColor}40` : undefined } : undefined}
                      >
                        <span className="truncate flex-1">{l.title}</span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {showQRModal && profile && (
        <QRCodeModal
          username={profile.username}
          displayName={profile.displayName}
          onClose={() => setShowQRModal(false)}
        />
      )}
    </div>
  );
}
