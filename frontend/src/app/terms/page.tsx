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

          {/* ── New sections ─────────────────────────────────────────────── */}

          <div className="glass-strong border border-white/10 rounded-2xl p-5 sm:p-6 space-y-3">
            <h2 className="text-white font-bold text-base">6. User Accounts</h2>
            <p>
              To access features such as the Daily Quiz, Community, and Chat, you must create an account using Firebase Authentication. By creating an account you confirm that:
            </p>
            <ul className="list-disc list-inside space-y-1 text-brand-300">
              <li>You are at least 13 years of age.</li>
              <li>The information you provide is accurate and up to date.</li>
              <li>You are responsible for maintaining the security of your account credentials.</li>
              <li>You will not share your account with or transfer it to any other person.</li>
            </ul>
            <p>
              We reserve the right to suspend or terminate accounts that violate these terms at any time without prior notice.
            </p>
          </div>

          <div className="glass-strong border border-white/10 rounded-2xl p-5 sm:p-6 space-y-3">
            <h2 className="text-white font-bold text-base">7. User-Generated Content</h2>
            <p>
              When you post content on this platform — including community posts, comments, or chat messages — you retain ownership of that content. However, by submitting content you grant Hiii Nishant a non-exclusive, royalty-free licence to display, moderate, and remove that content as necessary to operate the platform.
            </p>
            <p>
              You are solely responsible for the content you post. We do not endorse any user-generated content and accept no liability for it.
            </p>
          </div>

          <div className="glass-strong border border-white/10 rounded-2xl p-5 sm:p-6 space-y-3">
            <h2 className="text-white font-bold text-base">8. Prohibited Content &amp; Conduct</h2>
            <p>You agree not to post, share, or transmit any content that:</p>
            <ul className="list-disc list-inside space-y-1 text-brand-300">
              <li>Is abusive, harassing, threatening, or hateful towards any individual or group.</li>
              <li>Is sexually explicit, violent, or otherwise inappropriate.</li>
              <li>Violates the privacy or intellectual property rights of others.</li>
              <li>Contains spam, unsolicited advertisements, or malicious links.</li>
              <li>Is false, misleading, or impersonates another person.</li>
              <li>Violates any applicable law or regulation.</li>
            </ul>
            <p>
              Violation of this section may result in immediate account suspension or permanent ban without refund of any contributions.
            </p>
          </div>

          <div className="glass-strong border border-white/10 rounded-2xl p-5 sm:p-6 space-y-3">
            <h2 className="text-white font-bold text-base">9. Community &amp; Chat</h2>
            <p>
              The Community and one-to-one Chat features are provided for respectful interaction between registered users. Please be aware that:
            </p>
            <ul className="list-disc list-inside space-y-1 text-brand-300">
              <li>Community posts are limited to 500 characters and must be text only.</li>
              <li>Chat messages are stored permanently in our database and may be reviewed by the site administrator for moderation purposes.</li>
              <li>There are no voice, video, file, or group chat features.</li>
              <li>The administrator reserves the right to delete any post, comment, or message that violates these terms.</li>
            </ul>
          </div>

          <div className="glass-strong border border-white/10 rounded-2xl p-5 sm:p-6 space-y-3">
            <h2 className="text-white font-bold text-base">10. Quiz, XP &amp; Streaks</h2>
            <p>
              The Daily Quiz and subject quizzes award XP points and maintain streak counters for engagement purposes only. Please note:
            </p>
            <ul className="list-disc list-inside space-y-1 text-brand-300">
              <li>XP, streaks, and leaderboard rankings have no monetary value and cannot be exchanged for any product, service, or reward.</li>
              <li>Only today&apos;s Daily Challenge can be answered for XP. Past quizzes are available for review only.</li>
              <li>One attempt per question is allowed. Duplicate submissions will be rejected.</li>
              <li>We reserve the right to reset, adjust, or discontinue the XP and streak system at any time without prior notice.</li>
            </ul>
          </div>

          <div className="glass-strong border border-white/10 rounded-2xl p-5 sm:p-6 space-y-3">
            <h2 className="text-white font-bold text-base">11. Account Termination</h2>
            <p>
              You may delete your account at any time by following the process described on the{" "}
              <Link href="/delete-account" className="text-accent hover:underline">
                Delete Account
              </Link>{" "}
              page.
            </p>
            <p>
              We reserve the right to suspend or permanently terminate your account, without prior notice, if we determine that you have violated these Terms of Service or that your activity poses a risk to other users or the platform.
            </p>
          </div>

          <div className="glass-strong border border-white/10 rounded-2xl p-5 sm:p-6 space-y-3">
            <h2 className="text-white font-bold text-base">12. Governing Law</h2>
            <p>
              These Terms of Service are governed by and construed in accordance with the laws of India. Any disputes arising in connection with these terms shall be subject to the exclusive jurisdiction of the courts in India.
            </p>
          </div>

          <div className="glass-strong border border-white/10 rounded-2xl p-5 sm:p-6 space-y-3">
            <h2 className="text-white font-bold text-base">13. Contact</h2>
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
