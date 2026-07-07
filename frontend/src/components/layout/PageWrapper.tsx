"use client";

import { usePathname } from "next/navigation";

export default function PageWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isNsgram = pathname?.startsWith("/nsgram");

  return (
    <main className={`flex-grow ${isNsgram ? "" : "pt-16 lg:pt-20"}`}>
      {children}
    </main>
  );
}
