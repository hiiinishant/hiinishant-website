import { proxyRequest } from "@/lib/proxy";

export async function POST(request: Request) {
  return proxyRequest(request, "/api/auth/login");
}
