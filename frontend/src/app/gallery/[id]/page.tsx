import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getGalleryPhotoById } from "@/data/galleryServer";
import SinglePhotoClientPage from "./SinglePhotoClientPage";

interface Props {
  params: Promise<{ id: string }>;
}

function formatDateLabel(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "Asia/Kolkata",
    });
  } catch {
    return dateStr;
  }
}

// ── Dynamic Metadata for Google Search & Images ───────────────────────────────
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const photo = await getGalleryPhotoById(id);

  if (!photo) {
    return {
      title: "Gallery Photo — Nishant Kumar",
      description: "Photo memory from Nishant Kumar's gallery.",
    };
  }

  const dateLabel = formatDateLabel(photo.date);
  const titleText = `${photo.title} — Nishant Kumar Gallery`;
  const descText = `${photo.story || photo.title}. Photo memory from ${photo.category} (${dateLabel}) by Nishant Kumar (hiiinishant).`;

  return {
    title: titleText,
    description: descText,
    keywords: [
      photo.title,
      `Nishant Kumar ${photo.category}`,
      "Nishant Kumar photos",
      "hiiinishant gallery",
      "2 AM Study founder photos",
      "Chandigarh University photo",
    ],
    alternates: {
      canonical: `/gallery/${id}`,
    },
    openGraph: {
      title: titleText,
      description: descText,
      url: `https://hiiinishant.com/gallery/${id}`,
      type: "article",
      images: [
        {
          url: photo.imageUrl,
          width: 1200,
          height: 630,
          alt: `${photo.title} — Nishant Kumar`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: titleText,
      description: descText,
      images: [photo.imageUrl],
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

// ── ImageObject JSON-LD Schema (Google Image Search) ─────────────────────────
function buildImageSchema(photo: NonNullable<Awaited<ReturnType<typeof getGalleryPhotoById>>>) {
  return {
    "@context": "https://schema.org",
    "@type": "ImageObject",
    name: photo.title,
    description: photo.story || photo.title,
    contentUrl: photo.imageUrl,
    url: `https://hiiinishant.com/gallery/${photo.id}`,
    datePublished: photo.date,
    keywords: `Nishant Kumar, hiiinishant, ${photo.category}, ${photo.title}`,
    author: {
      "@type": "Person",
      name: "Nishant Kumar",
      url: "https://hiiinishant.com",
    },
    copyrightHolder: {
      "@type": "Person",
      name: "Nishant Kumar",
    },
  };
}

// ── Page Component ────────────────────────────────────────────────────────────
export default async function SingleGalleryPhotoPage({ params }: Props) {
  const { id } = await params;
  const photo = await getGalleryPhotoById(id);

  if (!photo) {
    notFound();
  }

  const imageSchema = buildImageSchema(photo);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(imageSchema) }}
      />
      <SinglePhotoClientPage photo={photo} />
    </>
  );
}
