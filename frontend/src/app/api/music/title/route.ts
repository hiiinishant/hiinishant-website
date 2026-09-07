import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const videoId = searchParams.get("videoId");

  if (!videoId || !/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
    return NextResponse.json({ error: "Invalid video ID" }, { status: 400 });
  }

  try {
    // 1. Try oEmbed
    const oembedRes = await fetch(
      `https://www.youtube.com/oembed?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${videoId}`)}&format=json`,
      { next: { revalidate: 86400 } }
    );
    if (oembedRes.ok) {
      const data = await oembedRes.json();
      if (data.title) {
        return NextResponse.json(
          { title: data.title },
          { headers: { "Cache-Control": "public, max-age=86400, s-maxage=604800" } }
        );
      }
    }
  } catch {}

  try {
    // 2. Server-side fetch watch page HTML (bypasses CORS restrictions)
    const res = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
      },
      next: { revalidate: 86400 },
    });

    if (res.ok) {
      const html = await res.text();
      const ogMatch = html.match(/<meta\s+property="og:title"\s+content="([^"]+)"/i);
      let title = ogMatch ? ogMatch[1] : "";
      if (!title) {
        const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
        if (titleMatch) {
          title = titleMatch[1].replace(/\s*-\s*YouTube\s*$/i, "").trim();
        }
      }
      if (title) {
        return NextResponse.json(
          { title },
          { headers: { "Cache-Control": "public, max-age=86400, s-maxage=604800" } }
        );
      }
    }
  } catch {}

  return NextResponse.json({ error: "Title not found" }, { status: 404 });
}
