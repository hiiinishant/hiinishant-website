import { redirect } from "next/navigation";
import { getAvailableMonths } from "@/data/statusServer";

export const dynamic = "force-dynamic";

export default async function MonthlyRootPage() {
  const months = await getAvailableMonths();
  const targetMonth = months[0]?.key || new Date().toISOString().slice(0, 7);
  redirect(`/status/monthly/${targetMonth}`);
}
