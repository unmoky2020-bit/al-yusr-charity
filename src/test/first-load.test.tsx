import { act, render, renderHook, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { isFirstLoad, useFirstLoad } from "@/hooks/useFirstLoad";

describe("isFirstLoad", () => {
  it("is true only while a query that never failed is loading", () => {
    expect(isFirstLoad({ isLoading: true, errorUpdatedAt: 0 })).toBe(true);
    expect(isFirstLoad({ isLoading: false, errorUpdatedAt: 0 })).toBe(false);
    // A refetch after a failure puts the query back to "pending": not a first load any more.
    expect(isFirstLoad({ isLoading: true, errorUpdatedAt: Date.now() })).toBe(false);
  });
});

describe("useFirstLoad", () => {
  afterEach(() => vi.useRealTimers());

  it("stops waiting after maxWait, so a slow API never keeps a page blank", () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useFirstLoad({ isLoading: true, errorUpdatedAt: 0 }, true, 1000));
    expect(result.current).toBe(true);
    act(() => { vi.advanceTimersByTime(1000); });
    expect(result.current).toBe(false);
  });

  it("is false when disabled", () => {
    const { result } = renderHook(() => useFirstLoad({ isLoading: true, errorUpdatedAt: 0 }, false));
    expect(result.current).toBe(false);
  });
});

describe("a page gated on its content query while the API is down", () => {
  it("settles on its built-in content instead of looping between loading and content", async () => {
    const fetcher = vi.fn(async () => { throw new Error("API down"); });
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;

    // Sections read the same query as the gate (as the landing pages do).
    const Section = () => {
      const q = useQuery({ queryKey: ["content"], queryFn: fetcher });
      return <p>{q.data ? "dashboard" : "built-in"}</p>;
    };
    const Page = () => {
      const q = useQuery({ queryKey: ["content"], queryFn: fetcher });
      if (useFirstLoad(q)) return <p>loading</p>;
      return <><Section /><Section /></>;
    };

    render(<Page />, { wrapper });
    expect(screen.getByText("loading")).toBeTruthy();
    await waitFor(() => expect(screen.getAllByText("built-in")).toHaveLength(2));
    // The sections' mount refetch must not bring the loading state back.
    await new Promise((r) => setTimeout(r, 50));
    expect(screen.queryByText("loading")).toBeNull();
    expect(fetcher.mock.calls.length).toBeLessThanOrEqual(2);
  });
});
