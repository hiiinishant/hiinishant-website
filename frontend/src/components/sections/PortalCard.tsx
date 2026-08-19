"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

interface PortalCardProps {
  href: string;
  className?: string;
  children: ReactNode;
}

export default function PortalCard({ href, className, children }: PortalCardProps) {
  const router = useRouter();

  return (
    <div
      role="button"
      tabIndex={0}
      className={className}
      onClick={() => router.push(href)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") router.push(href);
      }}
      style={{ cursor: "pointer" }}
    >
      {children}
    </div>
  );
}
