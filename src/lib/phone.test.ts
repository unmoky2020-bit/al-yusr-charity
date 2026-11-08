import { describe, expect, it } from "vitest";
import { countryOf, fromValue, isValidPhone, toValue } from "./phone";

describe("phone numbers", () => {
  it("keeps Egyptian numbers in the local form the API already uses", () => {
    expect(toValue(countryOf("EG"), "01012345678")).toBe("01012345678");
    expect(toValue(countryOf("EG"), "1012345678")).toBe("01012345678");
    expect(toValue(countryOf("EG"), "٠١٠١٢٣٤٥٦٧٨")).toBe("01012345678");
    expect(isValidPhone(countryOf("EG"), "01012345678")).toBe(true);
    expect(isValidPhone(countryOf("EG"), "0101234")).toBe(false);
  });

  it("stores other countries in international form and reads them back", () => {
    expect(toValue(countryOf("SA"), "0512345678")).toBe("+966512345678");
    const back = fromValue("+966512345678");
    expect(back.country.code).toBe("SA");
    expect(back.national).toBe("512345678");
    expect(isValidPhone(back.country, back.national)).toBe(true);
    expect(fromValue("+447911123456").country.code).toBe("GB");
  });

  it("reads an old local value as Egyptian", () => {
    const v = fromValue("01112345678");
    expect(v.country.code).toBe("EG");
    expect(v.national).toBe("01112345678");
  });
});
