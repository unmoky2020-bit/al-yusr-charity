import { describe, expect, it } from "vitest";
import { arabicLine, arabicServerMessage } from "./serverMessages";

describe("server messages in Arabic", () => {
  it("translates the register validation answer", () => {
    const msg = arabicServerMessage("The email has already been taken. (and 2 more errors)", {
      email: ["The email has already been taken."],
      phone: ["The phone field is required."],
      password: ["The password field confirmation does not match.", "The password field must be at least 8 characters."],
    });
    expect(msg).toBe("البريد الإلكتروني ده مسجل قبل كده. خانة «رقم الموبايل» مطلوبة. تأكيد كلمة المرور مش مطابق.");
    expect(/مسجل/.test(msg)).toBe(true);
  });

  it("translates untranslated keys and known sentences", () => {
    expect(arabicLine("messages.invalid_credentials")).toBe("البريد أو كلمة المرور غلط.");
    expect(arabicLine("messages.account_inactive")).toContain("مش مفعّل");
    expect(arabicLine("The selected role is invalid.")).toBe("قيمة «نوع الحساب» مش مقبولة.");
  });

  it("keeps unknown text as it is", () => {
    expect(arabicLine("تعذر الاتصال")).toBe("تعذر الاتصال");
    expect(arabicServerMessage("Something else")).toBe("Something else");
  });
});
