"use client";

import { useState } from "react";
import Link from "next/link";

const contactMethods = [
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
    ),
    label: "Email",
    value: "hiiinishant@gmail.com",
    href: "mailto:hiiinishant@gmail.com",
    description: "Best for detailed inquiries",
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
    ),
    label: "Twitter / X",
    value: "@hiii_nishant",
    href: "https://twitter.com/hiii_nishant",
    description: "Quick DMs and updates",
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
    ),
    label: "Instagram",
    value: "@hiiinishant",
    href: "https://instagram.com/hiiinishant",
    description: "Behind the scenes",
  },
];

const faqs = [
  {
    question: "Are you open to collaborations?",
    answer: "Absolutely! I'm always looking for meaningful collaborations that align with the mission of making education better. Reach out via the form or DM me.",
  },
  {
    question: "Do you do speaking engagements?",
    answer: "Yes — I speak about entrepreneurship, edtech, community building, and the future of education. Let's discuss the details over email.",
  },
  {
    question: "Can I join the 2 AM Study team?",
    answer: "We're always looking for passionate people. Check our social channels for any open positions, or send in your details through the contact form.",
  },
  {
    question: "How can I get featured on 2 AM Study?",
    answer: "If you have a compelling student story or educational content to share, I'd love to hear about it. Drop me a message!",
  },
];

interface FormState {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export default function Contact() {
  const [form, setForm] = useState<FormState>({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to send message.");
      }

      setStatus("success");
      setForm({ name: "", email: "", subject: "", message: "" });
    } catch (err: any) {
      setStatus("error");
      setErrorMsg(err.message);
    }
  };

  return (
    <>
      {/* ─── HERO ─── */}
      <section className="pt-32 pb-12 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-accent/4 rounded-full blur-[120px] pointer-events-none -z-10" />
        <div className="max-w-6xl mx-auto px-5 sm:px-8 text-center">
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-accent/20 bg-accent/5 text-[11px] font-bold text-accent uppercase tracking-widest mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse-slow" />
            Get In Touch
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold mb-4">
            Let&apos;s <span className="text-gradient">Connect</span>
          </h1>
          <p className="text-brand-400 max-w-xl mx-auto">
            Whether it&apos;s a collaboration, speaking engagement, or just saying hello — I&apos;d love to hear from you.
          </p>
        </div>
      </section>

      {/* ─── CONTACT METHODS + FORM ─── */}
      <section className="py-12 lg:py-20">
        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 lg:gap-16">
            {/* Left: Contact Methods */}
            <div className="lg:col-span-2 space-y-6">
              <div>
                <span className="text-xs font-semibold text-accent uppercase tracking-widest mb-4 block">Reach Out Directly</span>
                <p className="text-brand-400 text-sm leading-relaxed">
                  Pick the channel that works best for you. I typically respond within 24–48 hours.
                </p>
              </div>

              <div className="space-y-4">
                {contactMethods.map((method) => (
                  <a
                    key={method.label}
                    href={method.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-4 p-5 rounded-xl glass hover:glass-strong transition-all duration-300 group hover:-translate-y-0.5"
                  >
                    <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center text-accent shrink-0 group-hover:bg-accent/20 transition-colors">
                      {method.icon}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{method.label}</p>
                      <p className="text-sm text-accent mt-0.5">{method.value}</p>
                      <p className="text-xs text-brand-500 mt-1">{method.description}</p>
                    </div>
                  </a>
                ))}
              </div>

              {/* Location */}
              <div className="p-5 rounded-xl glass">
                <div className="flex items-center gap-3 mb-2">
                  <svg className="w-4 h-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                  <p className="text-sm font-medium text-white">Based in India</p>
                </div>
                <p className="text-xs text-brand-500">Open to remote collaboration worldwide</p>
              </div>
            </div>

            {/* Right: Contact Form */}
            <div className="lg:col-span-3">
              <div className="glass-strong p-8 md:p-10 rounded-2xl">
                {status === "success" ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mb-5">
                      <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h2 className="text-xl font-bold text-white mb-2">Message Sent! 🎉</h2>
                    <p className="text-brand-400 text-sm max-w-sm mb-6">
                      Thanks for reaching out! I&apos;ll get back to you within 24–48 hours.
                    </p>
                    <button
                      onClick={() => setStatus("idle")}
                      className="px-6 py-2.5 rounded-xl glass hover:glass-strong text-sm font-medium text-brand-200 hover:text-white transition-all"
                    >
                      Send Another Message
                    </button>
                  </div>
                ) : (
                  <>
                    <h2 className="text-xl font-bold text-white mb-2">Send a Message</h2>
                    <p className="text-sm text-brand-400 mb-8">Fill out the form and I&apos;ll get back to you as soon as possible.</p>

                    {status === "error" && (
                      <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400 mb-5">
                        <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>
                        {errorMsg}
                      </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5" id="contact-form">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div>
                          <label htmlFor="name" className="block text-xs font-medium text-brand-300 mb-2 uppercase tracking-wider">Name *</label>
                          <input
                            type="text"
                            id="name"
                            name="name"
                            value={form.name}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent/50 text-white placeholder-brand-500 text-sm transition-all"
                            placeholder="Your name"
                          />
                        </div>
                        <div>
                          <label htmlFor="email" className="block text-xs font-medium text-brand-300 mb-2 uppercase tracking-wider">Email *</label>
                          <input
                            type="email"
                            id="email"
                            name="email"
                            value={form.email}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent/50 text-white placeholder-brand-500 text-sm transition-all"
                            placeholder="you@example.com"
                          />
                        </div>
                      </div>

                      <div>
                        <label htmlFor="subject" className="block text-xs font-medium text-brand-300 mb-2 uppercase tracking-wider">Subject *</label>
                        <select
                          id="subject"
                          name="subject"
                          value={form.subject}
                          onChange={handleChange}
                          required
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent/50 text-white text-sm transition-all appearance-none cursor-pointer"
                        >
                          <option value="" disabled className="bg-brand-900 text-brand-400">Select a topic</option>
                          <option value="Collaboration / Partnership" className="bg-brand-900">Collaboration / Partnership</option>
                          <option value="Speaking Engagement" className="bg-brand-900">Speaking Engagement</option>
                          <option value="Media / Press Inquiry" className="bg-brand-900">Media / Press Inquiry</option>
                          <option value="General Question" className="bg-brand-900">General Question</option>
                          <option value="Other" className="bg-brand-900">Other</option>
                        </select>
                      </div>

                      <div>
                        <label htmlFor="message" className="block text-xs font-medium text-brand-300 mb-2 uppercase tracking-wider">Message *</label>
                        <textarea
                          id="message"
                          name="message"
                          value={form.message}
                          onChange={handleChange}
                          required
                          rows={5}
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent/50 text-white placeholder-brand-500 text-sm transition-all resize-none"
                          placeholder="Tell me about what you have in mind..."
                        />
                      </div>

                      <button
                        type="submit"
                        id="contact-submit"
                        disabled={status === "loading"}
                        className="w-full py-4 rounded-xl bg-accent hover:bg-accent-hover text-black font-semibold transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_0_30px_rgba(245,158,11,0.3)] text-sm disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {status === "loading" ? (
                          <>
                            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            Sending…
                          </>
                        ) : (
                          "Send Message →"
                        )}
                      </button>
                    </form>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section className="py-20 lg:py-28 bg-brand-900/30 border-y border-white/5">
        <div className="max-w-3xl mx-auto px-5 sm:px-8">
          <div className="text-center mb-12">
            <span className="text-xs font-semibold text-accent uppercase tracking-widest mb-4 block">FAQ</span>
            <h2 className="text-3xl font-bold">Frequently asked questions</h2>
          </div>
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div key={i} className="glass p-6 rounded-xl hover:glass-strong transition-all duration-300">
                <h3 className="text-base font-semibold text-white mb-2">{faq.question}</h3>
                <p className="text-sm text-brand-400 leading-relaxed">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

    </>
  );
}
