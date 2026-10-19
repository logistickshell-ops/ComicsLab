import { useEffect, useState } from "react";

/**
 * True on phones/tablets (below the `lg` breakpoint) — the same place where
 * the bottom action bar is shown. Used to swap the inline bubble textarea
 * for the bottom-sheet editor.
 */
export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)");
    const apply = () => setIsMobile(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  return isMobile;
}
