/**
 * Country list for the company-onboarding address form.
 *
 * The CRA applies to economic operators placing products on the EU market, so
 * the list leads with EU/EEA member states plus the UK, Switzerland and other
 * common manufacturing/importing origins, then the rest of the world. We store
 * the human-readable `name` (not the ISO code) because the existing
 * `organizations.country` column and the Declaration-of-Conformity templates
 * already use full country names, and a free-text field previously wrote names.
 *
 * `code` (ISO 3166-1 alpha-2) is kept for future use (flags, validation) but
 * the form currently submits `name` to stay backward-compatible with existing
 * rows.
 */

export interface Country {
  code: string;
  name: string;
}

/** EU + EEA member states, alphabetical by name. */
export const EU_EEA_COUNTRIES: readonly Country[] = [
  { code: "AT", name: "Austria" },
  { code: "BE", name: "Belgium" },
  { code: "BG", name: "Bulgaria" },
  { code: "HR", name: "Croatia" },
  { code: "CY", name: "Cyprus" },
  { code: "CZ", name: "Czechia" },
  { code: "DK", name: "Denmark" },
  { code: "EE", name: "Estonia" },
  { code: "FI", name: "Finland" },
  { code: "FR", name: "France" },
  { code: "DE", name: "Germany" },
  { code: "GR", name: "Greece" },
  { code: "HU", name: "Hungary" },
  { code: "IS", name: "Iceland" },
  { code: "IE", name: "Ireland" },
  { code: "IT", name: "Italy" },
  { code: "LV", name: "Latvia" },
  { code: "LI", name: "Liechtenstein" },
  { code: "LT", name: "Lithuania" },
  { code: "LU", name: "Luxembourg" },
  { code: "MT", name: "Malta" },
  { code: "NL", name: "Netherlands" },
  { code: "NO", name: "Norway" },
  { code: "PL", name: "Poland" },
  { code: "PT", name: "Portugal" },
  { code: "RO", name: "Romania" },
  { code: "SK", name: "Slovakia" },
  { code: "SI", name: "Slovenia" },
  { code: "ES", name: "Spain" },
  { code: "SE", name: "Sweden" },
] as const;

/** The rest of the world, alphabetical by name. */
export const OTHER_COUNTRIES: readonly Country[] = [
  { code: "AL", name: "Albania" },
  { code: "AR", name: "Argentina" },
  { code: "AU", name: "Australia" },
  { code: "BR", name: "Brazil" },
  { code: "CA", name: "Canada" },
  { code: "CL", name: "Chile" },
  { code: "CN", name: "China" },
  { code: "CO", name: "Colombia" },
  { code: "EG", name: "Egypt" },
  { code: "HK", name: "Hong Kong" },
  { code: "IN", name: "India" },
  { code: "ID", name: "Indonesia" },
  { code: "IL", name: "Israel" },
  { code: "JP", name: "Japan" },
  { code: "MY", name: "Malaysia" },
  { code: "MX", name: "Mexico" },
  { code: "NZ", name: "New Zealand" },
  { code: "PH", name: "Philippines" },
  { code: "RS", name: "Serbia" },
  { code: "SG", name: "Singapore" },
  { code: "ZA", name: "South Africa" },
  { code: "KR", name: "South Korea" },
  { code: "CH", name: "Switzerland" },
  { code: "TW", name: "Taiwan" },
  { code: "TH", name: "Thailand" },
  { code: "TR", name: "Türkiye" },
  { code: "UA", name: "Ukraine" },
  { code: "AE", name: "United Arab Emirates" },
  { code: "GB", name: "United Kingdom" },
  { code: "US", name: "United States" },
  { code: "VN", name: "Vietnam" },
] as const;

/**
 * Full ordered country list: EU/EEA first (most CRA operators are here), then
 * the rest of the world. Used to populate the onboarding country dropdown.
 */
export const COUNTRIES: readonly Country[] = [
  ...EU_EEA_COUNTRIES,
  ...OTHER_COUNTRIES,
];

/** Set of valid country names for validation. */
export const COUNTRY_NAMES: ReadonlySet<string> = new Set(
  COUNTRIES.map((c) => c.name),
);

/** True when `value` is a recognised country name in {@link COUNTRIES}. */
export function isKnownCountry(value: string): boolean {
  return COUNTRY_NAMES.has(value.trim());
}
