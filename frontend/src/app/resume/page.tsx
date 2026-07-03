import type { Metadata } from "next";
import ResumeClientPage from "./ResumeClientPage";

export const metadata: Metadata = {
  title: "Resume & Professional CV Vault",
  description:
    "View and download Nishant Kumar's official curriculum vitae, edtech accomplishments, GATE CSE preparation focus, and academic records.",
  alternates: {
    canonical: "/resume",
  },
};

export default function ResumePage() {
  return <ResumeClientPage />;
}
