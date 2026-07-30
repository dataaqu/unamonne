"use client";

import { useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

/**
 * Puts a full-screen overlay on the document body rather than where it was
 * written.
 *
 * A drawer or a dialog is `position: fixed`, which means the viewport — right
 * up until an ancestor carries a transform, at which point that ancestor
 * becomes the containing block and the overlay inherits its rotation, its
 * scale and its bounds. The footer reveal moves the whole page at the end of a
 * scroll, so anything opened down there would move with it. On the body, an
 * overlay answers to the viewport again.
 */
const subscribe = () => () => {};

/**
 * False on the server and on the first client render, true afterwards.
 *
 * Anything that has to touch an overlay's DOM needs this too: on the render
 * that hydrates, the overlay is not there yet and its refs are still empty.
 */
export function useMounted() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}

export function Overlay({ children }: { children: React.ReactNode }) {
  // A portal cannot exist in the server's HTML, so the first client render has
  // to agree that there is nothing here yet. `useSyncExternalStore` is the way
  // to say that without hydrating one tree and then contradicting it: the
  // server snapshot is false, the client snapshot is true, and React re-renders
  // once on its own terms. An overlay that stays mounted while it animates
  // closed would otherwise mismatch on every page it appears on.
  const mounted = useMounted();

  if (!mounted) return null;
  return createPortal(children, document.body);
}
