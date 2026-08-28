"use client";

import Link from "next/link";
import {
  Trash2,
  ShieldAlert,
  Mail,
  Clock,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  FileText,
  Database,
  User,
} from "lucide-react";

export default function DeleteAccountClientPage() {
  const steps = [
    {
      step: "01",
      icon: Mail,
      title: "Send a Deletion Request",
      description:
        "Email us at hiiinishant@gmail.com from the email address registered to your account. Use the subject line \"Account Deletion Request\" so we can locate and process your request quickly.",
      color: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    },
    {
      step: "02",
      icon: User,
      title: "Identity Verification",
      description:
        "We will verify that the request comes from the account owner by confirming your registered email and, if needed, your display name or username. This protects you against unauthorised deletions.",
      color: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    },
    {
      step: "03",
      icon: Clock,
      title: "Processing Period",
      description:
        "Once verified, we will process your deletion request within 7 business days. You will receive a confirmation email when the process is complete.",
      color: "text-purple-400 bg-purple-500/10 border-purple-500/20",
    },
    {
      step: "04",
      icon: CheckCircle,
      title: "Deletion Confirmed",
      description:
        "Your account and associated personal data will be permanently removed. This action cannot be undone.",
      color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    },
  ];

  const whatGetsDeleted = [
    {
      icon: User,
      label: "Account Profile",
      detail: "Display name, username, bio, avatar preference, and email address.",
    },
    {
      icon: Database,
      label: "Community Content",
      detail: "All NSGram posts, comments, and likes authored by you.",
    },
    {
      icon: Mail,
      label: "Messages",
      detail: "One-to-one chat history sent or received through the community.",
    },
    {
      icon: FileText,
      label: "Activity & Quiz Data",
      detail: "Daily quiz entries, scores, and leaderboard records tied to your account.",
    },
  ];

  const whatStays = [
    "Public blog comments may be anonymised rather than deleted if removal would break threading for other users.",
    "Contact form submissions you sent before requesting deletion (required for legal record-keeping).",
    "Aggregate, non-identifiable analytics such as visitor counts.",
  ];

  return (
    <div className="min-h-screen pt-10 sm:pt-14 pb-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">

      {/* ─── HERO HEADER ─── */}
      <div className="text-center space-y-3 mb-10 sm:mb-12">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-red-500/30 bg-red-500/10 text-red-400 text-xs font-semibold tracking-wide uppercase">
          <Trash2 className="w-4 h-4" />
          Account Deletion
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
          Delete Your{" "}
          <span className="text-gradient">Account</span>
        </h1>

        <p className="text-base sm:text-lg text-brand-300 max-w-2xl mx-auto leading-relaxed">
          You have the right to permanently delete your Hiii Nishant account and
          all associated personal data. This page explains exactly how to submit
          a deletion request and what happens next.
        </p>

        <div className="inline-flex items-center gap-2 text-xs text-brand-400 pt-1">
          <Clock className="w-3.5 h-3.5 text-accent" />
          <span>
            Requests processed within{" "}
            <strong className="text-white font-medium">7 business days</strong>
          </span>
        </div>
      </div>

      {/* ─── WARNING NOTICE ─── */}
      <div className="mb-10 p-5 rounded-2xl border border-red-500/25 bg-red-500/8 flex gap-4">
        <div className="shrink-0 w-10 h-10 rounded-xl bg-red-500/15 border border-red-500/25 flex items-center justify-center text-red-400">
          <AlertTriangle className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-red-300">
            This action is permanent and cannot be undone.
          </p>
          <p className="text-xs text-brand-400 leading-relaxed">
            Once your account is deleted, all associated data described below
            will be removed from our systems. You will not be able to recover
            your posts, messages, or quiz history. If you only want a break,
            you can simply log out and stop using the platform — no deletion is
            required.
          </p>
        </div>
      </div>

      {/* ─── HOW TO REQUEST DELETION ─── */}
      <section
        id="how-to-delete"
        className="mb-10 p-6 sm:p-8 rounded-2xl border border-white/10 bg-brand-900/40 backdrop-blur-md hover:border-white/20 transition-colors duration-300"
      >
        <div className="flex items-center gap-3 mb-6 pb-3 border-b border-white/10">
          <div className="w-9 h-9 rounded-lg bg-accent/15 border border-accent/30 flex items-center justify-center text-accent shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            How to Request Account Deletion
          </h2>
        </div>

        <p className="text-sm text-brand-300 mb-6 leading-relaxed">
          We do not currently provide an automated self-service deletion button.
          All deletion requests are handled manually to verify identity and
          ensure complete data removal. Follow the four steps below:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {steps.map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.step}
                className={`p-5 rounded-xl border ${s.color} bg-gradient-to-b from-white/3 to-transparent`}
              >
                <div className="flex items-start gap-3 mb-3">
                  <span className="text-2xl font-black opacity-30 leading-none">
                    {s.step}
                  </span>
                  <div
                    className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 ${s.color}`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                </div>
                <h3 className="font-bold text-white text-sm mb-1.5">
                  {s.title}
                </h3>
                <p className="text-xs text-brand-300 leading-relaxed">
                  {s.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div className="mt-6 flex flex-wrap gap-3">
          <a
            href="mailto:hiiinishant@gmail.com?subject=Account%20Deletion%20Request&body=Hi%20Nishant%2C%0A%0AI%20would%20like%20to%20permanently%20delete%20my%20Hiii%20Nishant%20account.%0A%0ARegistered%20Email%3A%20%5Byour%20email%5D%0AUsername%3A%20%5Byour%20username%5D%0A%0APlease%20delete%20all%20associated%20data.%0A%0AThank%20you."
            id="deletion-email-btn"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-red-500/90 hover:bg-red-500 text-white font-semibold text-sm transition-all duration-300 shadow-lg"
          >
            <Mail className="w-4 h-4" />
            Email Deletion Request
          </a>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-white/20 bg-white/5 hover:bg-white/10 text-white font-medium text-sm transition-all duration-300"
          >
            Use Contact Form
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* ─── WHAT GETS DELETED ─── */}
      <section
        id="what-gets-deleted"
        className="mb-10 p-6 sm:p-8 rounded-2xl border border-white/10 bg-brand-900/40 backdrop-blur-md hover:border-white/20 transition-colors duration-300"
      >
        <div className="flex items-center gap-3 mb-5 pb-3 border-b border-white/10">
          <div className="w-9 h-9 rounded-lg bg-accent/15 border border-accent/30 flex items-center justify-center text-accent shrink-0">
            <Trash2 className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            What Data Will Be Deleted
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
          {whatGetsDeleted.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                className="p-4 rounded-xl border border-white/5 bg-white/2 flex items-start gap-3"
              >
                <div className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center text-accent shrink-0 mt-0.5">
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <strong className="text-white text-sm block mb-0.5">
                    {item.label}
                  </strong>
                  <p className="text-xs text-brand-400 leading-relaxed">
                    {item.detail}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* What stays */}
        <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5">
          <p className="text-xs font-semibold text-amber-300 mb-2 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" />
            Data That May Be Retained
          </p>
          <ul className="space-y-1.5">
            {whatStays.map((item, i) => (
              <li key={i} className="text-xs text-brand-400 flex items-start gap-2">
                <span className="text-amber-500 mt-0.5 shrink-0">·</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ─── PRIVACY POLICY LINK ─── */}
      <section
        id="related-policies"
        className="mb-10 p-6 sm:p-8 rounded-2xl border border-white/10 bg-brand-900/40 backdrop-blur-md hover:border-white/20 transition-colors duration-300"
      >
        <div className="flex items-center gap-3 mb-4 pb-3 border-b border-white/10">
          <div className="w-9 h-9 rounded-lg bg-accent/15 border border-accent/30 flex items-center justify-center text-accent shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Related Policies
          </h2>
        </div>
        <p className="text-sm text-brand-300 leading-relaxed mb-4">
          Account deletion is part of your rights under our Privacy Policy. You
          can read the full policy, including the{" "}
          <Link
            href="/privacy#user-rights"
            className="text-accent hover:text-accent-light underline underline-offset-2 font-medium"
          >
            User Rights &amp; Data Control section
          </Link>
          , for complete details on data access, correction, and opt-out rights.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/privacy"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-white font-medium text-sm transition-all duration-300"
          >
            <FileText className="w-4 h-4" />
            Privacy Policy
          </Link>
          <Link
            href="/terms"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-white font-medium text-sm transition-all duration-300"
          >
            <FileText className="w-4 h-4" />
            Terms of Service
          </Link>
        </div>
      </section>

      {/* ─── CONTACT CTA ─── */}
      <div className="mt-4 p-8 rounded-3xl border border-accent/30 bg-gradient-to-br from-accent/10 via-brand-900/60 to-black text-center space-y-5 relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-48 h-48 rounded-full bg-accent/20 blur-3xl pointer-events-none" />

        <div className="w-12 h-12 rounded-2xl bg-accent/20 border border-accent/40 flex items-center justify-center mx-auto text-accent">
          <Mail className="w-6 h-6" />
        </div>

        <h2 className="text-2xl font-bold text-white">
          Questions About Your Data?
        </h2>
        <p className="text-sm text-brand-300 max-w-xl mx-auto leading-relaxed">
          If you have any questions about the deletion process, what data we
          hold, or your privacy rights, feel free to reach out directly.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <a
            href="mailto:hiiinishant@gmail.com"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-black font-semibold text-sm hover:bg-accent-light transition-all duration-300 shadow-lg glow-sm"
          >
            <Mail className="w-4 h-4" />
            hiiinishant@gmail.com
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
