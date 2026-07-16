import { Button } from "@/components/ui/button";
import { setRegionAction } from "@/lib/region-actions";
import { CURRENCY, REGIONS, getRegion } from "@/lib/region";

/**
 * Region/currency switcher (₾ GEL vs $ USD). A plain form + server action, so it
 * works without client JS; the active region comes from the cookie/geo header.
 */
export async function RegionSwitcher() {
  const current = await getRegion();

  return (
    <form action={setRegionAction} className="flex items-center gap-0.5">
      {REGIONS.map((region) => (
        <Button
          key={region}
          type="submit"
          name="region"
          value={region}
          size="sm"
          variant={region === current ? "secondary" : "ghost"}
          aria-pressed={region === current}
        >
          {CURRENCY[region].symbol} {CURRENCY[region].code}
        </Button>
      ))}
    </form>
  );
}
