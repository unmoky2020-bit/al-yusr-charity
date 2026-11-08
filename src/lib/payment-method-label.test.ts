import { describe, expect, it } from "vitest";
import { donationPaymentMethodLabel } from "./payment-method-label";

describe("donationPaymentMethodLabel", () => {
  it("uses the detailed method instead of a generic bank enum", () => {
    expect(donationPaymentMethodLabel({
      payment_method: "bank",
      payment_method_id: 4,
      payment_method_details: { id: 4, name_ar: "إنستا باي", name_en: "InstaPay", slug: "instapay", type: "instant_payment" },
    }, "ar")).toBe("إنستا باي");
  });

  it("uses the documented method id when detail endpoints only return a generic bank type", () => {
    expect(donationPaymentMethodLabel({ payment_method: "bank", payment_method_id: 4 }, "en")).toBe("InstaPay");
    expect(donationPaymentMethodLabel({
      payment_method: "bank",
      payment_method_id: 4,
      payment_method_details: { id: 4, name_ar: "تحويل بنكي مباشر", name_en: "Direct bank transfer" },
    }, "ar")).toBe("إنستا باي");
  });

  it("preserves ordinary bank transfer and known gateway labels", () => {
    expect(donationPaymentMethodLabel({ payment_method: "bank", payment_method_id: 2 }, "ar")).toBe("تحويل بنكي");
    expect(donationPaymentMethodLabel({ payment_method: "visa", payment_method_id: 8 }, "en")).toBe("Credit card - Kashier");
  });
});
