import { proxyRequest } from "@/lib/proxy";

export async function GET(request: Request) {
  return proxyRequest(request, "/api/updates");
}

export async function POST(request: Request) {
  return proxyRequest(request, "/api/updates");
}

export async function DELETE(request: Request) {
  return proxyRequest(request, "/api/updates");
}
