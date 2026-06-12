"use client";

import { useState } from "react";

interface NewsletterProps {
  variant?: "section" | "inline";
}

export default function Newsletter({ variant = "section" }: NewsletterProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setStatus("loading");

    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Something went wrong.");
      }

      setMessage(data.message || "You're in! Welcome to the journey. 🚀");
      setStatus("success");
      setEmail("");
    } catch (err: any) {
      setMessage(err.message);
      setStatus("error");
    }
  };

  const form = (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        required
        disabled={status === "loading"}
        className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent/50 text-white placeholder-brand-500 text-sm transition-all disabled:opacity-60"
      />
      <button
        type="submit"
        disabled={status === "loading"}
        className="px-6 py-3 rounded-xl bg-accent hover:bg-accent-hover text-black font-semibold text-sm transition-all duration-300 hover:shadow-[0_0_20px_rgba(245,158,11,0.3)] whitespace-nowrap disabled:opacity-60 flex items-center gap-2"
      >
        {status === "loading" ? (
          <>
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Joining…
          </>
        ) : (
          "Subscribe"
        )}
      </button>
    </form>
  );

  if (variant === "inline") {
    return (
      <div>
        {status === "success" ? (
          <p className="text-sm text-accent font-medium">{message}</p>
        ) : (
          <>
            {form}
            {status === "error" && (
              <p className="text-xs text-red-400 mt-2">{message}</p>
            )}
          </>
        )}
      </div>
    );
  }

  return (
    <section id="newsletter" className="py-24 lg:py-32 relative overflow-hidden noise">
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-accent/8 blur-[120px]"></div>
      </div>
      <div className="max-w-3xl mx-auto px-5 sm:px-8 text-center relative z-10">
        <span className="text-xs font-semibold text-accent uppercase tracking-widest mb-4 block">
          Newsletter
        </span>
        <h2 className="text-3xl sm:text-4xl font-bold mb-4">
          Stay in the <span className="text-gradient">loop</span>
        </h2>
        <p className="text-brand-300 mb-8 max-w-xl mx-auto">
          Get updates that actually matter. New posts, resources, and what&apos;s being built — straight to your inbox. No spam, ever.
        </p>
        {status === "success" ? (
          <div className="glass-strong p-6 rounded-2xl inline-block">
            <p className="text-accent font-semibold">{message}</p>
            <p className="text-brand-400 text-sm mt-1">Check your inbox for a welcome note soon.</p>
          </div>
        ) : (
          <div className="max-w-md mx-auto">
            {form}
            {status === "error" && (
              <p className="text-xs text-red-400 mt-3">{message}</p>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
