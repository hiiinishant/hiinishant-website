"use client";

import Link from "next/link";
import {
  ShieldCheck,
  Lock,
  Database,
  Cookie,
  Server,
  UserCheck,
  Mail,
  ArrowRight,
  Eye,
  FileText,
  Clock,
  Sparkles,
  HelpCircle,
} from "lucide-react";

export default function PrivacyClientPage() {
  const effectiveDate = "July 22, 2026";

  const quickHighlights = [
    {
      icon: ShieldCheck,
      title: "No Data Selling",
      desc: "We never sell, rent, or trade your personal information to third parties or advertisers.",
      color: "from-emerald-500/20 to-emerald-500/5 text-emerald-400 border-emerald-500/20",
    },
    {
      icon: Database,
      title: "Minimal Collection",
      desc: "We only collect data strictly necessary to deliver our educational and interactive features.",
      color: "from-blue-500/20 to-blue-500/5 text-blue-400 border-blue-500/20",
    },
    {
      icon: Lock,
      title: "Enterprise Security",
      desc: "Protected by SSL/TLS encryption and Google Firebase's secure cloud infrastructure.",
      color: "from-amber-500/20 to-amber-500/5 text-amber-400 border-amber-500/20",
    },
    {
      icon: UserCheck,
      title: "Full User Control",
      desc: "You can view, edit, or request complete deletion of your account and personal data anytime.",
      color: "from-purple-500/20 to-purple-500/5 text-purple-400 border-purple-500/20",
    },
  ];

  const sections = [
    {
      id: "information-collected",
      icon: Eye,
      title: "1. Information We Collect",
      content: (
        <div className="space-y-4 text-brand-300 leading-relaxed text-sm">
          <p>
            We collect information to provide better services, enable community features, and respond to your inquiries. The information we collect falls into two main categories:
          </p>
          <div className="space-y-3 mt-3">
            <div className="p-4 rounded-xl border border-white/5 bg-white/2">
              <h4 className="font-semibold text-white text-sm mb-1.5 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-accent inline-block" />
                Information You Provide Directly
              </h4>
              <ul className="list-disc list-inside space-y-1 text-xs text-brand-400">
                <li><strong className="text-brand-200">Contact Form Submissions:</strong> Your name, email address, message subject, and message content when sending a inquiry via our contact form.</li>
                <li><strong className="text-brand-200">Community Account Details:</strong> Display name, username, bio, and chosen avatar when registering on our NSGram community platform.</li>
                <li><strong className="text-brand-200">Newsletter Subscription:</strong> Email address provided when subscribing to blog updates or site announcements.</li>
                <li><strong className="text-brand-200">Interactive Contributions:</strong> Comments, post likes, daily quiz entries, and chat messages submitted across the website.</li>
              </ul>
            </div>

            <div className="p-4 rounded-xl border border-white/5 bg-white/2">
              <h4 className="font-semibold text-white text-sm mb-1.5 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-accent inline-block" />
                Information Collected Automatically
              </h4>
              <ul className="list-disc list-inside space-y-1 text-xs text-brand-400">
                <li><strong className="text-brand-200">Technical Device Data:</strong> IP address, browser type, operating system version, and general location metrics.</li>
                <li><strong className="text-brand-200">Usage Telemetry:</strong> Pages viewed, time spent on articles, daily visitor count statistics, and referral URLs.</li>
              </ul>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "how-we-use",
      icon: FileText,
      title: "2. How We Use Your Information",
      content: (
        <div className="space-y-3 text-brand-300 leading-relaxed text-sm">
          <p>
            Your information is used exclusively to operate, maintain, and enhance the platform. Specifically, we use collected data for:
          </p>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3 text-xs">
            <li className="p-3 rounded-xl border border-white/5 bg-white/2 text-brand-300">
              <strong className="text-white block mb-1">Service Delivery</strong>
              Enabling login, comments, quiz leaderboards, personal profile customization, and real-time community chat.
            </li>
            <li className="p-3 rounded-xl border border-white/5 bg-white/2 text-brand-300">
              <strong className="text-white block mb-1">Communication</strong>
              Responding directly to contact messages, feedback requests, or partnership inquiries via email.
            </li>
            <li className="p-3 rounded-xl border border-white/5 bg-white/2 text-brand-300">
              <strong className="text-white block mb-1">Updates & Newsletters</strong>
              Sending major announcements, new blog articles, and educational content (only when opted-in).
            </li>
            <li className="p-3 rounded-xl border border-white/5 bg-white/2 text-brand-300">
              <strong className="text-white block mb-1">Platform Security</strong>
              Monitoring against malicious activity, preventing spam comments, and protecting user authentication routes.
            </li>
          </ul>
        </div>
      ),
    },
    {
      id: "cookies-storage",
      icon: Cookie,
      title: "3. Cookies and Local Storage",
      content: (
        <div className="space-y-3 text-brand-300 leading-relaxed text-sm">
          <p>
            We use minimal cookies and local browser storage mechanisms to enhance your experience and keep you authenticated.
          </p>
          <div className="space-y-2 text-xs">
            <div className="p-3 rounded-lg border border-white/5 bg-white/2">
              <span className="text-white font-medium">Authentication Tokens (Firebase Session):</span> Kept in secure cookies/storage to keep registered users logged in without requiring repeated credentials.
            </div>
            <div className="p-3 rounded-lg border border-white/5 bg-white/2">
              <span className="text-white font-medium">LocalStorage Preferences:</span> Remembers your UI preferences (e.g. dark/light theme, daily quiz status, temporary draft text).
            </div>
            <div className="p-3 rounded-lg border border-white/5 bg-white/2">
              <span className="text-white font-medium">Third-Party Embedded Cookies:</span> Pages containing YouTube video embeds or external media may place functional cookies governed by Google&apos;s Privacy Policy.
            </div>
          </div>
          <p className="text-xs text-brand-400 italic">
            You can configure your browser to reject cookies or clear local storage at any time. Basic reading of public portfolio pages and blogs will continue to work normally.
          </p>
        </div>
      ),
    },
    {
      id: "third-parties",
      icon: Server,
      title: "4. Third-Party Services & Subprocessors",
      content: (
        <div className="space-y-3 text-brand-300 leading-relaxed text-sm">
          <p>
            To deliver a fast, reliable, and modern web application, we utilize trusted third-party service providers. These services process data strictly on our behalf:
          </p>
          <div className="overflow-x-auto mt-3">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-white font-semibold">
                  <th className="py-2 px-3">Service</th>
                  <th className="py-2 px-3">Purpose</th>
                  <th className="py-2 px-3">Privacy Reference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-brand-400">
                <tr>
                  <td className="py-2.5 px-3 font-medium text-white">Google Firebase</td>
                  <td className="py-2.5 px-3">Authentication, Cloud Firestore DB, and file storage</td>
                  <td className="py-2.5 px-3">
                    <a href="https://firebase.google.com/support/privacy" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
                      Firebase Privacy
                    </a>
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-medium text-white">Google / YouTube</td>
                  <td className="py-2.5 px-3">Embedded video playlists, fonts, &amp; YouTube API feeds</td>
                  <td className="py-2.5 px-3">
                    <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
                      Google Privacy
                    </a>
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-medium text-white">Vercel &amp; Render</td>
                  <td className="py-2.5 px-3">Frontend hosting, serverless edge functions, &amp; REST API deployment</td>
                  <td className="py-2.5 px-3">
                    <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
                      Vercel Privacy
                    </a>
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-medium text-white">Cloudinary</td>
                  <td className="py-2.5 px-3">Image hosting, optimization, and media delivery CDN</td>
                  <td className="py-2.5 px-3">
                    <a href="https://cloudinary.com/privacy" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
                      Cloudinary Privacy
                    </a>
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-medium text-white">Nodemailer / SMTP</td>
                  <td className="py-2.5 px-3">Delivering contact form messages to admin inbox</td>
                  <td className="py-2.5 px-3 text-brand-500">Secure SMTP transport</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      ),
    },
    {
      id: "data-security",
      icon: Lock,
      title: "5. Data Security & Retention",
      content: (
        <div className="space-y-3 text-brand-300 leading-relaxed text-sm">
          <p>
            We take administrative, technical, and physical security measures to guard your data against unauthorized access, loss, or alteration.
          </p>
          <ul className="list-disc list-inside space-y-1 text-xs text-brand-400">
            <li><strong className="text-white">Encryption in Transit:</strong> All HTTP communication is strictly encrypted via SSL/TLS (HTTPS).</li>
            <li><strong className="text-white">Access Control & Rules:</strong> Firebase Security Rules strictly restrict database reads and writes to authorized users.</li>
            <li><strong className="text-white">Data Retention:</strong> We retain personal account data only as long as your account remains active. Contact form emails are deleted once inquiries are resolved.</li>
          </ul>
        </div>
      ),
    },
    {
      id: "user-rights",
      icon: UserCheck,
      title: "6. User Rights & Data Control",
      content: (
        <div className="space-y-3 text-brand-300 leading-relaxed text-sm">
          <p>
            Regardless of your jurisdiction, we grant all users the following data privacy rights:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs mt-2">
            <div className="p-3 rounded-lg border border-white/5 bg-white/2">
              <strong className="text-white block mb-0.5">Right to Access</strong>
              Request a copy of the personal information stored in your user profile or messages.
            </div>
            <div className="p-3 rounded-lg border border-white/5 bg-white/2">
              <strong className="text-white block mb-0.5">Right to Erasure</strong>
              Request full deletion of your user account, comments, and community profile.
            </div>
            <div className="p-3 rounded-lg border border-white/5 bg-white/2">
              <strong className="text-white block mb-0.5">Right to Correction</strong>
              Update or correct any outdated display name, username, or bio in your account settings.
            </div>
            <div className="p-3 rounded-lg border border-white/5 bg-white/2">
              <strong className="text-white block mb-0.5">Right to Opt-Out</strong>
              Unsubscribe from newsletter emails at any time using the link in the footer or email footers.
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "childrens-privacy",
      icon: HelpCircle,
      title: "7. Children's Privacy",
      content: (
        <div className="space-y-2 text-brand-300 leading-relaxed text-sm">
          <p>
            Hiii Nishant (hiiinishant.com) provides personal portfolio and educational content intended for general audiences. We do not knowingly collect personal identifiable information from children under the age of 13.
          </p>
          <p className="text-xs text-brand-400">
            If you are a parent or guardian and believe your child has provided us with personal information without consent, please contact us immediately so we can remove the data.
          </p>
        </div>
      ),
    },
    {
      id: "effective-date",
      icon: Clock,
      title: "8. Effective Date & Policy Updates",
      content: (
        <div className="space-y-2 text-brand-300 leading-relaxed text-sm">
          <p>
            This Privacy Policy is effective as of <span className="text-white font-medium">{effectiveDate}</span>.
          </p>
          <p className="text-xs text-brand-400">
            We may periodically update this policy to reflect changes in our features, legal requirements, or technology. Any material changes will be announced on our Latest Updates page or updated directly on this page.
          </p>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen pt-10 sm:pt-14 pb-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
      {/* ─── HERO HEADER ─── */}
      <div className="text-center space-y-3 mb-8 sm:mb-10">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-accent/30 bg-accent/10 text-accent text-xs font-semibold tracking-wide uppercase">
          <ShieldCheck className="w-4 h-4" />
          Data Protection &amp; Trust
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
          Privacy <span className="text-gradient">Policy</span>
        </h1>

        <p className="text-base sm:text-lg text-brand-300 max-w-2xl mx-auto leading-relaxed">
          Clear, transparent details on how Hiii Nishant (hiiinishant.com) collects, protects, and respects your personal data.
        </p>

        <div className="inline-flex items-center gap-4 text-xs text-brand-400 pt-2 border-t border-white/10">
          <span className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-accent" />
            Effective Date: <strong className="text-white font-medium">{effectiveDate}</strong>
          </span>
          <span>·</span>
          <span>Last Updated: <strong className="text-white font-medium">{effectiveDate}</strong></span>
        </div>
      </div>

      {/* ─── QUICK HIGHLIGHTS GRID ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 sm:mb-10">
        {quickHighlights.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              className={`p-5 rounded-2xl border bg-gradient-to-b backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] ${item.color}`}
            >
              <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-3">
                <Icon className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-white text-base mb-1">{item.title}</h3>
              <p className="text-xs text-brand-300 leading-relaxed">{item.desc}</p>
            </div>
          );
        })}
      </div>

      {/* ─── MAIN CONTENT SECTIONS ─── */}
      <div className="space-y-8">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <section
              key={section.id}
              id={section.id}
              className="p-6 sm:p-8 rounded-2xl border border-white/10 bg-brand-900/40 backdrop-blur-md transition-colors duration-300 hover:border-white/20"
            >
              <div className="flex items-center gap-3 mb-4 pb-3 border-b border-white/10">
                <div className="w-9 h-9 rounded-lg bg-accent/15 border border-accent/30 flex items-center justify-center text-accent shrink-0">
                  <Icon className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-white tracking-tight">
                  {section.title}
                </h2>
              </div>
              {section.content}
            </section>
          );
        })}
      </div>

      {/* ─── CONTACT SECTION ─── */}
      <div className="mt-14 p-8 rounded-3xl border border-accent/30 bg-gradient-to-br from-accent/10 via-brand-900/60 to-black text-center space-y-5 relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-48 h-48 rounded-full bg-accent/20 blur-3xl pointer-events-none" />

        <div className="w-12 h-12 rounded-2xl bg-accent/20 border border-accent/40 flex items-center justify-center mx-auto text-accent">
          <Mail className="w-6 h-6" />
        </div>

        <h2 className="text-2xl font-bold text-white">Have Privacy Questions?</h2>
        <p className="text-sm text-brand-300 max-w-xl mx-auto leading-relaxed">
          If you have any questions regarding this Privacy Policy, your rights, or data deletion requests, feel free to reach out directly.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <a
            href="mailto:hiiinishant@gmail.com"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-black font-semibold text-sm hover:bg-accent-light transition-all duration-300 shadow-lg glow-sm"
          >
            <Mail className="w-4 h-4" />
            Email Nishant (hiiinishant@gmail.com)
          </a>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-white/20 bg-white/5 text-white font-medium text-sm hover:bg-white/10 transition-all duration-300"
          >
            Contact Form
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
