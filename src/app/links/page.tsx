import type { Metadata } from "next";
import LinksClient from "./LinksClient";

export const metadata: Metadata = {
  title: "Social Media Hub | Nishant Kumar",
  description:
    "Connect with Nishant Kumar across platforms. Access all official profiles, startup ventures, writing channels, and community links in one place.",
  keywords: [
    "Nishant Kumar socials",
    "Nishant Kumar Linktree",
    "2 AM Study links",
    "hiiinishant social hub",
  ],
  openGraph: {
    title: "Social Media Hub | Nishant Kumar",
    description: "Access all official profiles, projects, and contact channels in one place.",
  },
};

export default function LinksPage() {
  return (
    <div className="relative min-h-[90vh] flex items-center justify-center overflow-hidden noise">
      {/* Dynamic Background Gradients */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-accent/5 blur-[120px]"></div>
        <div className="absolute bottom-0 left-10 w-[300px] h-[300px] rounded-full bg-blue-500/5 blur-[100px]"></div>
      </div>
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:40px_40px]"></div>

      <div className="w-full relative z-10 py-12">
        <LinksClient />
      </div>
    </div>
  );
}
