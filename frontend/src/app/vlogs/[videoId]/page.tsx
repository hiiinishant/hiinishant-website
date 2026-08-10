import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { apiUrl } from "@/lib/api";
import { ExternalLink, ArrowLeft, Calendar, Tag, Play } from "lucide-react";

interface VlogVideoData {
  id: string;
  videoId: string;
  title: string;
  description?: string;
  uploadDate?: string;
  tags?: string[];
  thumbnail?: string;
}

async function fetchVideo(videoId: string): Promise<VlogVideoData | null> {
  try {
    const res = await fetch(apiUrl(`/api/vlogs/videos/${videoId}`), {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const ct = res.headers.get("content-type");
    if (!ct?.includes("application/json")) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: { videoId: string };
}): Promise<Metadata> {
  const video = await fetchVideo(params.videoId);
  if (!video) {
    return {
      title: "Vlog Not Found — Nishant Kumar",
    };
  }

  const thumbnail =
    video.thumbnail ||
    `https://i.ytimg.com/vi/${video.videoId}/maxresdefault.jpg`;

  const description =
    video.description ||
    `Watch "${video.title}" — an official vlog by Nishant Kumar on hiiinishant.com. Behind the scenes, college life, and the startup journey.`;

  return {
    title: `${video.title} — Nishant Kumar | Vlog`,
    description,
    keywords: [
      ...(video.tags || []),
      "Nishant Kumar vlog",
      "hiiinishant",
      "student founder vlog",
      "Chandigarh University",
      "2 AM Study",
    ],
    alternates: {
      canonical: `/vlogs/${video.videoId}`,
    },
    openGraph: {
      title: `${video.title} — Nishant Kumar`,
      description,
      url: `https://hiiinishant.com/vlogs/${video.videoId}`,
      type: "video.other",
      images: [
        {
          url: thumbnail,
          width: 1280,
          height: 720,
          alt: video.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${video.title} — Nishant Kumar`,
      description,
      images: [thumbnail],
    },
  };
}

export default async function VlogVideoPage({
  params,
}: {
  params: { videoId: string };
}) {
  const video = await fetchVideo(params.videoId);

  if (!video) {
    notFound();
  }

  const thumbnail =
    video.thumbnail ||
    `https://i.ytimg.com/vi/${video.videoId}/maxresdefault.jpg`;

  const embedUrl = `https://www.youtube.com/embed/${video.videoId}?rel=0&modestbranding=1&enablejsapi=1`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: video.title,
    description:
      video.description ||
      `Watch "${video.title}" — an official vlog by Nishant Kumar.`,
    thumbnailUrl: thumbnail,
    uploadDate: video.uploadDate || new Date().toISOString().split("T")[0],
    embedUrl,
    url: `https://hiiinishant.com/vlogs/${video.videoId}`,
    author: {
      "@type": "Person",
      name: "Nishant Kumar",
      url: "https://hiiinishant.com",
    },
    publisher: {
      "@type": "Organization",
      name: "Hiii Nishant",
      url: "https://hiiinishant.com",
    },
    keywords: video.tags?.join(", ") || "Nishant Kumar vlog",
  };

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        {/* Back link */}
        <Link
          href="/vlogs"
          className="inline-flex items-center gap-2 text-xs text-brand-400 hover:text-white transition-colors mb-8 group"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
          Back to Vlogs
        </Link>

        {/* Video Embed */}
        <div className="aspect-video w-full rounded-2xl overflow-hidden border border-white/10 shadow-[0_8px_40px_rgba(0,0,0,0.5)] mb-8 bg-zinc-900">
          <iframe
            src={embedUrl}
            title={video.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="w-full h-full"
          />
        </div>

        {/* Video Info */}
        <div className="space-y-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-white leading-tight">
            {video.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4">
            {/* Upload date */}
            {video.uploadDate && (
              <div className="flex items-center gap-1.5 text-xs text-brand-400">
                <Calendar className="w-3.5 h-3.5" />
                <span>
                  {new Date(video.uploadDate).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </div>
            )}

            {/* YouTube link */}
            <a
              href={`https://www.youtube.com/watch?v=${video.videoId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/10 border border-red-500/20 text-xs font-medium text-red-400 hover:bg-red-500/20 transition-all"
            >
              <Play className="w-3 h-3 fill-current" />
              Watch on YouTube
              <ExternalLink className="w-3 h-3" />
            </a>

            {/* Share on X / Twitter */}
            <a
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Watching "${video.title}" by @hiiinishant 🎬`)}&url=${encodeURIComponent(`https://hiiinishant.com/vlogs/${video.videoId}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-medium text-brand-300 hover:bg-white/10 transition-all"
            >
              Share
            </a>
          </div>

          {/* Description */}
          {video.description && (
            <p className="text-sm text-brand-300 leading-relaxed max-w-2xl border-l-2 border-accent/30 pl-4">
              {video.description}
            </p>
          )}

          {/* Tags */}
          {video.tags && video.tags.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 pt-2">
              <Tag className="w-3.5 h-3.5 text-brand-500 shrink-0" />
              {video.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2.5 py-1 rounded-full bg-accent/8 border border-accent/15 text-[11px] text-accent/80 font-medium"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="border-t border-white/5 my-10" />

        {/* CTA */}
        <div className="text-center space-y-3">
          <p className="text-sm text-brand-400">
            Want to see more vlogs from Nishant?
          </p>
          <Link
            href="/vlogs"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent/10 border border-accent/20 text-sm font-semibold text-accent hover:bg-accent/20 transition-all"
          >
            Browse All Vlogs
          </Link>
        </div>
      </div>
    </main>
  );
}
