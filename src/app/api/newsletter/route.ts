import { proxyRequest } from "@/lib/proxy";

export async function GET(request: Request) {
  return proxyRequest(request, "/api/newsletter");
}

export async function POST(request: Request) {
  return proxyRequest(request, "/api/newsletter");
}
