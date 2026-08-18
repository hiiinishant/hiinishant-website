import { redirect } from "next/navigation";
import { getSafeRedirect } from "@/lib/auth-redirect";

export default async function SignupPage({
  searchParams,
}: {
  searchParams?: Promise<{ redirect?: string }> | { redirect?: string };
}) {
  const resolvedParams = await searchParams;
  const safeRedirect = getSafeRedirect(resolvedParams?.redirect, "");
  if (safeRedirect && safeRedirect !== "/") {
    redirect(`/login?mode=signup&redirect=${encodeURIComponent(safeRedirect)}`);
  }
  redirect("/login?mode=signup");
}
