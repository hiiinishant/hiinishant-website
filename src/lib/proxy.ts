import { NextResponse } from "next/server";

export async function proxyRequest(request: Request, path: string) {
  const backendUrl = process.env.BACKEND_URL;
  if (!backendUrl) {
    console.error("❌ BACKEND_URL is not set in environment variables.");
    return NextResponse.json({ error: "Backend URL is not configured." }, { status: 500 });
  }

  // Trim trailing slash from backendUrl and leading slash from path
  const normalizedBackendUrl = backendUrl.endsWith("/") ? backendUrl.slice(0, -1) : backendUrl;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = `${normalizedBackendUrl}${normalizedPath}`;
  const method = request.method;

  // Prepare headers
  const headers = new Headers();
  request.headers.forEach((value, key) => {
    headers.set(key, value);
  });

  const options: RequestInit = {
    method,
    headers,
  };

  // Forward body if request has one
  if (method !== "GET" && method !== "HEAD") {
    try {
      options.body = await request.text();
    } catch (e) {
      // Body is empty or unreadable
    }
  }

  try {
    const res = await fetch(url, options);
    
    // Read response body as JSON if possible, otherwise text
    const contentType = res.headers.get("content-type") || "";
    let data;
    if (contentType.includes("application/json")) {
      data = await res.json();
    } else {
      data = await res.text();
    }

    return NextResponse.json(data, { status: res.status });
  } catch (error: any) {
    console.error(`❌ Error proxying request to backend ${url}:`, error);
    return NextResponse.json(
      { error: error.message || "Failed to communicate with backend service." },
      { status: 502 }
    );
  }
}
