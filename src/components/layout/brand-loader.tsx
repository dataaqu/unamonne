"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

import { BRAND } from "@/lib/brand";

gsap.registerPlugin(useGSAP);

/**
 * The house's opening gesture.
 *
 * The mark arrives standing on its horns, a crescent read as a U — the letter
 * the name starts with. It turns a quarter turn into the moon it actually is,
 * and the name slides out from behind it. Letter, then mark, then house: the
 * animation says what the logo means, which is the only thing that earns a
 * visitor's two seconds in front of a shop.
 *
 * It plays once per browser session. The inline script marks the panel done
 * before first paint (a returning visitor, or the admin panel, where a brand
 * overture would only be an obstacle), so it is never seen to flash.
 */

/** Set in sessionStorage once the overture has played. */
const SEEN_KEY = "unamonne:loader";

const SKIP_SCRIPT = `try{var d=document.documentElement;if(sessionStorage.getItem(${JSON.stringify(SEEN_KEY)})||/\\/admin(\\/|$)/.test(location.pathname))d.dataset.loader="done"}catch(e){}`;

export function BrandLoader() {
  const panel = useRef<HTMLDivElement>(null);
  const lockup = useRef<HTMLDivElement>(null);
  const moon = useRef<HTMLImageElement>(null);
  const wordWrap = useRef<HTMLDivElement>(null);
  const word = useRef<HTMLSpanElement>(null);
  const rule = useRef<HTMLDivElement>(null);

  useGSAP(
    (_context, contextSafe) => {
      const root = document.documentElement;
      // Already played this session, or a surface that gets no overture. The
      // panel is hidden by CSS before first paint; there is nothing to run.
      if (root.dataset.loader === "done") return;

      const finish = () => {
        root.dataset.loader = "done";
        document.body.style.removeProperty("overflow");
        try {
          sessionStorage.setItem(SEEN_KEY, "1");
        } catch {
          // Private mode: the overture simply plays again next load.
        }
      };

      document.body.style.overflow = "hidden";

      // Read the motion preference once rather than through gsap.matchMedia():
      // this timeline plays a single time, and a preference that flipped
      // mid-play should not restart it from the top.
      const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      const tl = gsap.timeline({
        paused: true,
        defaults: { ease: "power3.inOut" },
        onComplete: finish,
      });

      // How far the pair has to travel left for mark + name to end up centred.
      // Measured off the layout box (offset*, not getBoundingClientRect) so the
      // rotation applied below cannot skew it, and so it holds at every
      // breakpoint without the gap being hard-coded twice.
      const moonWidth = moon.current!.offsetWidth;
      const wordRight =
        wordWrap.current!.offsetLeft + wordWrap.current!.offsetWidth;
      const shift = (wordRight - moonWidth) / 2;

      if (still) {
        // No turn and no travel — the lockup is simply there, already centred,
        // and then it is not.
        gsap.set(lockup.current, { x: -shift });
        gsap.set(wordWrap.current, { autoAlpha: 1 });
        tl.to(lockup.current, { autoAlpha: 1, duration: 0.3 }).to(
          panel.current,
          { autoAlpha: 0, duration: 0.4 },
          "+=0.8",
        );
      } else {
        // Starting transforms live here rather than in Tailwind classes:
        // v4 writes `rotate`/`translate` as their own properties, which would
        // then stack on top of what GSAP writes into `transform`.
        gsap.set(moon.current, { rotate: -90 });
        gsap.set(word.current, { xPercent: -100 });
        gsap.set(rule.current, { scaleX: 0, autoAlpha: 1 });

        tl
          // the U arrives
          .set(lockup.current, { autoAlpha: 1 })
          .from(moon.current, {
            autoAlpha: 0,
            scale: 0.9,
            duration: 0.8,
            ease: "power2.out",
          })
          // and turns into the moon it always was
          .to(
            moon.current,
            { rotate: 0, duration: 1.15, ease: "power3.inOut" },
            "-=0.3",
          )
          .addLabel("name", "-=0.42")
          // the name comes out from behind the mark
          .to(lockup.current, { x: -shift, duration: 1 }, "name")
          .set(wordWrap.current, { autoAlpha: 1 }, "name")
          .to(word.current, { xPercent: 0, duration: 1 }, "name")
          // and the shop is underneath
          .to(
            lockup.current,
            { autoAlpha: 0, y: -14, duration: 0.55, ease: "power2.in" },
            "+=0.8",
          )
          .to(rule.current, { scaleX: 1, duration: 0.5, ease: "power2.inOut" }, "<")
          .to(panel.current, {
            yPercent: -100,
            duration: 0.85,
            ease: "power4.inOut",
          });
      }

      // Start once the mark is actually decoded, so it never fades in as an
      // empty box. The delayed call is the floor: a slow image must not hold
      // the shop hostage.
      const start = () => tl.play();
      Promise.resolve(moon.current?.decode()).catch(() => {}).then(start);
      gsap.delayedCall(1, start);

      // Two seconds is a gift, not a toll: any input hurries it along.
      const hurry = contextSafe!(() =>
        gsap.to(tl, { timeScale: 2.6, duration: 0.3, overwrite: true }),
      );
      window.addEventListener("pointerdown", hurry, { once: true });
      window.addEventListener("keydown", hurry, { once: true });

      return () => {
        window.removeEventListener("pointerdown", hurry);
        window.removeEventListener("keydown", hurry);
        document.body.style.removeProperty("overflow");
      };
    },
    { scope: panel },
  );

  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: SKIP_SCRIPT }} />
      <div
        ref={panel}
        data-brand-loader
        aria-hidden="true"
        className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-ink-900"
      >
        <div
          ref={lockup}
          className="relative flex items-center opacity-0 will-change-transform"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={moon}
            src="/brand/moon.webp"
            alt=""
            width={560}
            height={598}
            fetchPriority="high"
            decoding="sync"
            className="h-auto w-[104px] will-change-transform sm:w-[132px] lg:w-[152px]"
          />

          {/* The name is set as type, not as artwork: it takes the panel's
              colour with it, it stays sharp at any size, and it is the same
              wordmark the header and the footer already draw.
              `w-max` because the clip box sits past the right edge of its
              containing block, where a shrink-to-fit box collapses to nothing. */}
          <div
            ref={wordWrap}
            className="invisible absolute top-1/2 left-[calc(100%+20px)] w-max -translate-y-1/2 overflow-hidden sm:left-[calc(100%+26px)] lg:left-[calc(100%+32px)]"
          >
            <span
              ref={word}
              className="-mr-[0.3em] block text-[19px] leading-none tracking-[0.3em] text-ink-50 uppercase will-change-transform sm:text-[24px] lg:text-[28px]"
            >
              {BRAND.name}
            </span>
          </div>
        </div>

        {/* The curtain's own edge, drawn just before it lifts. */}
        <div
          ref={rule}
          className="invisible absolute inset-x-0 bottom-0 h-px origin-left bg-ink-50/25"
        />
      </div>
    </>
  );
}
