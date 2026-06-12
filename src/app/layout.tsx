import type { Metadata } from "next";
import { Inter, Caveat } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ThemeProvider } from "@/components/ThemeProvider";
import SpotlightCursor from "@/components/SpotlightCursor";

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
  },
  twitter: {
    card: "summary_large_image",
    title: "Nishant Kumar — Founder of 2 AM Study",
    description:
      "Entrepreneur, educator, and builder. Empowering the next generation of learners through 2 AM Study.",
    creator: "@hiiinishant",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${caveat.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col selection:bg-accent/30 selection:text-accent-light">
        <ThemeProvider>
          <SpotlightCursor />
          <Navbar />
          <main className="flex-grow pt-16 lg:pt-20">{children}</main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
