import { useEffect, useRef, useState } from "react";

/** Adds data-visible="true" once the element scrolls into view. Pair with the `reveal` utility. */
export function useReveal<T extends HTMLElement = HTMLDivElement>(delay = 0) {
  const ref = useRef<T | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let t: number | undefined;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          t = window.setTimeout(() => setVisible(true), delay);
          io.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      if (t) window.clearTimeout(t);
    };
  }, [delay]);

  return { ref, props: { "data-visible": visible ? "true" : "false" } } as const;
}
