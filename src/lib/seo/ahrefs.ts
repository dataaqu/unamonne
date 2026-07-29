/**
 * Ahrefs connector (T5.4): keyword volume + difficulty to inform the scorer's
 * focus-keyword suggestions. Env-gated and fail-soft — without AHREFS_API_TOKEN,
 * or on any API/parse error, it returns null and the editor simply shows the
 * scorer without Ahrefs data rather than breaking. Results are cached in-process
 * to keep the credit-metered API from being hit on every keystroke.
 */
export type KeywordMetrics = { volume: number; difficulty: number };

const AHREFS_URL = "https://api.ahrefs.com/v3/keywords-explorer/overview";
const CACHE_TTL_MS = 60 * 60 * 1000;

const cache = new Map<string, { at: number; value: KeywordMetrics | null }>();

/** Extract metrics from an Ahrefs response, tolerating a couple of shapes. */
export function parseAhrefsMetrics(json: unknown): KeywordMetrics | null {
  const root = (json ?? {}) as Record<string, unknown>;
  const first = (root.keywords as unknown[])?.[0] ?? root.metrics ?? root;
  const m = (first ?? {}) as Record<string, unknown>;

  const volume = Number(m.volume ?? m.search_volume);
  const difficulty = Number(m.difficulty ?? m.keyword_difficulty);
  if (!Number.isFinite(volume) || !Number.isFinite(difficulty)) return null;

  return { volume, difficulty };
}

export async function getKeywordMetrics(
  keyword: string,
  now: number = Date.now(),
): Promise<KeywordMetrics | null> {
  const token = process.env.AHREFS_API_TOKEN;
  const key = keyword.trim().toLowerCase();
  if (!token || !key) return null;

  const hit = cache.get(key);
  if (hit && now - hit.at < CACHE_TTL_MS) return hit.value;

  let value: KeywordMetrics | null = null;
  try {
    const url = `${AHREFS_URL}?keyword=${encodeURIComponent(key)}&country=us`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) value = parseAhrefsMetrics(await res.json());
  } catch (error) {
    console.error("[ahrefs] keyword lookup failed", error);
    value = null;
  }

  cache.set(key, { at: now, value });
  return value;
}
