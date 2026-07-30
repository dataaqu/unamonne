"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

import { Link } from "@/i18n/navigation";
import { BRAND, LOCKUP } from "@/lib/brand";
import { WORDMARK } from "@/lib/brand-wordmark";
import { cn } from "@/lib/utils";

gsap.registerPlugin(useGSAP);

/** Mark width in pixels; the rest of the lockup follows from `LOCKUP`. */
const SIZES = { sm: 36, md: 44, lg: 52 } as const;

/**
 * The lockup writes itself at most once per page load. The header re-renders on
 * every client-side navigation, and a logo that redrew itself on every click
 * would stop being a logo and start being a distraction.
 */
let hasPlayed = false;

export function BrandMark({
  size = "sm",
  tone = "dark",
  animate = false,
  asLink = true,
  className,
}: {
  size?: keyof typeof SIZES;
  /** `light` is the white cut of the name, for the cocoa field. */
  tone?: "dark" | "light";
  /** Write the name on, once, after the overture has cleared. */
  animate?: boolean;
  asLink?: boolean;
  className?: string;
}) {
  const root = useRef<HTMLElement>(null);

  const mark = SIZES[size];
  const wordWidth = mark * LOCKUP.wordWidth;

  useGSAP(
    () => {
      if (!animate || hasPlayed) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      hasPlayed = true;

      const glyphs = gsap.utils.toArray<HTMLElement>(
        "[data-letter]",
        root.current,
      );
      const moon = root.current!.querySelector("[data-mark]");

      // The markup is the finished lockup, so a failure here leaves the logo
      // standing rather than invisible. The animation takes it apart first.
      gsap.set(glyphs, { autoAlpha: 0, y: "14%" });
      gsap.set(moon, { rotate: -90 });

      const play = () =>
        gsap
          .timeline()
          .to(moon, { rotate: 0, duration: 0.9, ease: "power3.inOut" })
          .to(
            glyphs,
            {
              autoAlpha: 1,
              y: "0%",
              duration: 0.4,
              stagger: 0.06,
              ease: "power2.out",
            },
            "-=0.35",
          );

      // On the first visit of a session the overture is still covering the
      // page. Wait it out, so the header writes itself as the curtain lifts
      // rather than performing to nobody behind it.
      const html = document.documentElement;
      if (html.dataset.loader === "done") {
        play();
        return;
      }

      const observer = new MutationObserver(() => {
        if (html.dataset.loader !== "done") return;
        observer.disconnect();
        play();
      });
      observer.observe(html, { attributeFilter: ["data-loader"] });
      return () => observer.disconnect();
    },
    { scope: root },
  );

  const wordmark = tone === "light" ? "wordmark" : "wordmark-ink";

  const content = (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        data-mark
        src="/brand/moon.webp"
        alt=""
        width={560}
        height={598}
        className="absolute top-0 left-0 h-full will-change-transform"
        style={{ width: mark }}
      />

      <span
        className="absolute top-1/2 -translate-y-1/2"
        style={{
          left: mark * LOCKUP.wordLeft,
          width: wordWidth,
          height: wordWidth * (WORDMARK.height / WORDMARK.width),
        }}
      >
        {WORDMARK.letters.map((letter) => (
          <span
            key={letter.x}
            data-letter
            className="absolute top-0 h-full overflow-hidden will-change-transform"
            style={{
              left: `${(letter.x / WORDMARK.width) * 100}%`,
              width: `${(letter.w / WORDMARK.width) * 100}%`,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/brand/${wordmark}.webp`}
              alt=""
              className="absolute top-0 h-full max-w-none"
              style={{
                left: `${-(letter.x / letter.w) * 100}%`,
                width: `${(WORDMARK.width / letter.w) * 100}%`,
              }}
            />
          </span>
        ))}
      </span>

      {/* The name as text, for everyone the pictures do not reach. */}
      <span className="sr-only">{BRAND.name}</span>
    </>
  );

  const shell = cn("relative block shrink-0", className);
  const box = {
    width: mark * (LOCKUP.wordLeft + LOCKUP.wordWidth),
    height: mark / LOCKUP.markAspect,
  };

  if (!asLink) {
    return (
      <span
        ref={root as React.Ref<HTMLSpanElement>}
        className={shell}
        style={box}
      >
        {content}
      </span>
    );
  }

  return (
    <Link
      ref={root as React.Ref<HTMLAnchorElement>}
      href="/"
      aria-label={BRAND.name}
      className={shell}
      style={box}
    >
      {content}
    </Link>
  );
}
