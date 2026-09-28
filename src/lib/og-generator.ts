/**
 * Browser-side branded OG image generator (1200x630).
 * Uses Canvas — no AI / network. Returns a data URL ready for download
 * or upload. Style mirrors Al-Yusr brand: deep primary background with
 * gold accent, large headline + axis chip + URL footer.
 */

export type OgInput = {
  title: string;
  category: string;
  url: string;
};

const wrap = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number, lineHeight: number, x: number, y: number, maxLines = 4) => {
  const words = text.split(/\s+/);
  let line = "";
  let lines = 0;
  for (let i = 0; i < words.length; i++) {
    const test = line ? `${line} ${words[i]}` : words[i];
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, y + lines * lineHeight);
      line = words[i];
      lines++;
      if (lines >= maxLines - 1) {
        // truncate remainder
        let remainder = words.slice(i).join(" ");
        while (ctx.measureText(remainder + "…").width > maxWidth && remainder.length) {
          remainder = remainder.slice(0, -1);
        }
        ctx.fillText(remainder + "…", x, y + lines * lineHeight);
        return;
      }
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, x, y + lines * lineHeight);
};

export async function generateOg({ title, category, url }: OgInput): Promise<string> {
  const W = 1200;
  const H = 630;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  // Background — Al-Yusr deep green gradient
  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, "#0e3b2e");
  grad.addColorStop(1, "#1f6b53");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Decorative gold ribbon (right edge)
  ctx.fillStyle = "#d4a857";
  ctx.fillRect(W - 12, 0, 12, H);

  // Inner card
  ctx.fillStyle = "rgba(255,255,255,0.06)";
  ctx.fillRect(60, 60, W - 132, H - 120);
  ctx.strokeStyle = "rgba(212,168,87,0.6)";
  ctx.lineWidth = 2;
  ctx.strokeRect(60, 60, W - 132, H - 120);

  // Brand mark
  ctx.fillStyle = "#d4a857";
  ctx.font = "bold 28px system-ui, -apple-system, 'Segoe UI', Tahoma, sans-serif";
  ctx.textAlign = "right";
  ctx.direction = "rtl";
  ctx.fillText("مؤسسة اليسر الخيرية — المنصورة", W - 100, 120);

  // Category chip
  ctx.fillStyle = "#d4a857";
  const chipText = category;
  ctx.font = "bold 22px system-ui, -apple-system, 'Segoe UI', Tahoma, sans-serif";
  const chipW = ctx.measureText(chipText).width + 40;
  ctx.fillRect(W - 100 - chipW, 150, chipW, 44);
  ctx.fillStyle = "#0e3b2e";
  ctx.fillText(chipText, W - 120, 182);

  // Title
  ctx.fillStyle = "#ffffff";
  ctx.font = "900 56px system-ui, -apple-system, 'Segoe UI', Tahoma, sans-serif";
  wrap(ctx, title, W - 200, 70, W - 100, 280, 4);

  // URL footer
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.font = "bold 22px system-ui, -apple-system, 'Segoe UI', Tahoma, sans-serif";
  ctx.textAlign = "left";
  ctx.direction = "ltr";
  ctx.fillText(url, 100, H - 90);

  // Tagline
  ctx.fillStyle = "#d4a857";
  ctx.font = "bold 20px system-ui, -apple-system, 'Segoe UI', Tahoma, sans-serif";
  ctx.textAlign = "right";
  ctx.direction = "rtl";
  ctx.fillText("الرحمة والأمل · بنك الطعام", W - 100, H - 90);

  return canvas.toDataURL("image/jpeg", 0.9);
}

export function downloadDataUrl(dataUrl: string, filename: string) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}