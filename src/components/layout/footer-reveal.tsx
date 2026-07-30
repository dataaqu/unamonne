"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(useGSAP, ScrollTrigger);

/** How far the page tilts as it clears the footer, and how much it draws back. */
const TILT = -2.4;
const SHRINK = 0.02;

/**
 * The footer waits underneath the page rather than after it.
 *
 * The shop is one sheet of paper laid over the studio's card: scroll to the
 * end and the sheet rides up and away, tipping slightly as it goes, and what
 * was behind it all along is what you are left looking at. It says the footer
 * is not the end of the page but the surface the page was sitting on.
 *
 * Two things keep it honest:
 *
 * - the transform is written only while the lift is actually happening. A
 *   transform on an ancestor makes it the containing block for every fixed
 *   child, and the shop's drawers and dialogs are fixed — so at rest the page
 *   carries no transform at all.
 * - a footer taller than the viewport cannot be revealed from underneath, only
 *   cropped. On a narrow screen, where the full footer is a column of links,
 *   the effect steps aside and the footer is simply the last thing on the page.
 */
export function FooterReveal({
  footer,
  children,
}: {
  footer: React.ReactNode;
  children: React.ReactNode;
}) {
  const page = useRef<HTMLDivElement>(null);
  const dock = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const pageEl = page.current!;
      const dockEl = dock.current!;
      const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      let trigger: ScrollTrigger | null = null;

      const clear = () => gsap.set(pageEl, { clearProps: "transform,willChange" });

      const measure = () => {
        const height = dockEl.offsetHeight;
        // Room to scroll past the page, and only if the footer can be seen whole.
        const fits = height > 0 && height <= window.innerHeight * 0.8;

        dockEl.dataset.reveal = fits ? "on" : "off";
        pageEl.style.marginBottom = fits ? `${height}px` : "";

        trigger?.kill();
        trigger = null;
        clear();

        if (!fits || still) return;

        trigger = ScrollTrigger.create({
          trigger: pageEl,
          // From the moment the page's last line reaches the bottom of the
          // screen until it has travelled the footer's own height.
          start: "bottom bottom",
          end: () => `+=${dockEl.offsetHeight}`,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            if (self.progress === 0) {
              clear();
              return;
            }
            gsap.set(pageEl, {
              rotate: TILT * self.progress,
              scale: 1 - SHRINK * self.progress,
              transformOrigin: "50% 100%",
              willChange: "transform",
              force3D: true,
            });
          },
        });
      };

      measure();

      const observer = new ResizeObserver(measure);
      observer.observe(dockEl);
      window.addEventListener("resize", measure);

      return () => {
        observer.disconnect();
        window.removeEventListener("resize", measure);
        trigger?.kill();
      };
    },
    { scope: page },
  );

  return (
    <>
      <div ref={page} data-page className="flex min-h-[100dvh] flex-1 flex-col">
        {children}
      </div>
      <div ref={dock} data-footer-dock>
        {footer}
      </div>
    </>
  );
}
