import { describe, expect, it } from "vitest";
import { optionIdOf, toPaymentOptions } from "./paymentOptions";

const m = (o: Record<string, unknown>) => ({ id: 1, slug: "x", type: "wallet", name_ar: "طريقة", is_active: true, sort_order: 1, details: {}, ...o });

describe("toPaymentOptions (donation form payment methods)", () => {
  it("offers only active methods, in dashboard order", () => {
    const opts = toPaymentOptions([
      m({ id: 2, slug: "credit-card-kashier", type: "card", sort_order: 2 }),
      m({ id: 3, slug: "vodafone-cash", type: "wallet", is_active: false, details: { numbers: [{ number: "01097000137" }] } }),
      m({ id: 5, slug: "home-pickup", type: "cash_pickup", sort_order: 1 }),
    ]);
    expect(opts.map((o) => o.id)).toEqual(["delegate_pickup", "card_kashier"]);
  });

  it("never invents a destination: a transfer method without a valid number is not offered", () => {
    const opts = toPaymentOptions([
      m({ slug: "vodafone-cash", details: { numbers: [] } }),
      m({ slug: "orange-cash", details: { wallet_number: "01234567890" } }),
      m({ slug: "instapay", type: "instant_payment", details: { addresses: [{ ipa: "not-an-ipa" }] } }),
      m({ slug: "bank-transfer", type: "bank_transfer", details: { accounts: [{ bank_code: "cib", account_number: "" }] } }),
    ]);
    expect(opts).toEqual([]);
  });

  it("keeps every valid number / account of a method", () => {
    const [wallet, bank] = toPaymentOptions([
      m({ slug: "vodafone-cash", details: { numbers: [{ number: "01097000137" }, { number: "01000000002", label: "رقم تاني" }, { number: "12345" }] } }),
      m({ id: 9, slug: "bank-transfer", type: "bank_transfer", sort_order: 2, details: { accounts: [
        { bank_code: "cib", bank_name: "البنك التجاري الدولي (CIB)", account_name: "مؤسسة اليسر الخيرية", account_number: "100043605733" },
        { bank_code: "nbe", bank_name: "البنك الأهلي", account_name: "مؤسسة اليسر الخيرية", account_number: "1234567890", iban: "EG380019000500000000263180002" },
      ] } }),
    ]);
    expect(wallet.destinations.map((d) => d.value)).toEqual(["01097000137", "01000000002"]);
    expect(wallet.destinations[1].labelAr).toBe("رقم تاني");
    expect(bank.destinations.map((d) => [d.bankCode, d.value])).toEqual([["cib", "100043605733"], ["nbe", "1234567890"]]);
  });

  it("maps backend methods to the form's option ids", () => {
    expect(optionIdOf({ slug: "credit-card-kashier", type: "card" })).toBe("card_kashier");
    expect(optionIdOf({ slug: "credit-card", type: "card" })).toBeNull();
    expect(optionIdOf({ slug: "vodafone-cash", type: "wallet" })).toBe("vodafone_cash");
    expect(optionIdOf({ slug: "bank-transfer", type: "bank_transfer" })).toBe("bank_transfer");
  });
});
