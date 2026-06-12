import { proxyRequest } from "@/lib/proxy";

export async function GET(request: Request) {
  return proxyRequest(request, "/api/contact");
}

export async function POST(request: Request) {
  return proxyRequest(request, "/api/contact");
}

export async function PATCH(request: Request) {
  return proxyRequest(request, "/api/contact");
}

export async function DELETE(request: Request) {
  return proxyRequest(request, "/api/contact");
}
