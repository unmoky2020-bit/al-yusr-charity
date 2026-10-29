import { describe, expect, it } from "vitest";
import {
  cleanPaymentDetails,
  describePayoutChange,
  hasLegacyDetails,
  summarizeDestinations,
  validatePaymentDetails,
} from "./paymentMethodsApi";

describe("validatePaymentDetails (same rules as the backend)", () => {
  it("accepts Egyptian mobile numbers only for wallets", () => {
    expect(validatePaymentDetails("wallet", { numbers: [{ number: "01097000137" }] })).toEqual({});
    const e = validatePaymentDetails("wallet", { numbers: [{ number: "0109700013" }, { number: "01397000137" }] });
    expect(Object.keys(e)).toEqual(["details.numbers.0.number", "details.numbers.1.number"]);
  });

  it("checks bank accounts field by field", () => {
    const ok = { accounts: [{ bank_code: "cib" as const, bank_name: "CIB", account_name: "مؤسسة اليسر", account_number: "100043605733" }] };
    expect(validatePaymentDetails("bank_transfer", ok)).toEqual({});
    const bad = { accounts: [{ bank_code: "cib" as const, bank_name: "CIB", account_name: "", account_number: "12AB", iban: "EG12", swift: "cib" }] };
    expect(Object.keys(validatePaymentDetails("bank_transfer", bad)).sort()).toEqual([
      "details.accounts.0.account_name",
      "details.accounts.0.account_number",
      "details.accounts.0.iban",
      "details.accounts.0.swift",
    ]);
  });

  it("checks InstaPay addresses and the limit of 5", () => {
    expect(validatePaymentDetails("instant_payment", { addresses: [{ ipa: "elyusr@cib" }] })).toEqual({});
    expect(validatePaymentDetails("instant_payment", { addresses: [{ ipa: "elyusr" }] })).toHaveProperty("details.addresses.0.ipa");
    const six = Array.from({ length: 6 }, () => ({ number: "01097000137" }));
    expect(validatePaymentDetails("wallet", { numbers: six })).toHaveProperty("details.numbers");
  });

  it("has nothing to validate for card / pickup", () => {
    expect(validatePaymentDetails("card", {})).toEqual({});
  });
});

describe("cleanPaymentDetails", () => {
  it("trims values and drops empty optional fields", () => {
    expect(cleanPaymentDetails("wallet", { numbers: [{ number: " 01097000137 ", label: "  " }] })).toEqual({ numbers: [{ number: "01097000137", label: undefined }] });
    expect(cleanPaymentDetails("bank_transfer", {
      accounts: [{ bank_code: "cib", bank_name: " CIB ", account_name: "اليسر", account_number: "100043605733", iban: "", swift: "cibeegcx" }],
    }).accounts?.[0]).toEqual({ bank_code: "cib", bank_name: "CIB", account_name: "اليسر", account_number: "100043605733", iban: undefined, swift: "CIBEEGCX" });
  });
});

describe("summarizeDestinations", () => {
  it("summarises numbers and accounts without showing them whole", () => {
    expect(summarizeDestinations({ type: "wallet", details: { numbers: [{ number: "01097000137" }, { number: "01000000002" }] } }))
      .toBe("رقمين: 0109…0137، 0100…0002");
    expect(summarizeDestinations({ type: "bank_transfer", details: { accounts: [{ bank_code: "cib", bank_name: "CIB", account_name: "x", account_number: "100043605733" }] } }))
      .toBe("حساب CIB ‎…5733");
  });

  it("flags empty and legacy details", () => {
    expect(summarizeDestinations({ type: "wallet", details: { numbers: [] } })).toBe("مفيش أرقام أو حسابات — مش هتظهر للمتبرع");
    const legacy = { type: "wallet", details: { wallet_number: "01234567890" } };
    expect(hasLegacyDetails(legacy)).toBe(true);
    expect(summarizeDestinations(legacy)).toBe("بيانات قديمة — اعمل حفظ بالشكل الجديد");
  });
});

describe("describePayoutChange", () => {
  it("lists old and new destinations for the confirmation", () => {
    expect(describePayoutChange("wallet", { numbers: [{ number: "01097000137" }] }, { numbers: [{ number: "01097000137" }, { number: "01011112222" }] }))
      .toEqual({ before: ["01097000137"], after: ["01097000137", "01011112222"] });
  });
});
