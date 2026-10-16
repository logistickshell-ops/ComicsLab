import type { BubbleType, TailDir } from "./types";

export interface Pt {
  x: number;
  y: number;
}

/** Per-type text metrics so DOM preview and canvas export wrap text the same way. */
export const BUBBLE_METRICS: Record<
  BubbleType,
  { textW: number; padY: number; padX: string; padYcss: string }
> = {
  // textW — fraction of bubble width available to text; padY — same fraction for top+bottom padding (of width)
  speech: { textW: 0.72, padY: 0.11, padX: "14%", padYcss: "11%" },
  thought: { textW: 0.68, padY: 0.13, padX: "16%", padYcss: "13%" },
  shout: { textW: 0.62, padY: 0.15, padX: "19%", padYcss: "15%" },
  caption: { textW: 0.88, padY: 0.05, padX: "6%", padYcss: "5%" },
};

export const FONT_SCALE: Record<string, number> = {
  neucha: 1,
  russo: 0.92,
  caveat: 1.22,
};

export const FONT_FAMILY: Record<string, string> = {
  neucha: '"Neucha", cursive',
  russo: '"Russo One", sans-serif',
  caveat: '"Caveat", cursive',
};

export const canvasFont = (font: string, px: number) => {
  const p = Math.round(px * (FONT_SCALE[font] ?? 1));
  if (font === "caveat") return `700 ${p}px Caveat, cursive`;
  if (font === "russo") return `${p}px "Russo One", sans-serif`;
  return `${p}px Neucha, cursive`;
};

export const TAIL_ANGLE: Record<Exclude<TailDir, "none">, number> = {
  right: 0,
  "bottom-right": 50,
  bottom: 90,
  "bottom-left": 130,
  left: 180,
  "top-left": 230,
  top: 270,
  "top-right": 315,
};

const rad = (deg: number) => (deg * Math.PI) / 180;

/**
 * Cover-fit math: returns drawn image rect inside a panel of pw×ph,
 * given image size, zoom and pan (tx,ty in 0..1).
 */
export function coverRect(
  pw: number,
  ph: number,
  iw: number,
  ih: number,
  zoom: number,
  tx: number,
  ty: number
) {
  const s = Math.max(pw / iw, ph / ih) * zoom;
  const dw = iw * s;
  const dh = ih * s;
  return {
    dw,
    dh,
    dx: (pw - dw) * tx,
    dy: (ph - dh) * ty,
  };
}

/** Points of an ellipse with an optional speech tail spike, single outline. */
export function speechPoints(
  w: number,
  h: number,
  tail: TailDir,
  tailLen: number
): Pt[] {
  const cx = w / 2;
  const cy = h / 2;
  const rx = Math.max(4, w / 2 - 2);
  const ry = Math.max(4, h / 2 - 2);
  const pts: Pt[] = [];
  const step = 5;
  const tailA = tail !== "none" ? TAIL_ANGLE[tail] : null;
  const spread = 15; // half base width in degrees

  for (let d = 0; d < 360; d += step) {
    const a = rad(d);
    pts.push({ x: cx + rx * Math.cos(a), y: cy + ry * Math.sin(a) });
    if (tailA !== null) {
      const next = d + step;
      const crosses =
        (d < tailA && next >= tailA) || (tailA === 0 && d === 0);
      if (crosses) {
        const a1 = rad(tailA - spread);
        const a2 = rad(tailA + spread);
        const am = rad(tailA);
        const ex = rx * Math.cos(am);
        const ey = ry * Math.sin(am);
        const el = Math.hypot(ex, ey) || 1;
        const tip = {
          x: cx + (ex / el) * (el + tailLen),
          y: cy + (ey / el) * (el + tailLen),
        };
        // rebuild: push base1, tip, base2 replacing arc segment roughly
        pts.push({ x: cx + rx * Math.cos(a1), y: cy + ry * Math.sin(a1) });
        pts.push(tip);
        pts.push({ x: cx + rx * Math.cos(a2), y: cy + ry * Math.sin(a2) });
      }
    }
  }
  return pts;
}

/** Scalloped cloud outline for thought bubbles. */
export function thoughtPoints(w: number, h: number): Pt[] {
  const cx = w / 2;
  const cy = h / 2;
  const rx = Math.max(6, w / 2 - 3);
  const ry = Math.max(6, h / 2 - 3);
  const bumps = Math.max(9, Math.round(w / 26));
  const pts: Pt[] = [];
  const steps = bumps * 2;
  for (let i = 0; i < steps; i++) {
    const d = (i / steps) * 360;
    const a = rad(d);
    const k = i % 2 === 0 ? 1 : 0.9;
    pts.push({ x: cx + rx * k * Math.cos(a), y: cy + ry * k * Math.sin(a) });
  }
  return pts;
}

/** Thought trail: two small circles leading away from the bubble. */
export function thoughtTrail(
  w: number,
  h: number,
  tail: TailDir,
  unit: number
): { x: number; y: number; r: number }[] {
  if (tail === "none") return [];
  const cx = w / 2;
  const cy = h / 2;
  const rx = w / 2;
  const ry = h / 2;
  const a = rad(TAIL_ANGLE[tail]);
  const ex = rx * Math.cos(a);
  const ey = ry * Math.sin(a);
  const el = Math.hypot(ex, ey) || 1;
  const ux = ex / el;
  const uy = ey / el;
  return [
    { x: cx + ux * (el + unit * 0.55), y: cy + uy * (el + unit * 0.55), r: unit * 0.22 },
    { x: cx + ux * (el + unit * 1.15), y: cy + uy * (el + unit * 1.15), r: unit * 0.13 },
  ];
}

/** Starburst outline for shout bubbles. */
export function shoutPoints(w: number, h: number): Pt[] {
  const cx = w / 2;
  const cy = h / 2;
  const rx = Math.max(6, w / 2 - 2);
  const ry = Math.max(6, h / 2 - 2);
  const spikes = 14;
  const jitter = [1, 0.96, 1.03, 0.94, 1.05, 0.98, 1.02, 0.95, 1.04, 0.97, 1.01, 0.93, 1, 0.99];
  const pts: Pt[] = [];
  for (let i = 0; i < spikes * 2; i++) {
    const d = (i / (spikes * 2)) * 360 - 90;
    const a = rad(d);
    const outer = i % 2 === 0;
    const k = outer ? jitter[i / 2] : 0.8;
    pts.push({ x: cx + rx * k * Math.cos(a), y: cy + ry * k * Math.sin(a) });
  }
  return pts;
}

export function bubblePoints(
  type: BubbleType,
  w: number,
  h: number,
  tail: TailDir,
  tailLen: number
): Pt[] {
  switch (type) {
    case "speech":
      return speechPoints(w, h, tail, tailLen);
    case "thought":
      return thoughtPoints(w, h);
    case "shout":
      return shoutPoints(w, h);
    case "caption":
      return [
        { x: 1.5, y: 1.5 },
        { x: w - 1.5, y: 1.5 },
        { x: w - 1.5, y: h - 1.5 },
        { x: 1.5, y: h - 1.5 },
      ];
  }
}

/** Smooth closed SVG path through points using quadratic midpoints (for the cloud). */
export function smoothClosedPath(pts: Pt[]): string {
  if (pts.length < 3) return "";
  const mid = (a: Pt, b: Pt) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
  let d = "";
  const start = mid(pts[pts.length - 1], pts[0]);
  d += `M ${start.x.toFixed(1)} ${start.y.toFixed(1)} `;
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i];
    const m = mid(p, pts[(i + 1) % pts.length]);
    d += `Q ${p.x.toFixed(1)} ${p.y.toFixed(1)} ${m.x.toFixed(1)} ${m.y.toFixed(1)} `;
  }
  return d + "Z";
}

export const polygonPoints = (pts: Pt[]) =>
  pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");

/** Word-wrap text for canvas using a measurer fn. Respects manual \n. */
export function wrapText(
  text: string,
  maxW: number,
  measure: (s: string) => number
): string[] {
  const lines: string[] = [];
  for (const rawLine of text.split("\n")) {
    const words = rawLine.split(/\s+/).filter(Boolean);
    if (words.length === 0) {
      lines.push("");
      continue;
    }
    let cur = words[0];
    for (let i = 1; i < words.length; i++) {
      const test = cur + " " + words[i];
      if (measure(test) <= maxW) {
        cur = test;
      } else {
        lines.push(cur);
        cur = words[i];
      }
    }
    lines.push(cur);
  }
  return lines.length ? lines : [""];
}

export const isDark = (hex: string) => {
  const c = hex.replace("#", "");
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  return 0.299 * r + 0.587 * g + 0.114 * b < 110;
};
