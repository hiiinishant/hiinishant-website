import type { Metadata } from "next";
import { Inter, Caveat } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { ThemeProvider } from "@/components/ThemeProvider";
import SpotlightCursorLoader from "@/components/SpotlightCursorLoader";

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

export const metadata: Metadata = {
  metadataBase: new URL("https://hiiinishant.com"),
  title: {
    default: "Nishant Kumar — Founder of 2 AM Study",
    template: "%s | Nishant Kumar",
  },
  description:
    "Nishant Kumar is the founder of 2 AM Study — a platform empowering students with high-quality educational resources. Entrepreneur, educator, and builder.",
  keywords: [
    "Nishant Kumar",
    "2 AM Study",
    "founder",
    "education",
    "edtech",
    "hiiinishant",
    "entrepreneur",
  ],
  authors: [{ name: "Nishant Kumar" }],
  creator: "Nishant Kumar",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://hiiinishant.com",
    siteName: "Nishant Kumar",
    title: "Nishant Kumar — Founder of 2 AM Study",
    description:
      "Entrepreneur, educator, and builder. Empowering the next generation of learners through 2 AM Study.",
    images: [
      {
        url: "/profilee.jpg",
        width: 800,
        height: 800,
        alt: "Nishant Kumar — Founder of 2 AM Study",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Nishant Kumar — Founder of 2 AM Study",
    description:
      "Entrepreneur, educator, and builder. Empowering the next generation of learners through 2 AM Study.",
    creator: "@hiiinishant",
    images: ["/profilee.jpg"],
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "/",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    "name": "Nishant Kumar",
    "url": "https://hiiinishant.com",
    "sameAs": [
      "https://twitter.com/hiii_nishant",
      "https://linkedin.com/in/hiiinishant",
      "https://instagram.com/hiiinishant",
      "https://youtube.com/@hiiinishant",
      "https://github.com/hiiinishant",
      "https://medium.com/@hiiinishant",
      "https://quora.com/profile/Hiii-Nishant",
      "https://facebook.com/hiiinishant",
      "https://snapchat.com/add/hiiinishant"
    ],
    "jobTitle": "Founder",
    "worksFor": {
      "@type": "Organization",
      "name": "2 AM Study",
      "url": "https://2amstudy.com"
    },
    "description": "Entrepreneur, educator, and builder. Empowering 100,000+ students through 2 AM Study."
  };

  return (
    <html lang="en" className={`${inter.variable} ${caveat.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        {/* Preload the hero image so it loads as early as possible (improves LCP) */}
        <link rel="preload" href="/profilee.jpg" as="image" />
      </head>
      <body className="min-h-full flex flex-col selection:bg-accent/30 selection:text-accent-light">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <ThemeProvider>
          <SpotlightCursorLoader />
          <Navbar />
          <main className="flex-grow pt-16 lg:pt-20">{children}</main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
