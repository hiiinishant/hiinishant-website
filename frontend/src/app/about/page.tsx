import type { Metadata } from "next";
import AboutClientPage from "./AboutClientPage";

export const metadata: Metadata = {
  title: "About Hiii Nishant | My Journey, Projects & Story",
  description:
    "Learn more about Nishant, the story behind Hiii Nishant, my projects, 2 AM Study, and the journey of learning, building, and sharing along the way.",
  keywords: [
    "About Hiii Nishant",
    "Nishant Kumar",
    "Nishant Kumar biography",
    "2 AM Study founder",
    "Hiii Nishant story",
    "Chandigarh University entrepreneur",
    "Computer Science Engineer Nishant",
    "hiiinishant about",
  ],
  alternates: {
    canonical: "https://hiiinishant.com/about",
  },
  openGraph: {
    title: "About Hiii Nishant | My Journey, Projects & Story",
    description:
      "Learn more about Nishant, the story behind Hiii Nishant, my projects, 2 AM Study, and the journey of learning, building, and sharing along the way.",
    url: "https://hiiinishant.com/about",
    siteName: "Hiii Nishant",
    locale: "en_IN",
    type: "profile",
    images: [
      {
        url: "/profile.jpg",
        width: 1200,
        height: 630,
        alt: "Nishant Kumar — Founder of 2 AM Study & Creator of Hiii Nishant",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "About Hiii Nishant | My Journey, Projects & Story",
    description:
      "Learn more about Nishant, the story behind Hiii Nishant, my projects, 2 AM Study, and the journey of learning, building, and sharing along the way.",
    images: ["/profile.jpg"],
    creator: "@hiiinishant",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function AboutPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    name: "About Hiii Nishant",
    description:
      "Learn more about Nishant Kumar, the creator of Hiii Nishant and founder of 2 AM Study.",
    url: "https://hiiinishant.com/about",
    mainEntity: {
      "@type": "Person",
      name: "Nishant Kumar",
      alternateName: "hiiinishant",
      url: "https://hiiinishant.com",
      image: "https://hiiinishant.com/profile.jpg",
      jobTitle: "Founder & Software Developer",
      alumniOf: {
        "@type": "CollegeOrUniversity",
        name: "Chandigarh University",
      },
      knowsAbout: [
        "Computer Science & Engineering",
        "Full-Stack Web Development",
        "Educational Technology",
        "Content Creation",
      ],
      sameAs: [
        "https://youtube.com/@hiiinishant",
        "https://youtube.com/@2amstudy",
        "https://twitter.com/hiii_nishant",
        "https://linkedin.com/in/hiiinishant",
        "https://instagram.com/hiiinishant",
        "https://github.com/hiiinishant",
      ],
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <AboutClientPage />
    </>
  );
}
