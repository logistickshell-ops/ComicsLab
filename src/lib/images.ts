import { uid, type Panel } from "./types";

const MAX_SIDE = 1920;

/** Load an image File → downscaled dataURL Panel (fast + canvas-safe). */
export async function fileToPanel(file: File): Promise<Panel> {
  const url = URL.createObjectURL(file);
  try {
    const img = await loadImage(url);
    const scale = Math.min(1, MAX_SIDE / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.round(img.naturalWidth * scale);
    const h = Math.round(img.naturalHeight * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(img, 0, 0, w, h);
    const type = file.type === "image/png" ? "image/png" : "image/jpeg";
    return {
      id: uid(),
      src: canvas.toDataURL(type, 0.92),
      iw: w,
      ih: h,
      zoom: 1,
      tx: 0.5,
      ty: 0.5,
      filter: "comic",
    };
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function srcToPanel(src: string, filter = "none"): Promise<Panel> {
  const img = await loadImage(src);
  return {
    id: uid(),
    src,
    iw: img.naturalWidth,
    ih: img.naturalHeight,
    zoom: 1,
    tx: 0.5,
    ty: 0.5,
    filter,
  };
}

const imgCache = new Map<string, HTMLImageElement>();
export function loadImage(src: string): Promise<HTMLImageElement> {
  const hit = imgCache.get(src);
  if (hit && hit.complete) return Promise.resolve(hit);
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      imgCache.set(src, img);
      resolve(img);
    };
    img.onerror = () => reject(new Error("image load failed"));
    img.src = src;
  });
}
