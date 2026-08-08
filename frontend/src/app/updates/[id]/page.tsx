import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllUpdates } from "@/data/updatesServer";

interface UpdatePageProps {
  params: Promise<{ id: string }>;
}

function getExternalLabel(category: string) {
  return category === "video" ? "Watch on YouTube" : "View on Instagram";
}

function getYouTubeEmbedUrl(href?: string) {
  if (!href) return undefined;
  const match = href.match(/[?&]v=([^&]+)/) || href.match(/youtu\.be\/([^?&]+)/) || href.match(/shorts\/([^?&]+)/);
  return match?.[1] ? `https://www.youtube.com/embed/${match[1]}` : undefined;
}

export async function generateStaticParams() {
  const updates = await getAllUpdates();
  return updates.map((update) => ({ id: update.id }));
}

export async function generateMetadata({ params }: UpdatePageProps): Promise<Metadata> {
  const { id } = await params;
  const updates = await getAllUpdates();
  const update = updates.find((item) => item.id === id);

  if (!update) {
    return {
      title: "Update Not Found",
    };
  }

  const title = `${update.title} — Nishant Kumar Update`;
  const image = update.thumbnail || "/profile.jpg";

  return {
    title,
    description: update.description,
    keywords: [
      update.title,
      "Hiii Nishant YouTube video",
      "hiiinishant latest update",
      "Nishant Kumar video",
      "Nishant Kumar updates",
      update.badge || "",
      update.meta || "",
    ].filter(Boolean),
    alternates: {
      canonical: `/updates/${update.id}`,
    },
    openGraph: {
      title,
      description: update.description,
      url: `/updates/${update.id}`,
      type: "article",
      publishedTime: update.date,
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: update.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: update.description,
      images: [image],
      creator: "@hiiinishant",
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
  };
}

export default async function UpdateDetailPage({ params }: UpdatePageProps) {
  const { id } = await params;
  const updates = await getAllUpdates();
  const update = updates.find((item) => item.id === id);

  if (!update) notFound();

  const isVideo = update.category === "video";
  const embedUrl = isVideo ? getYouTubeEmbedUrl(update.href) : undefined;
  const image = update.thumbnail || "/profile.jpg";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": isVideo ? "VideoObject" : "SocialMediaPosting",
    "name": update.title,
    "headline": update.title,
    "description": update.description,
    "thumbnailUrl": image,
    "uploadDate": update.date,
    "datePublished": update.date,
    "url": `https://hiiinishant.com/updates/${update.id}`,
    ...(embedUrl ? { "embedUrl": embedUrl } : {}),
    "author": {
      "@type": "Person",
      "name": "Nishant Kumar",
      "url": "https://hiiinishant.com",
    },
    "publisher": {
      "@type": "Person",
      "name": "Nishant Kumar",
      "url": "https://hiiinishant.com",
    },
    "sameAs": update.href ? [update.href] : [],
  };

  return (
    <article className="pt-8 pb-24 lg:pt-10 lg:pb-32 relative overflow-hidden noise">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] rounded-full bg-accent/5 blur-[120px]" />
      </div>

      <div className="max-w-4xl mx-auto px-5 sm:px-8 relative z-10">
        <Link
          href="/updates"
          className="inline-flex items-center gap-1.5 text-sm text-brand-400 hover:text-accent transition-colors mb-8 group"
        >
          <span className="group-hover:-translate-x-1 transition-transform duration-200">←</span>
          Back to Updates
        </Link>

        <div className="glass-strong rounded-3xl border border-white/10 overflow-hidden">
          <div className="relative aspect-video bg-brand-900">
            <Image
              src={image}
              alt={update.title}
              fill
              priority
              sizes="(min-width: 1024px) 896px, 100vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent" />
            <div className="absolute left-5 bottom-5 flex items-center gap-2">
              {update.badge && (
                <span className="rounded-full border border-white/15 bg-black/50 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white backdrop-blur">
                  {update.badge}
                </span>
              )}
              <span className="rounded-full border border-white/15 bg-black/50 px-3 py-1 text-[11px] font-semibold text-brand-200 backdrop-blur">
                {isVideo ? "YouTube" : "Instagram"}
              </span>
            </div>
          </div>

          <div className="p-6 sm:p-8 lg:p-10">
            <div className="flex flex-wrap items-center gap-3 text-xs text-brand-500 mb-5">
              <time dateTime={update.date}>
                {new Date(update.date).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </time>
              {update.meta && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>{update.meta}</span>
                </>
              )}
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight mb-5">
              {update.title}
            </h1>
            <p className="text-base sm:text-lg text-brand-300 leading-relaxed mb-8">
              {update.description}
            </p>

            {update.href && (
              <a
                href={update.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-xl bg-accent hover:bg-accent-hover px-5 py-3 text-sm font-semibold text-black transition-all hover:-translate-y-0.5 hover:shadow-[0_0_30px_rgba(245,158,11,0.3)]"
              >
                {getExternalLabel(update.category)}
              </a>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
