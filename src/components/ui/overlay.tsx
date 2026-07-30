"use client";

import { createPortal } from "react-dom";

/**
 * Puts a full-screen overlay on the document body rather than where it was
 * written.
 *
 * A drawer or a dialog is `position: fixed`, which means the viewport — right
 * up until an ancestor carries a transform, at which point that ancestor
 * becomes the containing block and the overlay inherits its rotation, its
 * scale and its bounds. The footer reveal tilts the whole page at the end of a
 * scroll, so anything opened down there would tilt with it. On the body, an
 * overlay answers to the viewport again.
 *
 * Nothing renders on the server: an overlay is only ever opened by a person.
 */
export function Overlay({ children }: { children: React.ReactNode }) {
  if (typeof document === "undefined") return null;
  return createPortal(children, document.body);
}
