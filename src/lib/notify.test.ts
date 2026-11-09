import { beforeEach, describe, expect, it, vi } from "vitest";

const calls: Array<{ kind: string; message: unknown; opts: unknown }> = [];
vi.mock("sonner", () => {
  const make = (kind: string) => (message: unknown, opts: unknown) => { calls.push({ kind, message, opts }); return "id"; };
  return { toast: { success: make("success"), error: make("error"), info: make("info"), warning: make("warning"), loading: make("loading"), dismiss: vi.fn() } };
});

import { toast } from "./notify";

describe("notify", () => {
  beforeEach(() => { calls.length = 0; });

  it("the same text shown twice reuses one toast id (no stacked copies)", () => {
    toast.error("تعذّر إرسال الرمز", { description: "HTTP 404" });
    toast.error("تعذّر إرسال الرمز", { description: "HTTP 404" });
    const ids = calls.map((c) => (c.opts as { id?: string }).id);
    expect(ids[0]).toBeDefined();
    expect(ids[0]).toBe(ids[1]);
  });

  it("an explicit id (e.g. replacing a loading toast) is kept as given", () => {
    toast.success("تم", { id: 7 });
    expect((calls[0].opts as { id?: number }).id).toBe(7);
  });

  it("different messages get different ids", () => {
    toast.success("تم الحفظ");
    toast.success("تم الحذف");
    expect((calls[0].opts as { id: string }).id).not.toBe((calls[1].opts as { id: string }).id);
  });
});
