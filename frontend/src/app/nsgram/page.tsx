import type { Metadata } from "next";
import NsgramApp from "@/components/nsgram/NsgramApp";

export const metadata: Metadata = {
  title: "NSGram — Nishant Kumar's Community Social Platform",
  description:
    "NSGram is the official community platform for Nishant Kumar (hiiinishant). Connect with students, follow updates, like posts, comment, and chat in real time. Join the 2 AM Study community.",
  keywords: [
    "NSGram",
    "nsgram",
    "Nishant Kumar community",
    "hiiinishant community",
    "2 AM Study community",
    "nsgram social platform",
    "student social platform India",
  ],
  alternates: {
    canonical: "https://hiiinishant.com/nsgram",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    title: "NSGram — Nishant Kumar's Community Platform",
    description:
      "Connect, post, comment, and chat with the hiiinishant community on NSGram. Powered by 2 AM Study.",
    url: "https://hiiinishant.com/nsgram",
    siteName: "Nishant Kumar — hiiinishant",
    type: "website",
  },
};

export default function NsgramPage() {
  return <NsgramApp />;
}
