import { PHONE_COUNTRIES } from "@/data/phoneCountries";

export type PhoneCountry = { code: string; dial: string; pattern: RegExp; lengths: number[] };

export const COUNTRIES: PhoneCountry[] = PHONE_COUNTRIES.map(([code, dial, pattern, lengths]) => ({
  code,
  dial,
  pattern: new RegExp(`^(?:${pattern})$`),
  lengths,
}));

const BY_CODE = new Map(COUNTRIES.map((c) => [c.code, c]));
/** Longest calling code first, so "+1876…" is Jamaica before "+1…" is the US. */
const BY_DIAL = [...COUNTRIES].sort((a, b) => b.dial.length - a.dial.length);

/** Countries most donors write from: shown first in the picker. */
export const PINNED = ["EG", "SA", "AE", "KW", "QA", "BH", "OM", "JO", "LY", "GB", "US", "DE"];

export const DEFAULT_COUNTRY = "EG";

export const countryOf = (code: string): PhoneCountry => BY_CODE.get(code) ?? BY_CODE.get(DEFAULT_COUNTRY)!;

/** Arabic / Western-Arabic digits only ("٠١٠ 123-45" → "01012345"). */
export function digitsOf(v: string): string {
  return v
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(/\D/g, "");
}

/** National significant number: the national digits without the trunk "0". */
const nsn = (national: string) => national.replace(/^0+/, "");

/**
 * The value a form stores: Egyptian numbers keep the local form the API and donor matching already
 * use ("01012345678"); every other country is international ("+966512345678").
 */
export function toValue(country: PhoneCountry, national: string): string {
  const d = digitsOf(national);
  if (!d) return "";
  if (country.code === "EG") return `0${nsn(d)}`;
  return `+${country.dial}${nsn(d)}`;
}

/** Splits a stored value back into its country and national part (for editing an existing number). */
export function fromValue(value: string | null | undefined, fallback = DEFAULT_COUNTRY): { country: PhoneCountry; national: string } {
  const raw = (value ?? "").trim();
  const d = digitsOf(raw);
  if (!d) return { country: countryOf(fallback), national: "" };
  const international = raw.startsWith("+") || raw.startsWith("00");
  if (international) {
    const full = raw.startsWith("00") ? d.slice(2) : d;
    const c = BY_DIAL.find((x) => full.startsWith(x.dial));
    if (c) return { country: c, national: full.slice(c.dial.length) };
  }
  return { country: countryOf(fallback), national: d };
}

/** True when the number fits the country's numbering plan (length + pattern). Empty is not valid. */
export function isValidPhone(country: PhoneCountry, national: string): boolean {
  const n = nsn(digitsOf(national));
  if (!n) return false;
  return country.lengths.includes(n.length) && country.pattern.test(n);
}

/** Country name in the page language ("مصر" / "Egypt"); falls back to the code. */
export function countryName(code: string, lang: "ar" | "en"): string {
  try {
    return new Intl.DisplayNames([lang], { type: "region" }).of(code) ?? code;
  } catch {
    return code;
  }
}

/** Validity of a stored value (01XXXXXXXXX or +<code><number>). */
export function isValidPhoneValue(value: string | null | undefined): boolean {
  const { country, national } = fromValue(value);
  return isValidPhone(country, national);
}
