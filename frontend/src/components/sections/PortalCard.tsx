"use client";

import Link from "next/link";
import type { ReactNode } from "react";

interface PortalCardProps {
  href: string;
  className?: string;
  children: ReactNode;
}

export default function PortalCard({ href, className, children }: PortalCardProps) {
  return (
    <Link
      href={href}
      prefetch
      className={className}
      style={{ cursor: "pointer" }}
    >
      {children}
    </Link>
  );
}
