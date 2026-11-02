import { describe, expect, it } from "vitest";
import { roomDuas, roomShareText, roomTagline, roomTitle } from "@/data/memorialDuas";

describe("roomTitle", () => {
  it("adds المرحوم / المرحومة by gender, once", () => {
    expect(roomTitle("deceased", "m", "محمد علي", true)).toBe("لروح المرحوم محمد علي");
    expect(roomTitle("deceased", "f", "فاطمة", true)).toBe("لروح المرحومة فاطمة");
    expect(roomTitle("deceased", "m", "المرحوم محمد", true)).toBe("لروح المرحوم محمد");
    expect(roomTitle(undefined, null, "محمد", true)).toBe("لروح محمد");
  });
  it("words sick and group rooms", () => {
    expect(roomTitle("sick", "f", "أم أحمد", true)).toBe("بنية شفاء أم أحمد");
    expect(roomTitle("group", null, "عيلة سعيد", true)).toBe("عيلة سعيد");
  });
});

describe("roomDuas", () => {
  it("uses the feminine pronoun for a woman and puts the name in the dua", () => {
    const f = roomDuas("deceased", "f", "فاطمة");
    expect(f[0].text).toContain("اللهم اغفر لها وارحمها");
    expect(f[1].text).toContain("اللهم إن فاطمة في ذمّتك");
    const m = roomDuas("deceased", "m", "محمد");
    expect(m[0].text).toContain("اللهم اغفر له وارحمه");
  });
  it("gives healing duas for the sick, with the 7× one countable", () => {
    const d = roomDuas("sick", "m", "أحمد");
    expect(d.some((x) => x.text.includes("أذهب البأس"))).toBe(true);
    expect(d.find((x) => x.repeat)?.repeat).toBe(7);
    expect(roomTagline("sick", "f", true)).toContain("اشفِها");
  });
  it("share text names the room", () => {
    expect(roomShareText("deceased", "m", "محمد", true)).toContain("لروح المرحوم محمد");
  });
});
