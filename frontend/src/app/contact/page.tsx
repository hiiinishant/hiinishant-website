import type { Metadata } from "next";
import ContactClientPage from "./ContactClientPage";

export const metadata: Metadata = {
  title: "Contact & Collaborations",
  description:
    "Get in touch with Nishant Kumar. Whether you are looking for partnerships, speaking engagements, or educational resource collaborations, send a message.",
  alternates: {
    canonical: "/contact",
  },
};

export default function ContactPage() {
  return <ContactClientPage />;
}
