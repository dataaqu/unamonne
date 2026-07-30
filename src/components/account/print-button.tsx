"use client";

import { Btn } from "@/components/ui/btn";

/** Hands the invoice to the browser's print dialog — "save as PDF" lives there. */
export function PrintButton({ label }: { label: string }) {
  return (
    <Btn variant="outline" size="sm" onClick={() => window.print()}>
      {label}
    </Btn>
  );
}
