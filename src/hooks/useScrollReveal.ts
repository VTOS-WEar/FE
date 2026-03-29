import { useEffect } from "react";

/**
 * useScrollReveal — Activates .nb-reveal elements on scroll via IntersectionObserver.
 * Call once in a top-level component (e.g. Homepage).
 * Elements with .nb-reveal, .nb-reveal-left, .nb-reveal-right, .nb-reveal-scale,
 * or .nb-reveal-stagger will get .nb-visible added when they enter the viewport.
 */
export function useScrollReveal() {
  useEffect(() => {
    const selectors = ".nb-reveal, .nb-reveal-left, .nb-reveal-right, .nb-reveal-scale, .nb-reveal-stagger";
    const elements = document.querySelectorAll(selectors);
    if (!elements.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("nb-visible");
            observer.unobserve(entry.target); // Only animate once
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);
}
