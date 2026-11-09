import { describe, expect, it } from "vitest";
import { mediaFileProblem, MEDIA_INPUT_MAX_BYTES, MEDIA_MAX_BYTES } from "./mediaApi";

const file = (name: string, type: string, size: number) => ({ name, type, size });

describe("upload rules (mediaFileProblem)", () => {
  it("accepts photos up to 25 MB: they are shrunk in the browser before upload", () => {
    expect(mediaFileProblem(file("field.jpg", "image/jpeg", 12 * 1024 * 1024))).toBeNull();
    expect(mediaFileProblem(file("poster.png", "image/png", MEDIA_INPUT_MAX_BYTES))).toBeNull();
    expect(mediaFileProblem(file("big.webp", "image/webp", MEDIA_INPUT_MAX_BYTES + 1))).toMatch(/25/);
  });

  it("keeps GIF / AVIF as they are, so they must already be under 5 MB", () => {
    expect(mediaFileProblem(file("a.gif", "image/gif", MEDIA_MAX_BYTES))).toBeNull();
    expect(mediaFileProblem(file("a.gif", "image/gif", MEDIA_MAX_BYTES + 1))).toMatch(/5/);
  });

  it("explains other formats, and iPhone HEIC photos in particular", () => {
    expect(mediaFileProblem(file("doc.pdf", "application/pdf", 1000))).toMatch(/JPG/);
    expect(mediaFileProblem(file("IMG_1234.HEIC", "", 1000))).toMatch(/HEIC/);
    expect(mediaFileProblem(file("IMG_1234.HEIC", "", 1000), "en")).toMatch(/convert it to JPG/);
  });
});
