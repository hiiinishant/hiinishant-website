"use client";

import { useEffect } from "react";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    document.documentElement.classList.remove("light");
    localStorage.removeItem("theme");
  }, []);

  return <>{children}</>;
}
