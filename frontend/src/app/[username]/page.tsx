import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isReservedUsername, normalizeUsername, PublicBioProfile } from "@/types/bio";
import { API_BASE } from "@/lib/api";
import PublicBioClient from "./PublicBioClient";

interface PageProps {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolved = await params;
  const username = normalizeUsername(resolved.username);

  if (isReservedUsername(username)) {
    return {
      title: "Page Not Found",
      robots: { index: false, follow: false },
    };
  }

  try {
    const res = await fetch(`${API_BASE}/api/bio/${encodeURIComponent(username)}`, {
      next: { revalidate: 30 },
    });

    if (!res.ok) {
      return {
        title: "Profile Not Found — Hiii Nishant",
        robots: { index: false, follow: false },
      };
    }

    const profile: PublicBioProfile = await res.json();

    if (!profile.isPublished) {
      return {
        title: `${profile.displayName || username} (@${username}) — Unpublished Page`,
        robots: { index: false, follow: false },
      };
    }

    const title = `${profile.displayName || username} (@${username}) — Links & Socials`;
    const description =
      profile.bio && profile.bio.trim().length > 0
        ? profile.bio.slice(0, 160)
        : `Connect with ${profile.displayName || username} across platforms. Access official links, social channels, and projects in one place.`;

    const siteUrl = "https://hiiinishant.com";

    return {
      title,
      description,
      alternates: {
        canonical: `/${username}`,
      },
      openGraph: {
        title,
        description,
        url: `${siteUrl}/${username}`,
        siteName: "Hiii Nishant",
        type: "profile",
        images: profile.avatarUrl ? [{ url: profile.avatarUrl }] : [{ url: `${siteUrl}/profile.jpg` }],
      },
      twitter: {
        card: "summary",
        title,
        description,
      },
      robots: {
        index: true,
        follow: true,
      },
    };
  } catch (error) {
    return {
      title: "Profile — Hiii Nishant",
      robots: { index: false, follow: false },
    };
  }
}

export default async function UserProfilePage({ params }: PageProps) {
  const resolved = await params;
  const username = normalizeUsername(resolved.username);

  // If user requests a reserved path via dynamic routing, bail out cleanly to standard 404
  if (isReservedUsername(username)) {
    notFound();
  }

  let profile: PublicBioProfile | null = null;

  try {
    const res = await fetch(`${API_BASE}/api/bio/${encodeURIComponent(username)}`, {
      next: { revalidate: 15 },
    });

    if (res.status === 404) {
      notFound();
    }

    if (!res.ok) {
      notFound();
    }

    profile = await res.json();
  } catch (err) {
    notFound();
  }

  if (!profile) {
    notFound();
  }

  return <PublicBioClient initialProfile={profile} />;
}
