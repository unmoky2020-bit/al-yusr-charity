import { describe, expect, it } from "vitest";
import { mergeBoxes, spotAt, spotFromBox, spotUnder } from "./faceBlur";

describe("face blur helpers", () => {
  it("merges the same face found twice into one box that covers both", () => {
    const merged = mergeBoxes([
      { x: 100, y: 100, w: 50, h: 60, score: 0.9 },
      { x: 104, y: 96, w: 52, h: 66, score: 0.5 },
      { x: 400, y: 120, w: 40, h: 40, score: 0.7 },
    ]);
    expect(merged).toHaveLength(2);
    const face = merged.find((b) => b.x < 200)!;
    expect(face).toMatchObject({ x: 100, y: 96, w: 56, h: 66 });
  });

  it("keeps faces that only touch as separate faces", () => {
    expect(mergeBoxes([
      { x: 0, y: 0, w: 50, h: 50, score: 0.9 },
      { x: 48, y: 0, w: 50, h: 50, score: 0.9 },
    ])).toHaveLength(2);
  });

  it("the blur ellipse is wider and taller than the face box", () => {
    const s = spotFromBox({ x: 100, y: 200, w: 40, h: 50, score: 1 });
    expect(s.rx).toBeGreaterThan(20);
    expect(s.ry).toBeGreaterThan(25);
    expect(s.cx).toBe(120);
    expect(s.auto).toBe(true);
  });

  it("finds the tapped spot, preferring the smaller one when they overlap", () => {
    const big = spotAt(100, 100, 60);
    const small = spotAt(110, 100, 15);
    expect(spotUnder([big, small], 112, 102)).toBe(1);
    expect(spotUnder([big, small], 60, 100)).toBe(0);
    expect(spotUnder([big, small], 300, 300)).toBe(-1);
  });
});
