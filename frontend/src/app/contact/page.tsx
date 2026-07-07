import type { Metadata } from "next";
import ContactClientPage from "./ContactClientPage";

export const metadata: Metadata = {
  title: "Contact Nishant Kumar — Collaborations & Partnerships",
  description:
    "Get in touch with Nishant Kumar (hiiinishant), founder of 2 AM Study. Open for collaborations, speaking engagements, edtech partnerships, and educational content projects. Student entrepreneur from Chandigarh University.",
  keywords: [
    "contact Nishant Kumar",
    "nishant kumar email",
    "hiiinishant contact",
    "2 AM Study collaboration",
    "nishant kumar speaking",
    "edtech partnership India",
  ],
  alternates: {
    canonical: "/contact",
  },
  openGraph: {
    title: "Contact Nishant Kumar — hiiinishant",
    description: "Reach out to Nishant Kumar, founder of 2 AM Study, for collaborations, partnerships, and speaking opportunities.",
    url: "https://hiiinishant.com/contact",
  },
};

export default function ContactPage() {
  return <ContactClientPage />;
}
