/**
 * ISO-3166 alpha-2 codes. Only the codes are stored here — the display name
 * comes from `Intl.DisplayNames`, so the list is localized for free in both
 * Georgian and English and never drifts out of date in one language only.
 */
const ALPHA2 = [
  "AD","AE","AF","AG","AL","AM","AO","AR","AT","AU","AZ","BA","BB","BD","BE",
  "BF","BG","BH","BI","BJ","BN","BO","BR","BS","BT","BW","BY","BZ","CA","CD",
  "CF","CG","CH","CI","CL","CM","CN","CO","CR","CU","CV","CY","CZ","DE","DJ",
  "DK","DM","DO","DZ","EC","EE","EG","ER","ES","ET","FI","FJ","FM","FR","GA",
  "GB","GD","GE","GH","GM","GN","GQ","GR","GT","GW","GY","HN","HR","HT","HU",
  "ID","IE","IL","IN","IQ","IR","IS","IT","JM","JO","JP","KE","KG","KH","KI",
  "KM","KN","KP","KR","KW","KZ","LA","LB","LC","LI","LK","LR","LS","LT","LU",
  "LV","LY","MA","MC","MD","ME","MG","MH","MK","ML","MM","MN","MR","MT","MU",
  "MV","MW","MX","MY","MZ","NA","NE","NG","NI","NL","NO","NP","NR","NZ","OM",
  "PA","PE","PG","PH","PK","PL","PT","PW","PY","QA","RO","RS","RU","RW","SA",
  "SB","SC","SD","SE","SG","SI","SK","SL","SM","SN","SO","SR","SS","ST","SV",
  "SY","SZ","TD","TG","TH","TJ","TL","TM","TN","TO","TR","TT","TV","TW","TZ",
  "UA","UG","US","UY","UZ","VA","VC","VE","VN","VU","WS","YE","ZA","ZM","ZW",
] as const;

export type CountryOption = { code: string; name: string };

const INTL_LOCALE: Record<string, string> = { ka: "ka-GE", en: "en-US" };

/**
 * Countries a shopper can pick at checkout, sorted by localized name.
 *
 * When `allowed` is given (the union of every configured shipping zone's
 * countries, with no fallback zone to catch the rest) the list is narrowed to
 * exactly what the shop can actually ship to — offering a destination the
 * checkout would then reject is worse than not offering it.
 */
export function countryOptions(
  locale: string,
  allowed?: readonly string[],
): CountryOption[] {
  const names = new Intl.DisplayNames([INTL_LOCALE[locale] ?? "en-US"], {
    type: "region",
  });

  const codes =
    allowed && allowed.length > 0
      ? ALPHA2.filter((code) => allowed.includes(code))
      : ALPHA2;

  return [...codes]
    .map((code) => ({ code, name: names.of(code) ?? code }))
    .sort((a, b) => a.name.localeCompare(b.name, INTL_LOCALE[locale] ?? "en"));
}
