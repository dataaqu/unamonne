"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(useGSAP, ScrollTrigger);

/**
 * The page's motion layer, in three words.
 *
 * A shop is not a showreel, so the whole vocabulary is small enough to name:
 *
 *   rise    text and cards arrive from just below where they will sit. It is
 *           how the page reads itself out in order instead of landing at once.
 *   settle  a photograph comes to rest from slightly too close, which gives
 *           the picture a moment of weight before the eye moves on.
 *   drift   one image travels slower than the page over it, so the campaign
 *           reads as something the page is moving across rather than a panel.
 *
 * Everything is declared in the markup — `data-rise`, `data-rise-group`,
 * `data-settle`, `data-drift` — so the page stays a server component and this
 * file never has to know what a section is about.
 *
 * Nothing above the fold is ever hidden to be revealed: the first thing a
 * visitor sees is the thing a slow connection would leave them staring at, and
 * the hero's headline is the page's largest paint. Only the picture behind it
 * moves.
 */
export function ScrollMotion() {
  useGSAP(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const enter = { start: "top 88%", once: true } as const;

    for (const el of document.querySelectorAll<HTMLElement>("[data-rise]")) {
      gsap.from(el, {
        opacity: 0,
        y: 22,
        duration: 0.7,
        ease: "power2.out",
        scrollTrigger: { trigger: el, ...enter },
      });
    }

    for (const group of document.querySelectorAll<HTMLElement>(
      "[data-rise-group]",
    )) {
      gsap.from(group.children, {
        opacity: 0,
        y: 24,
        duration: 0.7,
        ease: "power2.out",
        stagger: 0.07,
        scrollTrigger: { trigger: group, start: "top 85%", once: true },
      });
    }

    for (const el of document.querySelectorAll<HTMLElement>("[data-settle]")) {
      gsap.from(el, {
        scale: 1.07,
        duration: 1.3,
        ease: "power2.out",
        scrollTrigger: { trigger: el, start: "top 92%", once: true },
      });
    }

    for (const el of document.querySelectorAll<HTMLElement>("[data-drift]")) {
      // The picture is held a little larger than its frame so that travelling
      // inside it never uncovers an edge.
      const travel = Number(el.dataset.drift) || 5;
      gsap.set(el, { scale: 1 + (travel * 2.4) / 100 });
      gsap.fromTo(
        el,
        { yPercent: -travel },
        {
          yPercent: travel,
          ease: "none",
          scrollTrigger: {
            trigger: el.parentElement ?? el,
            start: "top bottom",
            end: "bottom top",
            scrub: true,
          },
        },
      );
    }
  });

  return null;
}
