/**
 * Faces in photos the team attaches to impact records (delivery steps, distribution days, case lines)
 * are blurred IN THE BROWSER before anything is uploaded — the original never reaches the server.
 *
 *  - Two small on-device models find the faces (face-api, MIT): SSD MobileNet is good with groups,
 *    Tiny catches faces it misses (sunglasses, hats). Big photos are also scanned in four tiles so
 *    small faces at the back are found. Nothing is sent anywhere for this.
 *  - A person always checks the result: tap a face that was missed, tap a wrong spot to clear it.
 *    If the models can't load (old phone, no network) the editor works by hand.
 *  - The blur keeps ~7 colour cells across a face and smooths them back up: nothing of the face is
 *    left to recover. Re-encoding through a canvas also drops the photo's EXIF (GPS, phone model).
 *
 * No ctx.filter (Safari ignores it): blurring is a down-scale / up-scale through small canvases.
 */

export interface BlurSpot {
  id: string;
  /** centre and radii in the working image's pixels */
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  /** found by the models (false = added by hand) */
  auto: boolean;
}

/** Longest side of what we keep and upload. */
export const MAX_SIDE = 1600;
const CELLS_ACROSS = 7;

let seq = 0;
const nextId = () => `s${Date.now().toString(36)}${(seq++).toString(36)}`;

/* ── image in ─────────────────────────────────────────────────────────────── */

async function decode(file: Blob): Promise<{ img: CanvasImageSource; w: number; h: number; close?: () => void }> {
  if (typeof createImageBitmap === "function") {
    try {
      const bmp = await createImageBitmap(file, { imageOrientation: "from-image" });
      return { img: bmp, w: bmp.width, h: bmp.height, close: () => bmp.close() };
    } catch {
      /* fall back to <img> (older Safari) */
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const el = new Image();
    el.decoding = "async";
    el.src = url;
    await el.decode();
    return { img: el, w: el.naturalWidth, h: el.naturalHeight };
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** The photo, upright and at most MAX_SIDE on its long side, drawn on a canvas. */
export async function loadPhoto(file: Blob, maxSide = MAX_SIDE): Promise<HTMLCanvasElement> {
  const { img, w, h, close } = await decode(file);
  if (!w || !h) throw new Error("unreadable");
  const k = Math.min(1, maxSide / Math.max(w, h));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(w * k));
  canvas.height = Math.max(1, Math.round(h * k));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("no-canvas");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  close?.();
  return canvas;
}

/* ── finding faces ────────────────────────────────────────────────────────── */

type FaceApi = typeof import("@vladmandic/face-api");
let models: Promise<FaceApi> | null = null;

async function fetchWeights(faceapi: FaceApi, binUrl: string, manifestUrl: string) {
  const [buf, manifest] = await Promise.all([
    fetch(binUrl).then((r) => {
      if (!r.ok) throw new Error(`model ${r.status}`);
      return r.arrayBuffer();
    }),
    fetch(manifestUrl).then((r) => r.json() as Promise<Array<{ weights: Parameters<FaceApi["tf"]["io"]["decodeWeights"]>[1] }>>),
  ]);
  return faceapi.tf.io.decodeWeights(buf, manifest[0].weights);
}

/** Loads the library and both models once (≈1.3 MB + 5.8 MB, cached by the browser afterwards). */
export function loadFaceModels(): Promise<FaceApi> {
  models ??= (async () => {
    const [faceapi, ssdBin, ssdManifest, tinyBin, tinyManifest] = await Promise.all([
      import("@vladmandic/face-api"),
      import("@vladmandic/face-api/model/ssd_mobilenetv1_model.bin?url").then((m) => m.default),
      import("@vladmandic/face-api/model/ssd_mobilenetv1_model-weights_manifest.json?url").then((m) => m.default),
      import("@vladmandic/face-api/model/tiny_face_detector_model.bin?url").then((m) => m.default),
      import("@vladmandic/face-api/model/tiny_face_detector_model-weights_manifest.json?url").then((m) => m.default),
    ]);
    // The bundled tfjs has ready() at runtime; face-api's slim typings leave it out.
    await (faceapi.tf as unknown as { ready: () => Promise<void> }).ready();
    const [ssd, tiny] = await Promise.all([fetchWeights(faceapi, ssdBin, ssdManifest), fetchWeights(faceapi, tinyBin, tinyManifest)]);
    faceapi.nets.ssdMobilenetv1.loadFromWeightMap(ssd);
    faceapi.nets.tinyFaceDetector.loadFromWeightMap(tiny);
    return faceapi;
  })().catch((err) => {
    models = null; // let the next photo try again
    throw err;
  });
  return models;
}

interface Box { x: number; y: number; w: number; h: number; score: number }

const iou = (a: Box, b: Box) => {
  const ix = Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x));
  const iy = Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
  const inter = ix * iy;
  return inter / (a.w * a.h + b.w * b.h - inter || 1);
};
const holdsCentreOf = (a: Box, b: Box) => {
  const cx = b.x + b.w / 2;
  const cy = b.y + b.h / 2;
  return cx > a.x && cx < a.x + a.w && cy > a.y && cy < a.y + a.h;
};

/** One box per face: overlapping finds of the same face become their union. */
export function mergeBoxes(boxes: Box[]): Box[] {
  const out: Box[] = [];
  for (const b of [...boxes].sort((p, q) => q.score - p.score)) {
    const same = out.find((o) => iou(o, b) > 0.25 || holdsCentreOf(o, b) || holdsCentreOf(b, o));
    if (!same) {
      out.push({ ...b });
      continue;
    }
    const x = Math.min(same.x, b.x);
    const y = Math.min(same.y, b.y);
    same.w = Math.max(same.x + same.w, b.x + b.w) - x;
    same.h = Math.max(same.y + same.h, b.y + b.h) - y;
    same.x = x;
    same.y = y;
  }
  return out;
}

/** A face box → the ellipse we blur: wider than the face and taller (hair, chin). */
export function spotFromBox(b: Box, auto = true): BlurSpot {
  return { id: nextId(), cx: b.x + b.w / 2, cy: b.y + b.h * 0.45, rx: (b.w / 2) * 1.4, ry: (b.h / 2) * 1.55, auto };
}

/**
 * Finds the faces of a working image. Slow devices skip the extra tile pass (the person still
 * checks the result). Throws when the models can't load — the editor then works by hand.
 */
export async function detectFaces(canvas: HTMLCanvasElement): Promise<BlurSpot[]> {
  const faceapi = await loadFaceModels();
  const ssdOpts = new faceapi.SsdMobilenetv1Options({ minConfidence: 0.3, maxResults: 100 });
  const tinyOpts = new faceapi.TinyFaceDetectorOptions({ inputSize: 608, scoreThreshold: 0.3 });
  const toBox = (d: { box: { x: number; y: number; width: number; height: number }; score: number }, dx = 0, dy = 0): Box => ({
    x: d.box.x + dx, y: d.box.y + dy, w: d.box.width, h: d.box.height, score: d.score,
  });

  const started = performance.now();
  const boxes: Box[] = [
    ...(await faceapi.detectAllFaces(canvas, ssdOpts)).map((d) => toBox(d)),
    ...(await faceapi.detectAllFaces(canvas, tinyOpts)).map((d) => toBox(d)),
  ];

  // Small faces at the back of a group: look again at four overlapping quarters.
  const long = Math.max(canvas.width, canvas.height);
  if (long >= 1000 && performance.now() - started < 6000) {
    const tw = Math.round(canvas.width * 0.6);
    const th = Math.round(canvas.height * 0.6);
    const tile = document.createElement("canvas");
    tile.width = tw;
    tile.height = th;
    const tctx = tile.getContext("2d");
    if (tctx) {
      for (const [fx, fy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
        const ox = fx ? canvas.width - tw : 0;
        const oy = fy ? canvas.height - th : 0;
        tctx.clearRect(0, 0, tw, th);
        tctx.drawImage(canvas, ox, oy, tw, th, 0, 0, tw, th);
        boxes.push(...(await faceapi.detectAllFaces(tile, ssdOpts)).map((d) => toBox(d, ox, oy)));
      }
    }
  }

  // Tiny "faces" (a few pixels) are noise; real ones are at least ~1.2% of the long side.
  const min = long * 0.012;
  return mergeBoxes(boxes.filter((b) => b.w >= min && b.h >= min)).map((b) => spotFromBox(b));
}

/** A spot added by hand where the person tapped. */
export function spotAt(cx: number, cy: number, radius: number): BlurSpot {
  return { id: nextId(), cx, cy, rx: radius, ry: radius * 1.15, auto: false };
}

/** Index of the spot under a point (the smallest one when they overlap), or -1. */
export function spotUnder(spots: BlurSpot[], x: number, y: number): number {
  let best = -1;
  let area = Infinity;
  spots.forEach((s, i) => {
    const d = ((x - s.cx) / s.rx) ** 2 + ((y - s.cy) / s.ry) ** 2;
    if (d <= 1 && s.rx * s.ry < area) {
      best = i;
      area = s.rx * s.ry;
    }
  });
  return best;
}

/* ── blurring ─────────────────────────────────────────────────────────────── */

function blurSpot(ctx: CanvasRenderingContext2D, src: HTMLCanvasElement, s: BlurSpot) {
  const x0 = Math.max(0, Math.floor(s.cx - s.rx));
  const y0 = Math.max(0, Math.floor(s.cy - s.ry));
  const x1 = Math.min(src.width, Math.ceil(s.cx + s.rx));
  const y1 = Math.min(src.height, Math.ceil(s.cy + s.ry));
  const w = x1 - x0;
  const h = y1 - y0;
  if (w < 2 || h < 2) return;

  // 1) a few colour cells across the face  2) smoothed back up to size
  const small = document.createElement("canvas");
  small.width = CELLS_ACROSS;
  small.height = Math.max(2, Math.round((CELLS_ACROSS * h) / w));
  const sctx = small.getContext("2d");
  const patch = document.createElement("canvas");
  patch.width = w;
  patch.height = h;
  const pctx = patch.getContext("2d");
  if (!sctx || !pctx) return;
  sctx.imageSmoothingEnabled = true;
  sctx.imageSmoothingQuality = "high";
  sctx.drawImage(src, x0, y0, w, h, 0, 0, small.width, small.height);
  pctx.imageSmoothingEnabled = true;
  pctx.imageSmoothingQuality = "high";
  pctx.drawImage(small, 0, 0, w, h);

  // 3) keep an ellipse with a soft rim (the face sits well inside the solid part)
  pctx.globalCompositeOperation = "destination-in";
  pctx.translate(s.cx - x0, s.cy - y0);
  pctx.scale(1, s.ry / s.rx);
  const g = pctx.createRadialGradient(0, 0, s.rx * 0.8, 0, 0, s.rx);
  g.addColorStop(0, "rgba(0,0,0,1)");
  g.addColorStop(1, "rgba(0,0,0,0)");
  pctx.fillStyle = g;
  pctx.beginPath();
  pctx.arc(0, 0, s.rx, 0, Math.PI * 2);
  pctx.fill();

  ctx.drawImage(patch, x0, y0);
}

/** Draws the photo with every spot blurred onto `target` (same size as `src`). */
export function paintBlurred(target: HTMLCanvasElement, src: HTMLCanvasElement, spots: BlurSpot[]) {
  if (target.width !== src.width) target.width = src.width;
  if (target.height !== src.height) target.height = src.height;
  const ctx = target.getContext("2d");
  if (!ctx) return;
  ctx.globalCompositeOperation = "source-over";
  ctx.drawImage(src, 0, 0);
  for (const s of spots) blurSpot(ctx, src, s);
}

/** The blurred photo as a JPEG ready to upload (no EXIF). */
export async function exportBlurred(src: HTMLCanvasElement, spots: BlurSpot[], quality = 0.86): Promise<Blob> {
  const out = document.createElement("canvas");
  paintBlurred(out, src, spots);
  const blob = await new Promise<Blob | null>((resolve) => out.toBlob(resolve, "image/jpeg", quality));
  if (blob) return blob;
  const data = out.toDataURL("image/jpeg", quality); // very old browsers without toBlob
  const bin = atob(data.split(",")[1] ?? "");
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: "image/jpeg" });
}
