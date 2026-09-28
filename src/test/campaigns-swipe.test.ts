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