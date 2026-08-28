import type { Metadata } from "next";
import DeleteAccountClientPage from "./DeleteAccountClientPage";

export const metadata: Metadata = {
  title: "Delete Account | Hiii Nishant",
  description:
    "Request deletion of your Hiii Nishant account and associated personal data.",
  keywords: [
    "delete account",
    "Hiii Nishant",
    "account deletion",
    "remove data",
    "hiiinishant.com",
    "data erasure",
  ],
  alternates: {
    canonical: "https://hiiinishant.com/delete-account",
  },
  robots: {
    index: false, // deletion pages should not be indexed / surfaced in search
    follow: false,
  },
  openGraph: {
    title: "Delete Account | Hiii Nishant",
    description:
      "Request deletion of your Hiii Nishant account and associated personal data.",
    url: "https://hiiinishant.com/delete-account",
    siteName: "Hiii Nishant",
    type: "website",
  },
};

export default function DeleteAccountPage() {
  return <DeleteAccountClientPage />;
}
