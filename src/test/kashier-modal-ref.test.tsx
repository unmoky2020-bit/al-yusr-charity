import { act, render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

const verify = vi.fn().mockResolvedValue({ status: "pending", data: null });
vi.mock("@/data/casesApi", () => ({ verifyDonationPayment: (ref: string) => verify(ref) }));

import { KashierCheckoutModal } from "@/components/donate/KashierCheckoutModal";

const SESSION = "https://payments.kashier.io/session/abc";

describe("KashierCheckoutModal payment reference", () => {
  afterEach(() => {
    vi.useRealTimers();
    verify.mockClear();
  });

  it("verifies the reference the backend saved, even after re-renders while closed", async () => {
    vi.useFakeTimers();
    const props = { amount: 100, onClose: () => {}, sessionUrl: SESSION };
    const ui = (isOpen: boolean, orderId: string) => (
      <MemoryRouter>
        <KashierCheckoutModal {...props} isOpen={isOpen} orderId={orderId} />
      </MemoryRouter>
    );
    const { rerender } = render(ui(false, ""));
    // The donate page re-renders many times before the donor pays.
    rerender(ui(false, ""));
    rerender(ui(false, ""));
    // Backend reference and "open" arrive in the same update.
    rerender(ui(true, "YSR-REAL1234-5678"));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });
    expect(verify).toHaveBeenCalled();
    for (const [ref] of verify.mock.calls) expect(ref).toBe("YSR-REAL1234-5678");
  });
});
