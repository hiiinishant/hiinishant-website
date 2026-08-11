import type { Metadata } from "next";
import FAQClient from "./FAQClient";

export const metadata: Metadata = {
  title: "FAQ — Frequently Asked Questions | Hiii Nishant",
  description:
    "Frequently asked questions about Hiii Nishant, 2 AM Study, Nishant Kumar, collaborations, and the student educational platform.",
  alternates: { canonical: "https://hiiinishant.com/faq" },
};

export default function FAQPage() {
  return <FAQClient />;
}
