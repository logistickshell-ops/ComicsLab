import {
  BUBBLE_METRICS,
  bubblePoints,
  canvasFont,
  coverRect,
  isDark,
  thoughtTrail,
  wrapText,
  type Pt,
} from "./geometry";
import { loadImage } from "./images";
import { filterCss, type Bubble, type Panel, type Rect } from "./types";

export const PAGE_PAD = 0.03; // of width
export const PAGE_GAP = 0.013; // of width
export const TITLE_H = 0.115; // of height

export interface RenderOpts {
  panels: Panel[];
  bubbles: Bubble[];
  rects: Rect[];
  ratio: number;
  bg: string;
  title: string;
  showTitle: boolean;
  width: number;
}

async function ensureFonts() {
  try {
    await Promise.all([
      document.fonts.load('40px "Russo One"'),
      document.fonts.load("40px Neucha"),
      document.fonts.load("700 40px Caveat"),
    ]);
    await document.fonts.ready;
  } catch {
    /* fonts may already be loaded */
  }
}

function pathFromPoints(ctx: CanvasRenderingContext2D, pts: Pt[], smooth: boolean) {
  ctx.beginPath();
  if (!smooth || pts.length < 4) {
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.closePath();
    return;
  }
  const mid = (a: Pt, b: Pt) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
  const start = mid(pts[pts.length - 1], pts[0]);
  ctx.moveTo(start.x, start.y);
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i];
    const m = mid(p, pts[(i + 1) % pts.length]);
    ctx.quadraticCurveTo(p.x, p.y, m.x, m.y);
  }
  ctx.closePath();
}

export async function renderComic(opts: RenderOpts): Promise<Blob> {
  const { panels, bubbles, rects, ratio, bg, title, width } = opts;
  const showTitle = opts.showTitle && title.trim().length > 0;
  await ensureFonts();

  const W = width;
  const H = Math.round(W / ratio);
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  const ink = "#141310";
  const dark = isDark(bg);

  // --- page background + halftone ---
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  const dotStep = Math.max(11, W * 0.0135);
  ctx.fillStyle = dark ? "rgba(255,255,255,0.08)" : "rgba(20,19,16,0.055)";
  for (let y = dotStep / 2; y < H; y += dotStep) {
    for (let x = dotStep / 2; x < W; x += dotStep) {
      ctx.beginPath();
      ctx.arc(x, y, dotStep * 0.11, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const pad = W * PAGE_PAD;
  const gap = W * PAGE_GAP;
  const titleH = showTitle ? H * TITLE_H : 0;
  const cx0 = pad;
  const cy0 = pad + titleH;
  const cw = W - pad * 2;
  const ch = H - pad * 2 - titleH;

  // --- title ---
  if (showTitle) {
    const text = title.trim().toUpperCase();
    let fs = Math.min(W * 0.054, titleH * 0.5);
    ctx.font = `${fs}px "Russo One", sans-serif`;
    const maxTw = W - pad * 2 - W * 0.02;
    const tw = ctx.measureText(text).width;
    if (tw > maxTw) {
      fs = fs * (maxTw / tw);
      ctx.font = `${fs}px "Russo One", sans-serif`;
    }
    ctx.save();
    ctx.translate(W / 2, pad + titleH / 2);
    ctx.rotate((-1.3 * Math.PI) / 180);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    if (!dark) {
      ctx.fillStyle = "#FF3B30";
      ctx.fillText(text, W * 0.005, W * 0.005);
    }
    ctx.fillStyle = dark ? "#FFFFFF" : ink;
    ctx.fillText(text, 0, 0);
    ctx.restore();
  }

  const borderW = Math.max(3, W * 0.0042);
  const images = await Promise.all(panels.map((p) => loadImage(p.src)));

  // --- panels ---
  const panelRects: { x: number; y: number; w: number; h: number }[] = [];
  panels.forEach((panel, i) => {
    const r = rects[i];
    if (!r) return;
    const px = cx0 + r.x * cw + gap / 2;
    const py = cy0 + r.y * ch + gap / 2;
    const pw = r.w * cw - gap;
    const ph = r.h * ch - gap;
    panelRects[i] = { x: px, y: py, w: pw, h: ph };

    const img = images[i];
    const { dx, dy, dw, dh } = coverRect(pw, ph, panel.iw, panel.ih, panel.zoom, panel.tx, panel.ty);

    ctx.save();
    ctx.beginPath();
    ctx.rect(px, py, pw, ph);
    ctx.clip();
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(px, py, pw, ph);
    const f = filterCss(panel.filter);
    try {
      if (f !== "none") ctx.filter = f;
    } catch {
      /* older safari */
    }
    ctx.drawImage(img, px + dx, py + dy, dw, dh);
    try {
      ctx.filter = "none";
    } catch {
      /* noop */
    }
    ctx.restore();

    ctx.strokeStyle = ink;
    ctx.lineWidth = borderW;
    ctx.strokeRect(px + borderW / 2, py + borderW / 2, pw - borderW, ph - borderW);
  });

  // --- bubbles ---
  const strokeW = Math.max(2.4, W * 0.0038);
  const shadowOff = W * 0.005;
  for (const b of bubbles) {
    const pi = panels.findIndex((p) => p.id === b.panelId);
    if (pi < 0 || !panelRects[pi]) continue;
    const pr = panelRects[pi];
    const bw = (b.w / 100) * pr.w;
    const fontPx = (b.fontSize / 100) * W;
    ctx.font = canvasFont(b.font, fontPx);
    const metrics = BUBBLE_METRICS[b.type];
    const rawText = b.font === "russo" ? b.text.toUpperCase() : b.text;
    const lines = wrapText(rawText || " ", bw * metrics.textW, (s) => ctx.measureText(s).width);
    const lineH = fontPx * (b.font === "caveat" ? 1.02 : 1.16);
    const textH = lines.length * lineH;
    const bh = textH + bw * metrics.padY * 2;
    const cx = pr.x + (b.x / 100) * pr.w;
    const cy = pr.y + (b.y / 100) * pr.h;
    const x0 = cx - bw / 2;
    const y0 = cy - bh / 2;
    const tailLen = Math.max(fontPx * 0.95, bh * 0.34);
    const pts = bubblePoints(b.type, bw, bh, b.tail, tailLen).map((p) => ({
      x: p.x + x0,
      y: p.y + y0,
    }));
    const trail = thoughtTrail(bw, bh, b.type === "thought" ? b.tail : "none", fontPx);

    ctx.save();
    ctx.beginPath();
    ctx.rect(pr.x, pr.y, pr.w, pr.h);
    ctx.clip();

    // hard offset shadow
    ctx.save();
    ctx.translate(shadowOff, shadowOff);
    pathFromPoints(ctx, pts, b.type === "thought");
    ctx.fillStyle = "rgba(20,19,16,0.9)";
    ctx.fill();
    ctx.restore();

    // body
    pathFromPoints(ctx, pts, b.type === "thought");
    ctx.fillStyle = b.bg;
    ctx.fill();
    ctx.strokeStyle = ink;
    ctx.lineWidth = strokeW;
    ctx.lineJoin = "round";
    ctx.stroke();

    // thought trail circles
    for (const c of trail) {
      ctx.beginPath();
      ctx.arc(c.x + x0, c.y + y0, Math.max(2, c.r), 0, Math.PI * 2);
      ctx.fillStyle = b.bg;
      ctx.fill();
      ctx.strokeStyle = ink;
      ctx.lineWidth = strokeW * 0.8;
      ctx.stroke();
    }

    // text
    ctx.font = canvasFont(b.font, fontPx);
    ctx.fillStyle = b.color;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const ty0 = cy - textH / 2 + lineH / 2;
    lines.forEach((line, li) => {
      ctx.fillText(line, cx, ty0 + li * lineH);
    });

    ctx.restore();
  }

  // --- outer frame ---
  ctx.strokeStyle = dark ? "#FFFFFF" : ink;
  ctx.lineWidth = borderW * 1.5;
  ctx.strokeRect(borderW * 0.75, borderW * 0.75, W - borderW * 1.5, H - borderW * 1.5);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("render failed"))),
      "image/png"
    );
  });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export async function shareBlob(blob: Blob, filename: string): Promise<boolean> {
  try {
    const file = new File([blob], filename, { type: "image/png" });
    const nav = navigator as Navigator & {
      canShare?: (data: { files: File[] }) => boolean;
      share?: (data: { files?: File[]; title?: string }) => Promise<void>;
    };
    if (nav.canShare && nav.canShare({ files: [file] }) && nav.share) {
      await nav.share({ files: [file], title: "Мой комикс" });
      return true;
    }
  } catch {
    /* user cancelled or unsupported */
  }
  return false;
}
