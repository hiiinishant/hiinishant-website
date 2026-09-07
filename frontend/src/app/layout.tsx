import type { Metadata, Viewport } from "next";
import { Inter, Caveat } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import FooterWrapper from "@/components/layout/FooterWrapper";
import PageWrapper from "@/components/layout/PageWrapper";
import { ThemeProvider } from "@/components/ThemeProvider";
import SpotlightCursorLoader from "@/components/SpotlightCursorLoader";
import LinkPreviewHider from "@/components/LinkPreviewHider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin"],
  display: "swap",
});

// Tell Android Chrome: when the virtual keyboard opens, shrink only the
// *visual* viewport — not the layout viewport. This prevents the entire page
// from reflowing/scrolling up and hiding fixed headers in PWA-style layouts.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  interactiveWidget: "resizes-visual",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://hiiinishant.com"),
  title: {
    default: "Nishant Kumar — Web Developer, Entrepreneur & Vlogger | Founder of 2 AM Study",
    template: "%s | Nishant Kumar",
  },
  description:
    "Nishant Kumar is a full-stack web developer, entrepreneur, and tech vlogger. Founder of 2 AM Study — empowering 100,000+ students from Chandigarh University. Known as hiiinishant.",
  keywords: [
    // Primary identity & common search variations
    "Nishant Kumar",
    "nishant",
    "nishant kumar",
    "hiiinishant",
    "Hiii Nishant",
    "hi nishant",
    "hii nishant",
    "hiiii nishant",
    "nishant hi",
    "nishant hii",
    "nishant vloger",
    "nishant vlogger",
    "nishant chandigarh university",
    "nishant chandigarh univerity",
    "nishant youtube channel",
    "hiii nishant youtube channel",
    "hiii nishant vlogs",
    // Developer & Tech
    "Nishant Kumar web developer",
    "web developer",
    "full stack web developer",
    "Next.js web developer",
    "React developer India",
    "student web developer",
    "software developer Chandigarh",
    // Vlogger & Creator
    "Nishant Kumar vlogger",
    "vlogger",
    "tech vlogger",
    "student vlogger India",
    "Chandigarh University vlogger",
    "Nishant Kumar YouTuber",
    "Nishant Kumar digital creator",
    // Education & brand
    "2 AM Study",
    "2amstudy",
    "2 am study founder",
    "2 AM Study Nishant Kumar",
    "founder of 2 AM Study",
    // University
    "Nishant Kumar Chandigarh University",
    "Chandigarh University student",
    "Chandigarh University entrepreneur",
    // Role descriptors
    "Nishant Kumar entrepreneur",
    "Nishant Kumar educator",
    "Nishant Kumar edtech",
    "Nishant Kumar blogger",
    // Platform
    "hiiinishant.com",
    "nishant kumar portfolio",
    "nishant kumar website",
    "nishant kumar instagram",
    "nishant kumar youtube",
    // Generic
    "edtech founder India",
    "student entrepreneur India",
    "education platform India",
    "online study platform",
  ],
  authors: [{ name: "Nishant Kumar", url: "https://hiiinishant.com" }],
  creator: "Nishant Kumar",
  publisher: "Nishant Kumar",
  category: "Education, Entrepreneurship, Web Development, Vlogging",
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://hiiinishant.com",
    siteName: "Nishant Kumar — hiiinishant",
    title: "Nishant Kumar — Web Developer, Entrepreneur & Vlogger | Founder of 2 AM Study",
    description:
      "Nishant Kumar (hiiinishant) is a full-stack web developer, entrepreneur, and tech vlogger. Founder of 2 AM Study — empowering 100,000+ students from Chandigarh University.",
    images: [
      {
        url: "/profile.jpg",
        width: 1200,
        height: 630,
        alt: "Nishant Kumar — Web Developer, Entrepreneur & Vlogger",
        type: "image/jpeg",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@hiiinishant",
    title: "Nishant Kumar — Web Developer, Entrepreneur & Vlogger",
    description:
      "Founder of 2 AM Study · Full-Stack Web Developer, Entrepreneur & Tech Vlogger from Chandigarh University.",
    creator: "@hiiinishant",
    images: ["/profile.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  verification: {
    // Add your Google Search Console verification token below.
    // Get it from: https://search.google.com/search-console → Add Property → HTML tag method
    // Example: google: "abcdef1234567890abcdef1234567890abcdef12",
    google: "google-site-verification-token-here",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Person",
      "@id": "https://hiiinishant.com/#person",
      "name": "Nishant Kumar",
      "givenName": "Nishant",
      "familyName": "Kumar",
      "alternateName": ["hiiinishant", "Hiii Nishant", "nishant kumar"],
      "url": "https://hiiinishant.com",
      "image": {
        "@type": "ImageObject",
        "url": "https://hiiinishant.com/profile.jpg",
        "width": 800,
        "height": 800,
        "caption": "Nishant Kumar — Founder of 2 AM Study",
      },
      "description": "Nishant Kumar (hiiinishant) is a full-stack web developer, entrepreneur, and tech vlogger. Founder of 2 AM Study — empowering 100,000+ students across India. Student from Chandigarh University, digital creator, and educator.",
      "jobTitle": "Founder, Full Stack Developer & Vlogger",
      "hasOccupation": [
        {
          "@type": "Occupation",
          "name": "Full Stack Web Developer",
          "occupationLocation": { "@type": "Country", "name": "India" },
        },
        {
          "@type": "Occupation",
          "name": "Entrepreneur",
          "occupationLocation": { "@type": "Country", "name": "India" },
        },
        {
          "@type": "Occupation",
          "name": "Tech Vlogger & Content Creator",
          "occupationLocation": { "@type": "Country", "name": "India" },
        },
        {
          "@type": "Occupation",
          "name": "Educator",
          "occupationLocation": { "@type": "Country", "name": "India" },
        },
      ],
      "worksFor": {
        "@type": "Organization",
        "@id": "https://2amstudy.com/#org",
        "name": "2 AM Study",
        "url": "https://2amstudy.com",
      },
      "alumniOf": {
        "@type": "CollegeOrUniversity",
        "name": "Chandigarh University",
        "url": "https://www.cuchd.in",
      },
      "birthPlace": {
        "@type": "Place",
        "name": "India",
      },
      "knowsAbout": [
        "Web Development",
        "Full Stack Development",
        "Next.js",
        "React.js",
        "TypeScript",
        "Node.js",
        "Education Technology",
        "Entrepreneurship",
        "Digital Content Creation",
        "Nishant Kumar Chandighar University",
        "Student Community Building",
        "Online Learning Platforms",
        "EdTech",
        "YouTube Content Creation",
        "Vlogging",
        "Blogging",
        "GATE CSE Preparation",
        "B.Tech Computer Science",
      ],
      "nationality": {
        "@type": "Country",
        "name": "India",
      },
      "sameAs": [
        "https://twitter.com/hiii_nishant",
        "https://linkedin.com/in/hiiinishant",
        "https://instagram.com/hiiinishant",
        "https://youtube.com/@hiiinishant",
        "https://facebook.com/hiiinishant",
        "https://github.com/hiiinishant",
        "https://2amstudy.com",
        "https://hiiinishant.com/vlogs",
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      "@id": "https://2amstudy.com/#org",
      "name": "2 AM Study",
      "alternateName": "2amstudy",
      "url": "https://2amstudy.com",
      "founder": {
        "@type": "Person",
        "@id": "https://hiiinishant.com/#person",
        "name": "Nishant Kumar",
      },
      "description": "2 AM Study is an edtech platform founded by Nishant Kumar, providing quality educational resources to 100,000+ students across India.",
      "foundingDate": "2021",
      "areaServed": "IN",
      "knowsAbout": ["Education", "Online Learning", "Student Resources"],
      "sameAs": [
        "https://2amstudy.com",
        "https://instagram.com/2amstudy",
        "https://youtube.com/@2amstudy",
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "@id": "https://hiiinishant.com/#website",
      "url": "https://hiiinishant.com",
      "name": "Nishant Kumar — hiiinishant",
      "description": "Official website of Nishant Kumar, founder of 2 AM Study.",
      "publisher": {
        "@type": "Person",
        "@id": "https://hiiinishant.com/#person",
        "name": "Nishant Kumar",
      },
      "potentialAction": {
        "@type": "SearchAction",
        "target": {
          "@type": "EntryPoint",
          "urlTemplate": "https://hiiinishant.com/blog?q={search_term_string}",
        },
        "query-input": "required name=search_term_string",
      },
    },
  ];

  return (
    <html lang="en" className={`${inter.variable} ${caveat.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        {/* Preload the hero image so it loads as early as possible (improves LCP) */}
        <link rel="preload" href="/profile.jpg" as="image" />
        {/* Google AdSense — site verification & monetisation */}
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4581242824312894" crossOrigin="anonymous"></script>
      </head>
      <body className="min-h-full flex flex-col selection:bg-accent/30 selection:text-accent-light">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <ThemeProvider>
          <SpotlightCursorLoader />
          <LinkPreviewHider />
          <Navbar />
          <PageWrapper>{children}</PageWrapper>
          <FooterWrapper />
        </ThemeProvider>
      </body>
    </html>
  );
}
