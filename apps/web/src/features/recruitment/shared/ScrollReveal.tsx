"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  /** Delay in ms applied once the element becomes visible. */
  delayMs?: number;
}

/**
 * Reveals children with a one-shot fade-in-up as they enter the viewport.
 *
 * Server and client both render the "visible" state on first paint (no
 * hydration mismatch — nothing to branch on before mount). After mount, an
 * IntersectionObserver subscribes to the element; its very first callback
 * fires with the current intersection state, so if the element is already on
 * screen it stays visible immediately, and if it's below the fold it gets
 * hidden then revealed once scrolled into view. Reduced-motion / unsupported
 * browsers skip the observer entirely and stay visible.
 */
export function ScrollReveal({ children, className = "", delayMs = 0 }: ScrollRevealProps) {
  const elementRef = useRef<HTMLDivElement | null>(null);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) {
      return;
    }

    if (typeof IntersectionObserver === "undefined") {
      return;
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    let hasSeenFirstEntry = false;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!hasSeenFirstEntry) {
            // First callback reports current state — if already on screen, stay
            // visible with no animation and stop observing; otherwise hide and
            // wait for the next callback to reveal it.
            hasSeenFirstEntry = true;
            if (entry.isIntersecting) {
              observer.disconnect();
            } else {
              setIsVisible(false);
            }
            continue;
          }

          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.disconnect();
          }
        }
      },
      // threshold 0 fires as soon as any pixel of the target is visible — required
      // because target sections can be far taller than the viewport, where a
      // ratio-based threshold (e.g. 0.15) would never be satisfiable.
      { threshold: 0, rootMargin: "0px 0px -10% 0px" },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={elementRef}
      style={isVisible ? { transitionDelay: `${delayMs}ms` } : undefined}
      className={`reveal-on-scroll ${isVisible ? "reveal-on-scroll-visible" : ""} ${className}`}
    >
      {children}
    </div>
  );
}
