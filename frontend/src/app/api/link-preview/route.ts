import { NextRequest, NextResponse } from "next/server";

interface LinkPreviewData {
  title?: string | null;
  description?: string | null;
  image?: string | null;
  domain: string;
}

// In-memory cache for fast repeat lookups
const previewCache = new Map<string, { data: LinkPreviewData; timestamp: number }>();
const CACHE_TTL = 1000 * 60 * 60; // 1 hour

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get("url");

  if (!targetUrl) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
  }

  // Normalize URL
  let parsedUrl: URL;
  try {
    const raw = targetUrl.startsWith("http://") || targetUrl.startsWith("https://")
      ? targetUrl
      : `https://${targetUrl}`;
    parsedUrl = new URL(raw);
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  const cleanUrl = parsedUrl.toString();
  const domain = parsedUrl.hostname.replace(/^www\./, "");

  // Check cache
  const cached = previewCache.get(cleanUrl);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return NextResponse.json(cached.data);
  }

  try {
    // 1. Try querying microlink API for rich OpenGraph data
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4500);

    const microRes = await fetch(
      `https://api.microlink.io?url=${encodeURIComponent(cleanUrl)}`,
      {
        signal: controller.signal,
        headers: {
          Accept: "application/json",
        },
        next: { revalidate: 3600 },
      }
    );
    clearTimeout(timeout);

    if (microRes.ok) {
      const json = await microRes.json();
      if (json?.status === "success" && json.data) {
        const preview: LinkPreviewData = {
          title: json.data.title || null,
          description: json.data.description || null,
          image: json.data.image?.url || json.data.logo?.url || null,
          domain,
        };

        previewCache.set(cleanUrl, { data: preview, timestamp: Date.now() });
        return NextResponse.json(preview);
      }
    }
  } catch {
    // Fallback if microlink is unreachable or times out
  }

  // Fallback: Return basic domain and Google favicon
  const fallback: LinkPreviewData = {
    title: null,
    description: null,
    image: `https://www.google.com/s2/favicons?domain=${parsedUrl.hostname}&sz=128`,
    domain,
  };

  previewCache.set(cleanUrl, { data: fallback, timestamp: Date.now() });
  return NextResponse.json(fallback);
}
