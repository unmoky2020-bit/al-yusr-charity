/** Arabic-Indic (٠-٩) and Persian (۰-۹) digits as Western digits; everything else unchanged. */
export function toLatinDigits(v: string): string {
  return v
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0));
}

/** Only the digits of a value, in Western form ("٠١٠ 123-45" → "01012345"). */
export function digitsOf(v: string): string {
  return toLatinDigits(v).replace(/\D/g, "");
}
