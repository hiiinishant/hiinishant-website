import type { Metadata } from 'next';
import AmazonClientPage from '@/app/amazon/AmazonClientPage';

export const metadata: Metadata = {
  title: "Nishant's Picks — Amazon Storefront & 2 AM Study Gear | Nishant Kumar",
  description:
    "Explore Nishant Kumar's curated Amazon picks, 2 AM Study gear, productivity tools, books, and desk essentials. Handpicked recommendations for students, creators, and developers.",
  keywords: [
    "Nishant Amazon",
    "Nishant Kumar Amazon",
    "Nishant Picks",
    "2 AM Study Amazon",
    "2amstudy",
    "Nishant Kumar Storefront",
    "Nishant Kumar Recommended Products",
    "Study Essentials Nishant Kumar",
    "Desk Setup Nishant Kumar",
    "Productivity Tools Nishant Kumar",
  ],
  alternates: {
    canonical: "https://www.hiiinishant.com/amazon-feed",
  },
  openGraph: {
    title: "Nishant's Picks — Amazon Storefront & Curated Recommendations",
    description:
      "Good finds & better choices. Handpicked Amazon gear, 2 AM Study materials, books, and productivity tools curated by Nishant Kumar.",
    url: "https://www.hiiinishant.com/amazon-feed",
    siteName: "Hiii-Nishant",
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Nishant's Picks — Amazon Storefront & 2 AM Study Gear",
    description:
      "Explore handpicked Amazon recommendations, books, desk setup gear, and study essentials curated by Nishant Kumar.",
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

export default function AmazonFeedPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Nishant's Picks — Amazon Storefront & Curated Gear",
    description:
      "Curated recommendations, books, desk gear, and 2 AM Study materials handpicked by Nishant Kumar.",
    url: "https://www.hiiinishant.com/amazon-feed",
    author: {
      "@type": "Person",
      name: "Nishant Kumar",
      url: "https://www.hiiinishant.com",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <AmazonClientPage />
    </>
  );
}
