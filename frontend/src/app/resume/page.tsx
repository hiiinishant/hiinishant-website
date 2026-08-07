import type { Metadata } from "next";
import ResumeClientPage from "./ResumeClientPage";

export const metadata: Metadata = {
  title: "Resume & CV — Nishant Kumar | Professional Portfolio",
  description: "View and download Nishant Kumar's official curriculum vitae — B.E. Computer Science graduate, founder of 2 AM Study, edtech entrepreneur from Chandigarh University. Professional experience, skills, and achievements.",
  keywords: [
    "Nishant Kumar resume",
    "hiiinishant CV",
    "2 AM Study founder resume",
    "Nishant Kumar Chandigarh University",
    "edtech founder resume",
    "computer science engineer resume",
    "student entrepreneur CV",
  ],
  alternates: {
    canonical: "/resume",
  },
  openGraph: {
    title: "Resume & CV — Nishant Kumar | Professional Portfolio",
    description: "View and download Nishant Kumar's official curriculum vitae — founder of 2 AM Study, edtech entrepreneur from Chandigarh University.",
    url: "https://hiiinishant.com/resume",
    type: "website",
  },
};

export default function ResumePage() {
  return <ResumeClientPage />;
}
