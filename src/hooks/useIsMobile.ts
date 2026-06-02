import { useState, useEffect } from "react";

// Tracks whether the viewport is phone-sized, so layout can switch between
// the desktop sidebar and a slide-in mobile drawer.
export function useIsMobile(breakpoint = 760): boolean {
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth < breakpoint : false
  );
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < breakpoint);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [breakpoint]);
  return isMobile;
}
