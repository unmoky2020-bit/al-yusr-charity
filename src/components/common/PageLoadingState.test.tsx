import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PageLoadingState } from "./PageLoadingState";

describe("PageLoadingState", () => {
  it("uses a compact accessible loader instead of a page skeleton", () => {
    render(<PageLoadingState />);

    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByText("جاري التحميل")).toBeInTheDocument();
    expect(document.querySelector('[aria-busy="true"]')).not.toBeInTheDocument();
  });
});
