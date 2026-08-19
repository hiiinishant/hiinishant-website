import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service — Hiii Nishant",
  description:
    "Terms of Service for Hiii Nishant and 2 AM Study — the personal platform of Nishant Kumar.",
  alternates: { canonical: "https://hiiinishant.com/terms" },
};

export default function TermsPage() {
  return (
    <main className="min-h-screen pt-10 sm:pt-14 pb-20 px-5 sm:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 text-white text-xs font-semibold mb-3">
            📜 Terms of Service
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white mb-3">Terms of Service</h1>
          <p className="text-brand-400 text-sm">Last updated: August 2026</p>
        </div>

        <div className="space-y-6 text-brand-200 text-sm sm:text-base leading-relaxed">
          <div className="glass-strong border border-white/10 rounded-2xl p-5 sm:p-6 space-y-3">
            <h2 className="text-white font-bold text-base">1. Acceptance of Terms</h2>
            <p>
              By accessing or using Hiii Nishant (<strong>hiiinishant.com</strong>), you agree to be bound by these Terms of Service. If you do not agree to these terms, please discontinue use of this website.
            </p>
          </div>

          <div className="glass-strong border border-white/10 rounded-2xl p-5 sm:p-6 space-y-3">
            <h2 className="text-white font-bold text-base">2. Use of Content</h2>
            <p>
              All content on this website — including blog posts, videos, resources, tools, and design elements — is the intellectual property of Nishant Kumar unless otherwise stated. You may not reproduce, distribute, or commercialize any content without prior written permission.
            </p>
          </div>

          <div className="glass-strong border border-white/10 rounded-2xl p-5 sm:p-6 space-y-3">
            <h2 className="text-white font-bold text-base">3. Voluntary Contributions</h2>
            <p>
              Any financial contributions made via the Support page are entirely voluntary. Contributions do not constitute a purchase of any product or service. All resources on this platform remain free for all users regardless of contributions.
            </p>
          </div>

          <div className="glass-strong border border-white/10 rounded-2xl p-5 sm:p-6 space-y-3">
            <h2 className="text-white font-bold text-base">4. Third-Party Links</h2>
            <p>
              This website may contain links to third-party websites (YouTube, Instagram, Razorpay, etc.). We are not responsible for the privacy practices or content of those websites.
            </p>
          </div>

          <div className="glass-strong border border-white/10 rounded-2xl p-5 sm:p-6 space-y-3">
            <h2 className="text-white font-bold text-base">5. Disclaimer</h2>
            <p>
              This website is provided &quot;as is&quot; without warranties of any kind. Nishant Kumar is not liable for any damages arising from the use or inability to use this website.
            </p>
          </div>

          <div className="glass-strong border border-white/10 rounded-2xl p-5 sm:p-6 space-y-3">
            <h2 className="text-white font-bold text-base">6. Contact</h2>
            <p>
              For any questions regarding these terms, please use the{" "}
              <Link href="/contact" className="text-accent hover:underline">
                Contact page
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
