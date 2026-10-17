export type BubbleType = "speech" | "thought" | "caption" | "shout";
export type BubbleFont = "neucha" | "russo" | "caveat";
export type TailDir =
  | "none"
  | "bottom-left"
  | "bottom"
  | "bottom-right"
  | "left"
  | "right"
  | "top-left"
  | "top"
  | "top-right";

export interface Panel {
  id: string;
  src: string; // dataURL
  iw: number; // natural width
  ih: number; // natural height
  zoom: number; // 1 = cover, up to 3
  tx: number; // 0..1 pan (0 = left aligned, 1 = right aligned)
  ty: number; // 0..1 pan
  filter: string; // css filter id
}

export interface Bubble {
  id: string;
  panelId: string;
  type: BubbleType;
  text: string;
  /** center position inside panel, % */
  x: number;
  y: number;
  /** width, % of panel width */
  w: number;
  /** font size, % of page width */
  fontSize: number;
  font: BubbleFont;
  bg: string;
  color: string;
  tail: TailDir;
}

/** normalized panel rectangle inside page content area (0..1) */
export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface LayoutDef {
  id: string;
  name: string;
  rects: Rect[];
}

export interface FormatDef {
  id: string;
  name: string;
  ratio: number; // width / height
  label: string;
}

export const FORMATS: FormatDef[] = [
  { id: "4:5", name: "Портрет", ratio: 4 / 5, label: "4:5" },
  { id: "1:1", name: "Квадрат", ratio: 1, label: "1:1" },
  { id: "9:16", name: "Сторис", ratio: 9 / 16, label: "9:16" },
  { id: "16:9", name: "Альбом", ratio: 16 / 9, label: "16:9" },
  { id: "3:4", name: "Классика", ratio: 3 / 4, label: "3:4" },
];

const rows = (n: number): Rect[] =>
  Array.from({ length: n }, (_, i) => ({ x: 0, y: i / n, w: 1, h: 1 / n }));
const cols = (n: number): Rect[] =>
  Array.from({ length: n }, (_, i) => ({ x: i / n, y: 0, w: 1 / n, h: 1 }));

export const LAYOUTS: Record<number, LayoutDef[]> = {
  1: [{ id: "full", name: "На весь лист", rects: [{ x: 0, y: 0, w: 1, h: 1 }] }],
  2: [
    { id: "v", name: "Сверху вниз", rects: rows(2) },
    { id: "h", name: "Рядом", rects: cols(2) },
    {
      id: "big-top",
      name: "Акцент сверху",
      rects: [
        { x: 0, y: 0, w: 1, h: 0.62 },
        { x: 0, y: 0.62, w: 1, h: 0.38 },
      ],
    },
    {
      id: "big-bottom",
      name: "Акцент снизу",
      rects: [
        { x: 0, y: 0, w: 1, h: 0.38 },
        { x: 0, y: 0.38, w: 1, h: 0.62 },
      ],
    },
  ],
  3: [
    { id: "rows", name: "Три полосы", rects: rows(3) },
    {
      id: "top2",
      name: "Герой + два кадра",
      rects: [
        { x: 0, y: 0, w: 1, h: 0.54 },
        { x: 0, y: 0.54, w: 0.5, h: 0.46 },
        { x: 0.5, y: 0.54, w: 0.5, h: 0.46 },
      ],
    },
    {
      id: "bottom2",
      name: "Два кадра + финал",
      rects: [
        { x: 0, y: 0, w: 0.5, h: 0.46 },
        { x: 0.5, y: 0, w: 0.5, h: 0.46 },
        { x: 0, y: 0.46, w: 1, h: 0.54 },
      ],
    },
    { id: "cols", name: "Три столбца", rects: cols(3) },
  ],
  4: [
    {
      id: "grid",
      name: "Сетка 2×2",
      rects: [
        { x: 0, y: 0, w: 0.5, h: 0.5 },
        { x: 0.5, y: 0, w: 0.5, h: 0.5 },
        { x: 0, y: 0.5, w: 0.5, h: 0.5 },
        { x: 0.5, y: 0.5, w: 0.5, h: 0.5 },
      ],
    },
    {
      id: "hero",
      name: "Герой + три",
      rects: [
        { x: 0, y: 0, w: 1, h: 0.46 },
        { x: 0, y: 0.46, w: 1 / 3, h: 0.54 },
        { x: 1 / 3, y: 0.46, w: 1 / 3, h: 0.54 },
        { x: 2 / 3, y: 0.46, w: 1 / 3, h: 0.54 },
      ],
    },
    {
      id: "sandwich",
      name: "Полоса — пара — полоса",
      rects: [
        { x: 0, y: 0, w: 1, h: 0.3 },
        { x: 0, y: 0.3, w: 0.5, h: 0.4 },
        { x: 0.5, y: 0.3, w: 0.5, h: 0.4 },
        { x: 0, y: 0.7, w: 1, h: 0.3 },
      ],
    },
    { id: "rows", name: "Четыре полосы", rects: rows(4) },
    { id: "cols", name: "Четыре столбца", rects: cols(4) },
  ],
  5: [
    {
      id: "hero-top",
      name: "Герой + 4 кадра",
      rects: [
        { x: 0, y: 0, w: 1, h: 0.44 },
        { x: 0, y: 0.44, w: 0.5, h: 0.28 },
        { x: 0.5, y: 0.44, w: 0.5, h: 0.28 },
        { x: 0, y: 0.72, w: 0.5, h: 0.28 },
        { x: 0.5, y: 0.72, w: 0.5, h: 0.28 },
      ],
    },
    {
      id: "2-3",
      name: "Пара + трио",
      rects: [
        { x: 0, y: 0, w: 0.5, h: 0.48 },
        { x: 0.5, y: 0, w: 0.5, h: 0.48 },
        { x: 0, y: 0.48, w: 1 / 3, h: 0.52 },
        { x: 1 / 3, y: 0.48, w: 1 / 3, h: 0.52 },
        { x: 2 / 3, y: 0.48, w: 1 / 3, h: 0.52 },
      ],
    },
    {
      id: "3-2",
      name: "Трио + пара",
      rects: [
        { x: 0, y: 0, w: 1 / 3, h: 0.52 },
        { x: 1 / 3, y: 0, w: 1 / 3, h: 0.52 },
        { x: 2 / 3, y: 0, w: 1 / 3, h: 0.52 },
        { x: 0, y: 0.52, w: 0.5, h: 0.48 },
        { x: 0.5, y: 0.52, w: 0.5, h: 0.48 },
      ],
    },
    {
      id: "hero-center",
      name: "Полоса - пара - пара",
      rects: [
        { x: 0, y: 0, w: 1, h: 0.34 },
        { x: 0, y: 0.34, w: 0.5, h: 0.33 },
        { x: 0.5, y: 0.34, w: 0.5, h: 0.33 },
        { x: 0, y: 0.67, w: 0.5, h: 0.33 },
        { x: 0.5, y: 0.67, w: 0.5, h: 0.33 },
      ],
    },
  ],
  6: [
    {
      id: "grid-2x3",
      name: "Сетка 2×3",
      rects: [
        { x: 0, y: 0, w: 0.5, h: 1 / 3 },
        { x: 0.5, y: 0, w: 0.5, h: 1 / 3 },
        { x: 0, y: 1 / 3, w: 0.5, h: 1 / 3 },
        { x: 0.5, y: 1 / 3, w: 0.5, h: 1 / 3 },
        { x: 0, y: 2 / 3, w: 0.5, h: 1 / 3 },
        { x: 0.5, y: 2 / 3, w: 0.5, h: 1 / 3 },
      ],
    },
    {
      id: "grid-3x2",
      name: "Сетка 3×2",
      rects: [
        { x: 0, y: 0, w: 1 / 3, h: 0.5 },
        { x: 1 / 3, y: 0, w: 1 / 3, h: 0.5 },
        { x: 2 / 3, y: 0, w: 1 / 3, h: 0.5 },
        { x: 0, y: 0.5, w: 1 / 3, h: 0.5 },
        { x: 1 / 3, y: 0.5, w: 1 / 3, h: 0.5 },
        { x: 2 / 3, y: 0.5, w: 1 / 3, h: 0.5 },
      ],
    },
    {
      id: "hero-top-6",
      name: "Герой + 5 кадров",
      rects: [
        { x: 0, y: 0, w: 1, h: 0.38 },
        { x: 0, y: 0.38, w: 0.5, h: 0.31 },
        { x: 0.5, y: 0.38, w: 0.5, h: 0.31 },
        { x: 0, y: 0.69, w: 1 / 3, h: 0.31 },
        { x: 1 / 3, y: 0.69, w: 1 / 3, h: 0.31 },
        { x: 2 / 3, y: 0.69, w: 1 / 3, h: 0.31 },
      ],
    },
    {
      id: "sandwich-6",
      name: "3 полосы по паре",
      rects: [
        { x: 0, y: 0, w: 0.5, h: 0.33 },
        { x: 0.5, y: 0, w: 0.5, h: 0.33 },
        { x: 0, y: 0.33, w: 0.5, h: 0.34 },
        { x: 0.5, y: 0.33, w: 0.5, h: 0.34 },
        { x: 0, y: 0.67, w: 0.5, h: 0.33 },
        { x: 0.5, y: 0.67, w: 0.5, h: 0.33 },
      ],
    },
  ],
  7: [
    {
      id: "hero-7",
      name: "Герой + 6 сетка",
      rects: [
        { x: 0, y: 0, w: 1, h: 0.36 },
        { x: 0, y: 0.36, w: 0.5, h: 0.213 },
        { x: 0.5, y: 0.36, w: 0.5, h: 0.213 },
        { x: 0, y: 0.573, w: 0.5, h: 0.213 },
        { x: 0.5, y: 0.573, w: 0.5, h: 0.213 },
        { x: 0, y: 0.786, w: 0.5, h: 0.214 },
        { x: 0.5, y: 0.786, w: 0.5, h: 0.214 },
      ],
    },
    {
      id: "combo-7",
      name: "Пара - трио - пара",
      rects: [
        { x: 0, y: 0, w: 0.5, h: 0.32 },
        { x: 0.5, y: 0, w: 0.5, h: 0.32 },
        { x: 0, y: 0.32, w: 1 / 3, h: 0.36 },
        { x: 1 / 3, y: 0.32, w: 1 / 3, h: 0.36 },
        { x: 2 / 3, y: 0.32, w: 1 / 3, h: 0.36 },
        { x: 0, y: 0.68, w: 0.5, h: 0.32 },
        { x: 0.5, y: 0.68, w: 0.5, h: 0.32 },
      ],
    },
  ],
  8: [
    {
      id: "grid-2x4",
      name: "Сетка 2×4",
      rects: [
        { x: 0, y: 0, w: 0.5, h: 0.25 },
        { x: 0.5, y: 0, w: 0.5, h: 0.25 },
        { x: 0, y: 0.25, w: 0.5, h: 0.25 },
        { x: 0.5, y: 0.25, w: 0.5, h: 0.25 },
        { x: 0, y: 0.5, w: 0.5, h: 0.25 },
        { x: 0.5, y: 0.5, w: 0.5, h: 0.25 },
        { x: 0, y: 0.75, w: 0.5, h: 0.25 },
        { x: 0.5, y: 0.75, w: 0.5, h: 0.25 },
      ],
    },
    {
      id: "hero-top-bottom",
      name: "Шапка - 6 кадров - финал",
      rects: [
        { x: 0, y: 0, w: 1, h: 0.28 },
        { x: 0, y: 0.28, w: 1 / 3, h: 0.22 },
        { x: 1 / 3, y: 0.28, w: 1 / 3, h: 0.22 },
        { x: 2 / 3, y: 0.28, w: 1 / 3, h: 0.22 },
        { x: 0, y: 0.5, w: 1 / 3, h: 0.22 },
        { x: 1 / 3, y: 0.5, w: 1 / 3, h: 0.22 },
        { x: 2 / 3, y: 0.5, w: 1 / 3, h: 0.22 },
        { x: 0, y: 0.72, w: 1, h: 0.28 },
      ],
    },
    {
      id: "grid-4x2",
      name: "Сетка 4×2",
      rects: [
        { x: 0, y: 0, w: 0.25, h: 0.5 },
        { x: 0.25, y: 0, w: 0.25, h: 0.5 },
        { x: 0.5, y: 0, w: 0.25, h: 0.5 },
        { x: 0.75, y: 0, w: 0.25, h: 0.5 },
        { x: 0, y: 0.5, w: 0.25, h: 0.5 },
        { x: 0.25, y: 0.5, w: 0.25, h: 0.5 },
        { x: 0.5, y: 0.5, w: 0.25, h: 0.5 },
        { x: 0.75, y: 0.5, w: 0.25, h: 0.5 },
      ],
    },
  ],
};

export const FILTERS: { id: string; name: string; css: string }[] = [
  { id: "none", name: "Без фильтра", css: "none" },
  { id: "comic", name: "Комикс", css: "contrast(1.18) saturate(1.45)" },
  { id: "vivid", name: "Яркий", css: "saturate(1.7) contrast(1.05)" },
  { id: "bw", name: "Ч/Б нуар", css: "grayscale(1) contrast(1.25)" },
  { id: "retro", name: "Ретро", css: "sepia(0.55) contrast(1.05) saturate(1.2)" },
  { id: "cold", name: "Холодный", css: "hue-rotate(-12deg) saturate(1.15) brightness(1.03)" },
];

export const filterCss = (id: string) => FILTERS.find((f) => f.id === id)?.css ?? "none";

export const PAGE_BGS = [
  { id: "paper", name: "Бумага", value: "#FFF6E5" },
  { id: "white", name: "Белый", value: "#FFFFFF" },
  { id: "yellow", name: "Поп-жёлтый", value: "#FFD400" },
  { id: "pink", name: "Розовый", value: "#FFD6EC" },
  { id: "sky", name: "Небо", value: "#CDEFFF" },
  { id: "ink", name: "Чернила", value: "#191923" },
];

export const BUBBLE_COLORS = [
  "#FFFFFF",
  "#FFF3B0",
  "#FFD400",
  "#FFB3C7",
  "#A9DEF9",
  "#C8F7C5",
  "#FF3B30",
  "#2563EB",
  "#141310",
];

export const uid = () =>
  Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);
