import type { Metadata } from "next";
import AdminClientPage from "./AdminClientPage";

export const metadata: Metadata = {
  title: "Admin Console — HIII-Nishant",
  description: "Admin dashboard for managing content, updates, and more.",
  robots: "noindex, nofollow",
};

export default function AdminPage() {
  return <AdminClientPage />;
}
