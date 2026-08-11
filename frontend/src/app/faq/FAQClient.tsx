"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronDown } from "lucide-react";

const faqs = [
  // About Nishant
  {
    category: "About Nishant",
    q: "Who is Nishant Kumar?",
    a: "Nishant Kumar (hiiinishant) is a GATE CSE aspirant, student entrepreneur, and the founder of 2 AM Study — a free educational platform helping thousands of engineering students across India.",
  },
  {
    category: "About Nishant",
    q: "What is Nishant currently working on?",
    a: "Right now I'm preparing for GATE CSE while simultaneously building and improving Hiii Nishant, 2 AM Study, and creating free resources — quizzes, mock tests, blog posts, and study tools — for students.",
  },
  {
    category: "About Nishant",
    q: "Are you open to collaborations?",
    a: "Absolutely! I'm always looking for meaningful collaborations that align with the mission of making education accessible and impactful for students. Whether it's content, tech, or community — feel free to reach out via the Contact page.",
  },
  {
    category: "About Nishant",
    q: "Where can I follow your journey?",
    a: "You can follow me on Instagram, YouTube, and other platforms listed on the Social Links page. I post regular updates, study tips, vlogs, and behind-the-scenes content there.",
  },
  // Platform
  {
    category: "Platform",
    q: "What is Hiii Nishant?",
    a: "Hiii Nishant is my official personal platform — a space where I share my portfolio, vlogs, blog, music, daily updates, and everything related to 2 AM Study. Think of it as my corner of the internet.",
  },
  {
    category: "Platform",
    q: "What is 2 AM Study?",
    a: "2 AM Study is a free educational initiative I founded that provides GATE CSE preparation resources, mock tests, quizzes, and study tools — built by a student, for students.",
  },
  {
    category: "Platform",
    q: "Is everything on this site free?",
    a: "Yes! All study resources, tools, blogs, quizzes, and content on Hiii Nishant and 2 AM Study are completely free for students. There is no paywall.",
  },
  {
    category: "Platform",
    q: "Can I create an account on Hiii Nishant?",
    a: "Yes — you can sign up to join the community, like and comment on posts, and interact with other students. Registration is free and takes just a few seconds.",
  },
  // Support
  {
    category: "Support",
    q: "How can I support Nishant's journey?",
    a: "You can voluntarily support via the Support page on this website. Contributions directly fund website hosting, development, educational content creation, and the continuous improvement of free student resources.",
  },
  {
    category: "Support",
    q: "Is contributing / donating mandatory?",
    a: "Not at all. Every resource here is and will always remain free. Any contribution is entirely voluntary — a way to say thank you if my work has helped you.",
  },
  {
    category: "Support",
    q: "Will I receive any product or service for contributing?",
    a: "No — contributions are voluntary gestures of support, not purchases. You will not receive any product, service, or exclusive access in return. It's just love and fuel for the mission. ❤️",
  },
  // Contact
  {
    category: "Contact",
    q: "How can I contact Nishant?",
    a: "Use the Contact form on this website, or reach out through the social media links on the Social Links page. I try to respond to every meaningful message.",
  },
];

const categories = ["About Nishant", "Platform", "Support", "Contact"];

export default function FAQClient() {
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("All");

  const filtered =
    activeCategory === "All"
      ? faqs
      : faqs.filter((f) => f.category === activeCategory);

  return (
    <main className="min-h-screen pt-20 pb-24 px-5 sm:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-10 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-accent text-xs font-semibold mb-5">
            ❓ FAQ
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-brand-300 text-sm sm:text-base max-w-lg mx-auto leading-relaxed">
            Everything you need to know about Nishant Kumar, 2 AM Study, and Hiii Nishant.
          </p>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex flex-wrap gap-2 justify-center mb-8">
          {["All", ...categories].map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setActiveCategory(cat);
                setOpenIdx(null);
              }}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200 cursor-pointer ${
                activeCategory === cat
                  ? "bg-accent/15 border-accent/40 text-accent"
                  : "bg-white/5 border-white/10 text-brand-300 hover:text-white hover:bg-white/8"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Accordion */}
        <div className="space-y-3">
          {filtered.map((faq, i) => {
            const isOpen = openIdx === i;
            return (
              <div
                key={i}
                className={`border rounded-2xl overflow-hidden transition-all duration-300 ${
                  isOpen
                    ? "border-accent/30 bg-accent/5"
                    : "border-white/10 hover:border-white/20"
                }`}
              >
                <button
                  onClick={() => setOpenIdx(isOpen ? null : i)}
                  className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left cursor-pointer"
                >
                  <span
                    className={`text-sm sm:text-base font-semibold leading-snug transition-colors ${
                      isOpen ? "text-white" : "text-brand-100"
                    }`}
                  >
                    {faq.q}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 shrink-0 transition-all duration-300 ${
                      isOpen ? "rotate-180 text-accent" : "text-brand-400"
                    }`}
                  />
                </button>

                {/* Smooth height transition via CSS grid trick */}
                <div
                  className={`grid transition-all duration-300 ease-in-out ${
                    isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                  }`}
                >
                  <div className="overflow-hidden">
                    <p className="px-5 pb-5 text-xs sm:text-sm text-brand-300 leading-relaxed">
                      {faq.a}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div className="mt-12 text-center">
          <p className="text-brand-400 text-sm mb-3">Still have questions?</p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-accent hover:bg-accent-hover text-black font-bold text-sm transition-all hover:shadow-[0_0_20px_rgba(245,158,11,0.3)]"
          >
            📩 Get in Touch
          </Link>
        </div>
      </div>
    </main>
  );
}
