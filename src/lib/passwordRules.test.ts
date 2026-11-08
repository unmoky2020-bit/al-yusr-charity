import { describe, expect, it } from "vitest";
import { newPasswordProblem } from "./passwordRules";
import { digitsOf, toLatinDigits } from "./digits";

describe("new password rules", () => {
  it("accepts 8+ characters that match", () => {
    expect(newPasswordProblem("Yusr2026!", "Yusr2026!", "ar")).toBeNull();
  });
  it("rejects short, mismatched, padded or reused passwords", () => {
    expect(newPasswordProblem("1234567", "1234567", "ar")).toMatch(/8/);
    expect(newPasswordProblem("abcdefgh", "abcdefgi", "ar")).toMatch(/متطابقتين/);
    expect(newPasswordProblem(" abcdefgh", " abcdefgh", "en")).toMatch(/spaces/);
    expect(newPasswordProblem("abcdefgh", "abcdefgh", "en", "abcdefgh")).toMatch(/different/);
  });
});

describe("digits", () => {
  it("reads Arabic-Indic and Persian digits", () => {
    expect(toLatinDigits("٠١٢٣٤٥٦٧٨٩")).toBe("0123456789");
    expect(digitsOf("۱۲۳ - 45")).toBe("12345");
  });
});
