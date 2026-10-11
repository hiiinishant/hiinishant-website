import type { Metadata } from "next";
import DashboardClient from "./DashboardClient";

export const metadata: Metadata = {
  title: "Bio Link Studio — Manage Your Profile & Links",
  description:
    "Create and customize your personalized link-in-bio page on Hiii Nishant. Add links, choose themes, and track your audience engagement.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function DashboardPage() {
  return <DashboardClient />;
}
