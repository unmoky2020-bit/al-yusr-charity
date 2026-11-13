/**
 * 1080×1920 story card for a shared misbaha (WhatsApp status, Instagram / Facebook stories):
 * the title, a short dua, the shared count, and a QR code + link so viewers can join.
 * The QR library is loaded only when an image is made.
 */
const GREEN = "#06301c";
const GREEN2 = "#0b4429";
const LIME = "#a3e635";

function siteFont(): string {
  try {
    return getComputedStyle(document.body).fontFamily || "sans-serif";
  } catch {
    return "sans-serif";
  }
}

/** Wraps text to lines that fit `max` px; Arabic-safe (splits on spaces only). */
function wrap(g: CanvasRenderingContext2D, text: string, max: number, maxLines: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const t = line ? `${line} ${w}` : w;
    if (g.measureText(t).width <= max || !line) line = t;
    else {
      lines.push(line);
      line = w;
      if (lines.length === maxLines) break;
    }
  }
  if (lines.length < maxLines && line) lines.push(line);
  if (lines.length === maxLines && words.join(" ") !== lines.join(" ")) lines[maxLines - 1] = `${lines[maxLines - 1].replace(/[،,.]?$/, "")}…`;
  return lines;
}

export async function drawMisbahaStory(opts: {
  kicker: string;
  title: string;
  tagline: string;
  total: number;
  totalLabel: string;
  goalLine?: string;
  /** 0..1 share of the goal reached: lights that share of the beads. */
  progress?: number;
  /** shown instead of «0» before anyone has counted */
  zeroText?: string;
  cta: string;
  url: string;
  rtl: boolean;
  locale: string;
  /** «healing»: a heart with a medical cross above the title (sebha for someone sick). */
  emblem?: "healing";
}): Promise<Blob> {
  try {
    await document.fonts?.ready;
  } catch {
    /* draw with what is loaded */
  }
  const W = 1080;
  const H = 1920;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const g = c.getContext("2d");
  if (!g) throw new Error("canvas unavailable");
  const font = siteFont();
  g.direction = opts.rtl ? "rtl" : "ltr";
  g.textAlign = "center";
  const cx = W / 2;

  // background
  const bg = g.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, GREEN2);
  bg.addColorStop(1, GREEN);
  g.fillStyle = bg;
  g.fillRect(0, 0, W, H);
  // soft glow behind the ring
  const cy = 470;
  const glow = g.createRadialGradient(cx, cy, 40, cx, cy, 560);
  glow.addColorStop(0, "rgba(163,230,53,0.18)");
  glow.addColorStop(1, "rgba(163,230,53,0)");
  g.fillStyle = glow;
  g.fillRect(0, 0, W, 1100);

  // kicker (with the healing emblem above it for a sick person's sebha)
  if (opts.emblem === "healing") drawHealingHeart(g, cx, 92, 1);
  g.fillStyle = LIME;
  g.font = `800 38px ${font}`;
  g.fillText(opts.kicker, cx, opts.emblem ? 196 : 150);

  // bead ring: lit beads show the share of the goal reached
  const lit = Math.round(Math.max(0, Math.min(1, opts.progress ?? 0)) * 33);
  for (let i = 0; i < 33; i++) {
    const a = (-90 + (i * 360) / 33) * (Math.PI / 180);
    g.beginPath();
    g.arc(cx + 215 * Math.cos(a), cy + 215 * Math.sin(a), i % 11 === 0 ? 17 : 14, 0, Math.PI * 2);
    g.fillStyle = i < lit || i % 11 === 0 ? LIME : "rgba(163,230,53,0.38)";
    g.fill();
  }
  g.fillStyle = "#fff";
  if (opts.total > 0 || !opts.zeroText) {
    g.font = `900 ${opts.total >= 1_000_000 ? 100 : 124}px ${font}`;
    g.fillText(opts.total.toLocaleString(opts.locale), cx, cy + 30);
    g.font = `700 36px ${font}`;
    g.fillStyle = "rgba(255,255,255,0.75)";
    g.fillText(opts.totalLabel, cx, cy + 88);
  } else {
    g.font = `900 56px ${font}`;
    wrap(g, opts.zeroText, 330, 2).forEach((l, i, arr) => g.fillText(l, cx, cy + 20 - (arr.length - 1) * 34 + i * 68));
  }

  // title + tagline + goal (flowing, never under the QR card)
  let y = 800;
  g.fillStyle = "#fff";
  g.font = `900 74px ${font}`;
  const titleLines = wrap(g, opts.title, W - 150, 2);
  titleLines.forEach((l, i) => g.fillText(l, cx, y + i * 94));
  y += (titleLines.length - 1) * 94 + 86;
  g.font = `700 40px ${font}`;
  g.fillStyle = "rgba(255,255,255,0.85)";
  const tagLines = wrap(g, opts.tagline, W - 200, 2);
  tagLines.forEach((l, i) => g.fillText(l, cx, y + i * 58));
  y += (tagLines.length - 1) * 58 + 84;
  if (opts.goalLine) {
    g.font = `800 32px ${font}`;
    const w = Math.min(W - 160, g.measureText(opts.goalLine).width + 64);
    g.strokeStyle = "rgba(163,230,53,0.7)";
    g.lineWidth = 2.5;
    roundRect(g, cx - w / 2, y - 44, w, 64, 32);
    g.stroke();
    g.fillStyle = LIME;
    g.fillText(opts.goalLine, cx, y);
  }

  // QR card, pinned to the bottom
  const QR = 300;
  const cardW = 520;
  const cardH = 490;
  const cardX = cx - cardW / 2;
  const cardY = 1310;
  g.fillStyle = "#fff";
  roundRect(g, cardX, cardY, cardW, cardH, 44);
  g.fill();
  try {
    const QRCode = (await import("qrcode")).default;
    const qr = document.createElement("canvas");
    await QRCode.toCanvas(qr, opts.url, { width: QR, margin: 0, color: { dark: GREEN, light: "#ffffff" }, errorCorrectionLevel: "M" });
    g.drawImage(qr, cx - QR / 2, cardY + 42, QR, QR);
  } catch {
    /* no QR: the link text below still works */
  }
  g.fillStyle = GREEN;
  g.font = `900 40px ${font}`;
  g.fillText(opts.cta, cx, cardY + 42 + QR + 62);
  g.font = `700 27px ${font}`;
  g.fillStyle = "rgba(6,48,28,0.65)";
  g.direction = "ltr";
  g.fillText(opts.url.replace(/^https?:\/\//, "").replace(/\?.*$/, ""), cx, cardY + 42 + QR + 104);
  g.direction = opts.rtl ? "rtl" : "ltr";

  g.fillStyle = "rgba(255,255,255,0.7)";
  g.font = `700 30px ${font}`;
  g.fillText(opts.rtl ? "مؤسسة اليسر الخيرية · elyusr.org" : "Al-Yusr Charity · elyusr.org", cx, H - 56);

  return await new Promise<Blob>((resolve, reject) => c.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob failed"))), "image/png"));
}

/** A rose heart with a white medical cross; `cy` is the heart's middle, ~110 px wide at scale 1. */
export function drawHealingHeart(g: CanvasRenderingContext2D, cx: number, cy: number, scale: number) {
  g.save();
  g.translate(cx, cy);
  g.scale(scale * 0.75, scale * 0.75);
  g.translate(-100, -100);
  const grad = g.createLinearGradient(0, 36, 0, 168);
  grad.addColorStop(0, "#fb7185");
  grad.addColorStop(1, "#e11d48");
  g.shadowColor = "rgba(0,0,0,0.35)";
  g.shadowBlur = 16;
  g.shadowOffsetY = 6;
  g.fillStyle = grad;
  g.beginPath();
  g.moveTo(100, 168);
  g.bezierCurveTo(58, 138, 26, 112, 26, 78);
  g.bezierCurveTo(26, 54, 44, 36, 67, 36);
  g.bezierCurveTo(82, 36, 94, 44, 100, 56);
  g.bezierCurveTo(106, 44, 118, 36, 133, 36);
  g.bezierCurveTo(156, 36, 174, 54, 174, 78);
  g.bezierCurveTo(174, 112, 142, 138, 100, 168);
  g.closePath();
  g.fill();
  g.shadowColor = "transparent";
  g.fillStyle = "#fff";
  roundRect(g, 88, 62, 24, 70, 5);
  g.fill();
  roundRect(g, 65, 85, 70, 24, 5);
  g.fill();
  g.restore();
}

function roundRect(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}
