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

  // kicker
  g.fillStyle = LIME;
  g.font = `800 38px ${font}`;
  g.fillText(opts.kicker, cx, 150);

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

function roundRect(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}
