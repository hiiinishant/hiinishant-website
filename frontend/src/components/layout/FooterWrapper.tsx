"use client";

import { usePathname } from "next/navigation";
import Footer from "@/components/layout/Footer";

export default function FooterWrapper() {
  const pathname = usePathname();

  // Hide footer on individual blog article pages for distraction-free reading
  const isBlogArticle = /^\/blog\/.+/.test(pathname ?? "");

  if (isBlogArticle) return null;

  return <Footer />;
}
