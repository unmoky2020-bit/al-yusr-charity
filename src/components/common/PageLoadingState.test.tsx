import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PageLoadingState } from "./PageLoadingState";

describe("PageLoadingState", () => {
  it("uses one accessible loader that the boot splash can recognise", () => {
    render(<PageLoadingState />);

    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByText("جارٍ التحميل")).toBeInTheDocument();
    expect(document.querySelector("[data-page-loading]")).toBeInTheDocument();
    expect(document.querySelector('[aria-busy="true"]')).not.toBeInTheDocument();
  });
});
