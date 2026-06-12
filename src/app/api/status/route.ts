import { proxyRequest } from "@/lib/proxy";

export async function GET(request: Request) {
  return proxyRequest(request, "/api/status");
}

export async function POST(request: Request) {
  return proxyRequest(request, "/api/status");
}

export async function DELETE(request: Request) {
  return proxyRequest(request, "/api/status");
}
