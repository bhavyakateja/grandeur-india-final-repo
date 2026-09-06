import { useEffect, useState } from "react";

/**
 * Mirrors Tailwind's `md` breakpoint (768px) so the video logic and the
 * layout breakpoint can never disagree.
 *
 * Lazily initialized from matchMedia so there's no flash of the wrong
 * video on first paint (this is a client-rendered SPA — window exists
 * synchronously at mount time).
 */

const MOBILE_QUERY = "(max-width: 767px)";

export function useIsMobileViewport() {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.matchMedia(MOBILE_QUERY).matches,
  );

  useEffect(() => {
    const mql = window.matchMedia(MOBILE_QUERY);
    const handleChange = (event: MediaQueryListEvent) => setIsMobile(event.matches);

    // Safari < 14 doesn't support addEventListener on MediaQueryList.
    if (mql.addEventListener) {
      mql.addEventListener("change", handleChange);
    } else {
      mql.addListener(handleChange);
    }

    return () => {
      if (mql.removeEventListener) {
        mql.removeEventListener("change", handleChange);
      } else {
        mql.removeListener(handleChange);
      }
    };
  }, []);

  return isMobile;
}