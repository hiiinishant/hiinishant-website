"use client";

import dynamic from "next/dynamic";

const SpotlightCursor = dynamic(
  () => import("@/components/SpotlightCursor"),
  { ssr: false }
);

export default function SpotlightCursorLoader() {
  return <SpotlightCursor />;
}
