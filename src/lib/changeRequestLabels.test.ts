import { describe, expect, it } from "vitest";
import { actionLabel, adminLink, readableValue, sectionKey, sectionLabel } from "./changeRequestLabels";

describe("change request labels", () => {
  it("reads the section from the route when the module is just «v1»", () => {
    expect(sectionKey("api/v1/programs/60", "v1")).toBe("programs");
    expect(sectionLabel(sectionKey("api/v1/donation-campaigns", "v1"))).toBe("حملة تبرع");
    expect(sectionKey("editor-registration", "editor-registration")).toBe("editor-registration");
  });
  it("names the action and links to the record", () => {
    expect(actionLabel("PUT")).toBe("تعديل");
    expect(actionLabel("REGISTER", "register")).toBe("تسجيل حساب");
    expect(adminLink("programs", 60)).toBe("/admin/programs/60");
    expect(adminLink("content", 3)).toBeNull();
  });
  it("shows values in words", () => {
    expect(readableValue("true")).toBe("نعم");
    expect(readableValue(null)).toBe("—");
    expect(readableValue("x")).toBe("x");
  });
});
