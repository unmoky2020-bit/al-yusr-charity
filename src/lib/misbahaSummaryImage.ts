/**
 * Draws the shareable «حصيلة ذكري» card (1080×1350, the size Instagram/WhatsApp status show whole).
 * Pure canvas, no dependencies; Arabic is drawn right-to-left with the site's own font.
 */
export type SummaryLine = { label: string; count: number };

const GREEN = "#0b4429";
const LIME = "#a3e635";
const CREAM = "#f6faef";

function siteFont(): string {
  try {
    return getComputedStyle(document.body).fontFamily || "sans-serif";
  } catch {
    return "sans-serif";
  }
}

export async function drawMisbahaSummary(opts: {
  title: string;
  subtitle: string;
  lines: SummaryLine[];
  total: number;
  totalLabel: string;
  footer: string;
  rtl: boolean;
  locale: string;
}): Promise<Blob> {
  try {
    await document.fonts?.ready;
  } catch {
    /* draw with whatever is loaded */
  }
  const W = 1080;
  const H = 1350;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const g = c.getContext("2d");
  if (!g) throw new Error("canvas unavailable");
  const font = siteFont();
  const fmt = (n: number) => n.toLocaleString(opts.locale);
  g.direction = opts.rtl ? "rtl" : "ltr";

  // background + bead ring
  g.fillStyle = GREEN;
  g.fillRect(0, 0, W, H);
  const cx = W / 2;
  const cy = 330;
  for (let i = 0; i < 33; i++) {
    const a = (-90 + (i * 360) / 33) * (Math.PI / 180);
    g.beginPath();
    g.arc(cx + 210 * Math.cos(a), cy + 210 * Math.sin(a), 15, 0, Math.PI * 2);
    g.fillStyle = i % 11 === 0 ? LIME : "rgba(163,230,53,0.55)";
    g.fill();
  }
  g.textAlign = "center";
  g.fillStyle = "#ffffff";
  g.font = `900 120px ${font}`;
  g.fillText(fmt(opts.total), cx, cy + 40);
  g.font = `700 36px ${font}`;
  g.fillStyle = "rgba(255,255,255,0.75)";
  g.fillText(opts.totalLabel, cx, cy + 95);

  g.fillStyle = "#ffffff";
  g.font = `900 64px ${font}`;
  g.fillText(opts.title, cx, 650);
  g.font = `700 34px ${font}`;
  g.fillStyle = "rgba(255,255,255,0.7)";
  g.fillText(opts.subtitle, cx, 705);

  // the counted lines on a light card
  const rows = opts.lines.filter((l) => l.count > 0);
  const cardX = 90;
  const cardW = W - 180;
  const rowH = 104;
  const cardY = 760;
  const cardH = Math.max(1, rows.length) * rowH + 40;
  g.fillStyle = CREAM;
  roundRect(g, cardX, cardY, cardW, cardH, 36);
  g.fill();
  rows.forEach((l, i) => {
    const y = cardY + 20 + i * rowH + rowH / 2;
    if (i > 0) {
      g.strokeStyle = "rgba(11,68,41,0.12)";
      g.lineWidth = 2;
      g.beginPath();
      g.moveTo(cardX + 40, y - rowH / 2);
      g.lineTo(cardX + cardW - 40, y - rowH / 2);
      g.stroke();
    }
    g.textBaseline = "middle";
    g.fillStyle = GREEN;
    g.font = `900 58px ${font}`;
    g.textAlign = opts.rtl ? "right" : "left";
    g.fillText(fmt(l.count), opts.rtl ? cardX + cardW - 50 : cardX + 50, y);
    g.font = `800 40px ${font}`;
    g.textAlign = opts.rtl ? "left" : "right";
    g.fillText(l.label, opts.rtl ? cardX + 50 : cardX + cardW - 50, y);
  });
  g.textBaseline = "alphabetic";

  g.textAlign = "center";
  g.fillStyle = LIME;
  g.font = `800 34px ${font}`;
  g.fillText(opts.footer, cx, H - 70);

  return await new Promise<Blob>((resolve, reject) =>
    c.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob failed"))), "image/png"),
  );
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
