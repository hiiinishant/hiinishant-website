import type { Metadata } from "next";
import PrivacyClientPage from "./PrivacyClientPage";

export const metadata: Metadata = {
  title: "Privacy Policy | Hiii Nishant | Nishant Kumar",
  description:
    "Read the Privacy Policy for Hiii Nishant. Learn how we collect, use, store, and protect your personal information when you use hiiinishant.com.",
  keywords: [
    "Privacy Policy",
    "Hiii Nishant",
    "Nishant Kumar",
    "hiiinishant.com",
    "Nishant",
    "privacy",
    "data protection",
    "cookies",
  ],
  alternates: {
    canonical: "https://hiiinishant.com/privacy",
  },
  openGraph: {
    title: "Privacy Policy | Hiii Nishant | Nishant Kumar",
    description:
      "Learn how Hiii Nishant collects, uses, and protects your personal information.",
    url: "https://hiiinishant.com/privacy",
    siteName: "Hiii Nishant",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Privacy Policy | Hiii Nishant | Nishant Kumar",
    description:
      "Learn how Hiii Nishant collects, uses, and protects your personal information.",
  },
};

export default function PrivacyPage() {
  return <PrivacyClientPage />;
}