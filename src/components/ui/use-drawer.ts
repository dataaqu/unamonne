"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

import { useMounted } from "@/components/ui/overlay";

gsap.registerPlugin(useGSAP);

/**
 * The house's drawer movement, in one place so the bag and the filters open
 * the same way.
 *
 * A drawer comes out of the edge it belongs to and decelerates into place while
 * the room behind it darkens; closing, it starts back at once and goes out on
 * an accelerating curve, because leaving should feel like less of a decision
 * than arriving.
 *
 * The panel stays in the document while it is closed — a drawer that is
 * unmounted the moment it is dismissed has nothing left to animate — so the
 * closed state is set rather than played on the first pass, and the shell is
 * hidden outright, which takes it out of the tab order and the accessibility
 * tree with it.
 */
export function useDrawer(open: boolean, from: "left" | "right" = "right") {
  const shell = useRef<HTMLDivElement>(null);
  const scrim = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLElement>(null);
  const hasOpened = useRef(false);

  // The drawer lives in a portal, so on the render that hydrates it is not in
  // the document yet and these refs are still empty.
  const mounted = useMounted();
  const edge = from === "left" ? -100 : 100;

  useGSAP(
    () => {
      if (!panel.current) return;

      const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const pace = still ? 0 : 1;

      if (open) {
        hasOpened.current = true;
        gsap.set(shell.current, { autoAlpha: 1, pointerEvents: "auto" });
        gsap
          .timeline()
          .to(scrim.current, { autoAlpha: 1, duration: 0.45 * pace }, 0)
          .to(
            panel.current,
            { xPercent: 0, duration: 0.62 * pace, ease: "power3.out" },
            0,
          );
        return;
      }

      if (!hasOpened.current) {
        gsap.set(shell.current, { autoAlpha: 0, pointerEvents: "none" });
        gsap.set(scrim.current, { autoAlpha: 0 });
        gsap.set(panel.current, { xPercent: edge });
        return;
      }

      gsap
        .timeline()
        .to(
          panel.current,
          { xPercent: edge, duration: 0.42 * pace, ease: "power3.in" },
          0,
        )
        .to(scrim.current, { autoAlpha: 0, duration: 0.38 * pace }, 0)
        .set(shell.current, { autoAlpha: 0, pointerEvents: "none" });
    },
    { dependencies: [open, mounted, edge] },
  );

  return { shell, scrim, panel };
}
