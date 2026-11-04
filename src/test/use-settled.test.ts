import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useSettled } from "@/hooks/useCampaignPage";

/**
 * The content gates (/takrim, /medical, campaign and project landings) must open once and stay open.
 * With the API down, every component mounted under a gate refetches the failed query, which flips
 * "loading" back on; before the latch that swapped the page for its skeleton again, forever.
 */
describe("useSettled", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("stays ready when loading starts again after it settled", () => {
    const { result, rerender } = renderHook(({ s }) => useSettled(s, 8000), { initialProps: { s: false } });
    expect(result.current).toBe(false);
    rerender({ s: true });
    expect(result.current).toBe(true);
    rerender({ s: false });
    expect(result.current).toBe(true);
  });

  it("opens after the wait when the value never settles", () => {
    const { result } = renderHook(() => useSettled(false, 8000));
    expect(result.current).toBe(false);
    act(() => { vi.advanceTimersByTime(7999); });
    expect(result.current).toBe(false);
    act(() => { vi.advanceTimersByTime(1); });
    expect(result.current).toBe(true);
  });

  it("waits again for a new page (reset key)", () => {
    const { result, rerender } = renderHook(({ s, k }) => useSettled(s, 8000, k), { initialProps: { s: true, k: "takrim" } });
    expect(result.current).toBe(true);
    rerender({ s: false, k: "medical" });
    expect(result.current).toBe(false);
    rerender({ s: true, k: "medical" });
    expect(result.current).toBe(true);
  });
});
