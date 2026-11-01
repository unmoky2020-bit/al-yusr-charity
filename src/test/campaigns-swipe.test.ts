import { describe, it, expect } from "vitest";
import { progressToSlide, scrollTopForSlide, swipeTargetSlide } from "@/components/sections/CampaignsScroll";

describe("CampaignsScroll scroll-driven navigation", () => {
  it("maps scroll progress to the expected active slide", () => {
    expect(progressToSlide(0, 5)).toBe(0);
    expect(progressToSlide(0.5, 5)).toBe(2);
    expect(progressToSlide(1, 5)).toBe(4);
  });

  it("clamps out-of-range progress instead of jumping", () => {
    expect(progressToSlide(-0.2, 5)).toBe(0);
    expect(progressToSlide(1.3, 5)).toBe(4);
  });

  it("computes a stable top offset per slide", () => {
    expect(scrollTopForSlide(1000, 4000, 2, 5)).toBe(3000);
  });

  it("keeps indicator clicks within section bounds", () => {
    expect(scrollTopForSlide(1000, 4000, -3, 5)).toBe(1000);
    expect(scrollTopForSlide(1000, 4000, 99, 5)).toBe(5000);
  });

  it("keeps vertical scrolling from being treated as a swipe", () => {
    expect(swipeTargetSlide(2, 5, 28, 160, true)).toBe(2);
    expect(swipeTargetSlide(2, 5, -28, 160, false)).toBe(2);
  });

  it("maps horizontal swipe direction correctly in RTL and LTR", () => {
    expect(swipeTargetSlide(2, 5, -90, 10, false)).toBe(3);
    expect(swipeTargetSlide(2, 5, 90, 10, false)).toBe(1);
    expect(swipeTargetSlide(2, 5, -90, 10, true)).toBe(1);
    expect(swipeTargetSlide(2, 5, 90, 10, true)).toBe(3);
  });
});
import { slideForProgress } from "@/components/sections/CampaignsScroll";

describe("slideForProgress (pinned carousel, hysteresis at zone edges)", () => {
  // 5 slides → each zone is 0.2 of the progress.
  it("maps progress to equal zones when far from an edge", () => {
    expect(slideForProgress(0.1, 5, 0)).toBe(0);
    expect(slideForProgress(0.5, 5, 0)).toBe(2);
    expect(slideForProgress(0.99, 5, 3)).toBe(4);
  });
  it("keeps the current slide while the position wobbles just past an edge", () => {
    expect(slideForProgress(0.205, 5, 0)).toBe(0); // 0.025 zone past the edge of slide 0
    expect(slideForProgress(0.195, 5, 1)).toBe(1); // 0.025 zone back into slide 0
  });
  it("switches once the position is clearly past the edge", () => {
    expect(slideForProgress(0.23, 5, 0)).toBe(1);
    expect(slideForProgress(0.17, 5, 1)).toBe(0);
  });
  it("jumps directly when the position skips more than one slide", () => {
    expect(slideForProgress(0.61, 5, 0)).toBe(3);
  });
  it("handles a single slide and out-of-range progress", () => {
    expect(slideForProgress(0.7, 1, 0)).toBe(0);
    expect(slideForProgress(-1, 5, 2)).toBe(0);
    expect(slideForProgress(2, 5, 2)).toBe(4);
  });
});
