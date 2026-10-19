import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CheckCircle2,
  ClipboardPaste,
  Download,
  Hand,
  MousePointerClick,
  Share2,
  Sparkles,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import Stage from "./components/Stage";
import Inspector, { type Tab } from "./components/Inspector";
import ExportModal from "./components/ExportModal";
import BubbleSheet from "./components/BubbleSheet";
import { fileToPanel, srcToPanel } from "./lib/images";
import { downloadBlob, renderComic, shareBlob } from "./lib/render";
import { useIsMobile } from "./lib/useIsMobile";
import { haptic, initTelegram, isTelegram, setupMainButton } from "./lib/telegram";
import {
  FORMATS,
  LAYOUTS,
  uid,
  type Bubble,
  type BubbleType,
  type Panel,
} from "./lib/types";
import { cn } from "./utils/cn";

import cat1 from "./assets/cat-1.jpg";
import cat2 from "./assets/cat-2.jpg";
import cat3 from "./assets/cat-3.jpg";
import cat4 from "./assets/cat-4.jpg";

const DEMO_SRCS = [cat1, cat2, cat3, cat4];
const LS_KEY = "komikslab-v1";

const BUBBLE_DEFAULTS: Record<BubbleType, Partial<Bubble>> = {
  speech: { text: "Привет!", x: 50, y: 26, w: 48, fontSize: 3.4, font: "neucha", bg: "#FFFFFF", color: "#141310", tail: "bottom-left" },
  thought: { text: "Хмм, интересная мысль…", x: 58, y: 24, w: 46, fontSize: 3.2, font: "neucha", bg: "#FFFFFF", color: "#141310", tail: "bottom-left" },
  caption: { text: "Тем временем…", x: 35, y: 11, w: 54, fontSize: 3.0, font: "neucha", bg: "#FFF3B0", color: "#141310", tail: "none" },
  shout: { text: "БУМ!", x: 50, y: 38, w: 44, fontSize: 4.6, font: "russo", bg: "#FFD400", color: "#141310", tail: "none" },
};

async function buildDemo() {
  const ps = await Promise.all(DEMO_SRCS.map((s) => srcToPanel(s, "none")));
  // hand-tuned framing so the hero's face is never covered
  ps[1].ty = 0.3; // rooftop: keep ears in frame
  ps[2].tx = 0.6; // flight: shift toward the stretched paw
  const bs: Bubble[] = [
    { id: uid(), panelId: ps[0].id, type: "caption", text: "Утром город позвал героя…", x: 68, y: 10, w: 54, fontSize: 2.9, font: "neucha", bg: "#FFF3B0", color: "#141310", tail: "none" },
    { id: uid(), panelId: ps[1].id, type: "speech", text: "Где-то там нужна помощь!", x: 30, y: 16, w: 48, fontSize: 3.2, font: "neucha", bg: "#FFFFFF", color: "#141310", tail: "bottom-right" },
    { id: uid(), panelId: ps[2].id, type: "shout", text: "Вперёд!", x: 73, y: 17, w: 42, fontSize: 4.3, font: "russo", bg: "#FFD400", color: "#141310", tail: "none" },
    { id: uid(), panelId: ps[3].id, type: "speech", text: "Город спасён. Время молока!", x: 28, y: 19, w: 48, fontSize: 3.1, font: "neucha", bg: "#FFFFFF", color: "#141310", tail: "bottom-right" },
  ];
  return { ps, bs };
}

interface Toast {
  id: number;
  msg: string;
  kind: "ok" | "warn";
}

export default function App() {
  const [panels, setPanels] = useState<Panel[]>([]);
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [layoutIdx, setLayoutIdx] = useState(0);
  const [formatId, setFormatId] = useState("4:5");
  const [bg, setBg] = useState("#FFF6E5");
  const [title, setTitle] = useState("Суперкот спасает город");
  const [showTitle, setShowTitle] = useState(true);
  const [exportSize, setExportSize] = useState(1600);
  const [tab, setTab] = useState<Tab>("frames");
  const [selectedPanelId, setSelectedPanelId] = useState<string | null>(null);
  const [selectedBubbleId, setSelectedBubbleId] = useState<string | null>(null);
  const [editingBubbleId, setEditingBubbleId] = useState<string | null>(null);
  const [sheetBubbleId, setSheetBubbleId] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [result, setResult] = useState<{ url: string; blob: Blob } | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);

  const fileRef = useRef<HTMLInputElement>(null);
  const replaceRef = useRef<HTMLInputElement>(null);
  const replaceTarget = useRef<string | null>(null);
  const hydrated = useRef(false);
  const toastTimer = useRef<number>(0);
  const isMobile = useIsMobile();

  /**
   * On phones the inline bubble textarea is tiny and the keyboard hides it,
   * so we open the bottom-sheet editor instead. Desktop keeps inline editing.
   */
  const handleSetEditing = useCallback(
    (id: string | null) => {
      if (id && isMobile) {
        setSelectedBubbleId(id);
        setSheetBubbleId(id);
        setEditingBubbleId(null);
        return;
      }
      setEditingBubbleId(id);
      setSheetBubbleId(null);
      if (id) setTab("text");
    },
    [isMobile]
  );

  const format = FORMATS.find((f) => f.id === formatId) ?? FORMATS[0];
  const layouts = LAYOUTS[panels.length] ?? LAYOUTS[1];
  const layout = layouts[Math.min(layoutIdx, layouts.length - 1)] ?? layouts[0];
  const rects = layout.rects;

  const showToast = useCallback((msg: string, kind: "ok" | "warn" = "ok") => {
    window.clearTimeout(toastTimer.current);
    setToast({ id: Date.now(), msg, kind });
    toastTimer.current = window.setTimeout(() => setToast(null), 3200);
  }, []);

  /* ---------- initial load: saved state or demo ---------- */
  useEffect(() => {
    initTelegram();
    (async () => {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        try {
          const s = JSON.parse(raw);
          const ps: Panel[] = (s.panels ?? []).map((p: Panel) =>
            typeof p.src === "string" && p.src.startsWith("demo:")
              ? { ...p, src: DEMO_SRCS[parseInt(p.src.slice(5), 10)] ?? p.src }
              : p
          );
          setPanels(ps);
          setBubbles(s.bubbles ?? []);
          setLayoutIdx(s.layoutIdx ?? 0);
          setFormatId(s.formatId ?? "4:5");
          setBg(s.bg ?? "#FFF6E5");
          setTitle(s.title ?? "");
          setShowTitle(s.showTitle ?? true);
          setExportSize(s.exportSize ?? 1600);
          if (ps[0]) setSelectedPanelId(ps[0].id);
          hydrated.current = true;
          return;
        } catch {
          /* fall through to demo */
        }
      }
      const { ps, bs } = await buildDemo();
      setPanels(ps);
      setBubbles(bs);
      setSelectedPanelId(ps[0]?.id ?? null);
      hydrated.current = true;
    })();
  }, []);

  /* ---------- autosave ---------- */
  useEffect(() => {
    if (!hydrated.current) return;
    const t = window.setTimeout(() => {
      try {
        const slim = panels.map((p) => {
          const di = DEMO_SRCS.indexOf(p.src);
          return di >= 0 ? { ...p, src: `demo:${di}` } : p;
        });
        localStorage.setItem(
          LS_KEY,
          JSON.stringify({ panels: slim, bubbles, layoutIdx, formatId, bg, title, showTitle, exportSize })
        );
      } catch {
        /* quota — stay silent */
      }
    }, 700);
    return () => window.clearTimeout(t);
  }, [panels, bubbles, layoutIdx, formatId, bg, title, showTitle, exportSize]);

  /* ---------- clamp layout when count changes ---------- */
  useEffect(() => {
    const max = (LAYOUTS[panels.length]?.length ?? 1) - 1;
    if (layoutIdx > max) setLayoutIdx(0);
  }, [panels.length, layoutIdx]);

  /* ---------- file handling ---------- */
  const addFiles = useCallback(
    async (files: File[]) => {
      const imgs = files.filter((f) => f.type.startsWith("image/"));
      if (!imgs.length) {
        showToast("Нужны именно картинки", "warn");
        return;
      }
      const room = 8 - panels.length;
      if (room <= 0) {
        showToast("Уже 8 кадров — это максимум для одного листа", "warn");
        haptic("error");
        return;
      }
      const take = imgs.slice(0, room);
      try {
        const created: Panel[] = [];
        for (const f of take) created.push(await fileToPanel(f));
        setPanels((prev) => [...prev, ...created].slice(0, 8));
        if (created[0]) setSelectedPanelId(created[0].id);
        setTab("frames");
        haptic("success");
        showToast(
          imgs.length > room
            ? `Добавил ${created.length} кадр(а), остальные не влезли — лимит 8`
            : `Кадров на листе: ${Math.min(8, panels.length + created.length)}`
        );
      } catch {
        showToast("Не смог открыть картинку. Попробуй JPG или PNG", "warn");
        haptic("error");
      }
    },
    [panels.length, showToast]
  );

  const addFilesRef = useRef(addFiles);
  addFilesRef.current = addFiles;

  /* paste from clipboard */
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;
      const files = Array.from(e.clipboardData?.files ?? []);
      if (files.length) {
        e.preventDefault();
        addFilesRef.current(files);
      }
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, []);

  /* delete selected bubble with keyboard */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;
      if ((e.key === "Delete" || e.key === "Backspace") && selectedBubbleId && !editingBubbleId) {
        e.preventDefault();
        setBubbles((prev) => prev.filter((b) => b.id !== selectedBubbleId));
        setSelectedBubbleId(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedBubbleId, editingBubbleId]);

  /* ---------- panel ops ---------- */
  const updatePanel = useCallback((id: string, patch: Partial<Panel>) => {
    setPanels((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  }, []);

  const reorder = useCallback((from: number, to: number) => {
    setPanels((prev) => {
      if (from < 0 || to < 0 || from >= prev.length || to >= prev.length) return prev;
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
    haptic("select");
  }, []);

  const deletePanel = useCallback(
    (id: string) => {
      setPanels((prev) => prev.filter((p) => p.id !== id));
      setBubbles((prev) => prev.filter((b) => b.panelId !== id));
      if (selectedPanelId === id) setSelectedPanelId(null);
      haptic("light");
    },
    [selectedPanelId]
  );

  /* ---------- bubble ops ---------- */
  const updateBubble = useCallback((id: string, patch: Partial<Bubble>) => {
    setBubbles((prev) => prev.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  }, []);

  const addBubble = useCallback(
    (type: BubbleType) => {
      const panelId = selectedPanelId ?? panels[0]?.id;
      if (!panelId) {
        showToast("Сначала добавь хотя бы одну картинку", "warn");
        return;
      }
      const nb: Bubble = {
        id: uid(),
        panelId,
        type,
        text: "",
        x: 50,
        y: 30,
        w: 48,
        fontSize: 3.4,
        font: "neucha",
        bg: "#FFFFFF",
        color: "#141310",
        tail: "none",
        ...BUBBLE_DEFAULTS[type],
      } as Bubble;
      setBubbles((prev) => [...prev, nb]);
      setSelectedBubbleId(nb.id);
      setSelectedPanelId(panelId);
      setTab("text");
      haptic("light");
      if (isMobile) {
        window.setTimeout(() => setSheetBubbleId(nb.id), 120);
      } else {
        window.setTimeout(() => setEditingBubbleId(nb.id), 60);
      }
    },
    [panels, selectedPanelId, showToast, isMobile]
  );

  const deleteBubble = useCallback(
    (id: string) => {
      setBubbles((prev) => prev.filter((b) => b.id !== id));
      if (selectedBubbleId === id) setSelectedBubbleId(null);
      if (editingBubbleId === id) setEditingBubbleId(null);
      if (sheetBubbleId === id) setSheetBubbleId(null);
      haptic("light");
    },
    [selectedBubbleId, editingBubbleId, sheetBubbleId]
  );

  const duplicateBubble = useCallback(
    (id: string) => {
      const src = bubbles.find((b) => b.id === id);
      if (!src) return;
      const copy: Bubble = {
        ...src,
        id: uid(),
        x: Math.min(92, src.x + 7),
        y: Math.min(92, src.y + 7),
      };
      setBubbles((prev) => [...prev, copy]);
      setSelectedBubbleId(copy.id);
    },
    [bubbles]
  );

  const selectBubbleEverywhere = useCallback(
    (id: string) => {
      const b = bubbles.find((x) => x.id === id);
      setSelectedBubbleId(id);
      if (b) setSelectedPanelId(b.panelId);
      // on phones the list doubles as a quick way to jump into the editor
      if (isMobile) setSheetBubbleId(id);
    },
    [bubbles, isMobile]
  );

  /* ---------- export ---------- */
  const fileName = useCallback(() => {
    const slug = title
      .trim()
      .toLowerCase()
      .replace(/[^a-zа-яё0-9]+/gi, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40);
    return `${slug || "comic"}.png`;
  }, [title]);

  const doExport = useCallback(
    async (mode: "download" | "share") => {
      if (!panels.length || exporting) return;
      setExporting(true);
      try {
        const blob = await renderComic({
          panels,
          bubbles,
          rects,
          ratio: format.ratio,
          bg,
          title,
          showTitle,
          width: exportSize,
        });
        if (result) URL.revokeObjectURL(result.url);
        const url = URL.createObjectURL(blob);
        setResult({ url, blob });
        if (mode === "download" && !isTelegram) downloadBlob(blob, fileName());
        if (mode === "share") {
          const ok = await shareBlob(blob, fileName());
          if (!ok && !isTelegram) downloadBlob(blob, fileName());
        }
        haptic("success");
      } catch {
        showToast("Что-то пошло не так при сборке. Попробуй ещё раз", "warn");
        haptic("error");
      } finally {
        setExporting(false);
      }
    },
    [panels, bubbles, rects, format.ratio, bg, title, showTitle, exportSize, exporting, result, fileName, showToast]
  );

  const exportRef = useRef(doExport);
  exportRef.current = doExport;

  /* Telegram main button */
  useEffect(() => {
    if (!panels.length) return;
    return setupMainButton("Скачать комикс PNG", () => exportRef.current("download"));
  }, [panels.length]);

  /* ---------- project ops ---------- */
  const loadDemo = useCallback(async () => {
    const { ps, bs } = await buildDemo();
    setPanels(ps);
    setBubbles(bs);
    setLayoutIdx(0);
    setFormatId("4:5");
    setBg("#FFF6E5");
    setTitle("Суперкот спасает город");
    setShowTitle(true);
    setSelectedPanelId(ps[0]?.id ?? null);
    setSelectedBubbleId(null);
    showToast("Демо-история загружена — правь под себя!");
  }, [showToast]);

  const resetAll = useCallback(() => {
    setPanels([]);
    setBubbles([]);
    setSelectedPanelId(null);
    setSelectedBubbleId(null);
    setEditingBubbleId(null);
    setTitle("");
    showToast("Лист чист. Загружай свои картинки!");
    haptic("light");
  }, [showToast]);

  const steps = useMemo(
    () => [
      { n: 1, t: "Загрузи 1–8 фото", done: panels.length > 0 },
      { n: 2, t: "Расставь кадры", done: panels.length > 1 },
      { n: 3, t: "Добавь реплики", done: bubbles.length > 0 },
      { n: 4, t: "Скачай PNG", done: false },
    ],
    [panels.length, bubbles.length]
  );

  const sheetBubble = sheetBubbleId ? bubbles.find((b) => b.id === sheetBubbleId) ?? null : null;
  const sheetPanelIndex = sheetBubble ? panels.findIndex((p) => p.id === sheetBubble.panelId) : -1;

  return (
    <div className="halftone min-h-dvh bg-pop-yellow">
      {/* ---------- header ---------- */}
      <header className="sticky top-0 z-40 border-b-[3px] border-ink bg-pop-yellow/95 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-[1400px] items-center gap-2 px-3 sm:gap-3 sm:h-16 sm:px-5">
          <a href="#" className="flex items-center gap-2.5" onClick={(e) => e.preventDefault()}>
            <span className="anim-wiggle relative flex h-11 w-11 items-center justify-center">
              <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full">
                <polygon
                  points="50,2 61,18 78,8 80,28 98,30 88,45 100,58 84,64 88,83 70,79 63,97 50,84 36,96 32,78 13,83 18,64 2,55 15,44 5,28 24,28 26,9 40,19"
                  fill="#FF3B30"
                  stroke="#141310"
                  strokeWidth="4"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="relative font-display text-[11px] text-white" style={{ transform: "rotate(-8deg)" }}>
                БУМ!
              </span>
            </span>
            <span className="font-display text-lg uppercase leading-none sm:text-[22px]">
              Комикс<span className="text-pop-red">Лаб</span>
              <span className="mt-0.5 hidden text-[10px] font-bold normal-case tracking-wide text-ink/55 [font-family:var(--font-ui)] sm:block">
                конструктор комиксов в браузере
              </span>
            </span>
          </a>

          <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={loadDemo}
              className="btn btn-secondary btn-sm sm:btn-md"
            >
              <Sparkles size={16} strokeWidth={2.5} />
              <span className="hidden sm:inline">Демо</span>
            </button>
            <button
              onClick={() => doExport("download")}
              disabled={!panels.length || exporting}
              className="btn btn-primary btn-sm sm:btn-md disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Download size={16} strokeWidth={2.6} />
              <span className="hidden sm:inline">{exporting ? "Собираем…" : "Скачать PNG"}</span>
              <span className="sm:hidden">{exporting ? "…" : "PNG"}</span>
            </button>
          </div>
        </div>
      </header>

      {/* ---------- marquee ---------- */}
      <div className="hidden overflow-hidden border-b-[3px] border-ink bg-ink py-1.5 text-pop-yellow sm:block">
        <div className="anim-marquee flex w-max whitespace-nowrap font-display text-[12px] uppercase tracking-widest">
          {[0, 1].map((half) => (
            <span key={half} className="flex">
              {["Кадр", "Реплика", "Бум!", "Раскадровка", "Облачко", "Финал", "Скачать", "Ещё раз!"].map((w) => (
                <span key={w} className="flex items-center">
                  <span className="px-4">{w}</span>
                  <span className="text-pop-red">•</span>
                </span>
              ))}
            </span>
          ))}
        </div>
      </div>

      {/* ---------- main ---------- */}
      <main className="mx-auto flex max-w-[1400px] flex-col gap-3 px-2 py-3 sm:gap-4 sm:px-3 sm:py-4 lg:grid lg:grid-cols-[minmax(0,1fr)_400px] lg:grid-rows-[auto_minmax(0,1fr)_auto] lg:gap-x-6">
        {/* intro */}
        <div className="lg:col-start-1 lg:row-start-1">
          <h1 className="font-display text-[21px] uppercase leading-[1.08] sm:text-4xl">
            Собери свой комикс
            <span className="text-pop-red"> за минуту</span>
          </h1>
          <div className="scroll-comic -mx-3 mt-2 flex gap-1.5 overflow-x-auto px-3 pb-1 sm:mx-0 sm:flex-wrap sm:gap-1.5 sm:overflow-visible sm:px-0 sm:pb-0">
            {steps.map((s) => (
              <span
                key={s.n}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 rounded-full border-2 border-ink px-2 py-1 text-[11px] font-bold sm:px-2.5 sm:text-[12px]",
                  s.done ? "bg-ink text-pop-yellow" : "bg-white shadow-comic-sm"
                )}
              >
                <span
                  className={cn(
                    "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 font-display text-[11px]",
                    s.done ? "border-pop-yellow bg-pop-red text-white" : "border-ink bg-pop-yellow"
                  )}
                >
                  {s.n}
                </span>
                {s.t}
              </span>
            ))}
          </div>
        </div>

        {/* stage */}
        <div className="w-full lg:sticky lg:top-[88px] lg:z-20 lg:self-start lg:col-start-1 lg:row-start-2">
          <div className="relative rounded-3xl border-[3px] border-ink bg-white/70 p-2 shadow-comic-lg sm:p-4">
            <span
              aria-hidden
              className="anim-float pointer-events-none absolute -left-3 -top-4 z-10 hidden select-none rounded-xl border-2 border-ink bg-pop-cyan px-2.5 py-1 font-display text-xs uppercase shadow-comic-sm md:block"
              style={{ "--rot": "-6deg", transform: "rotate(-6deg)" } as React.CSSProperties}
            >
              Твой лист
            </span>
            <span
              aria-hidden
              className="anim-float pointer-events-none absolute -right-2 bottom-6 z-10 hidden select-none rounded-xl border-2 border-ink bg-pop-pink px-2.5 py-1 font-display text-xs uppercase shadow-comic-sm md:block"
              style={{ "--rot": "5deg", transform: "rotate(5deg)", animationDelay: "1.2s" } as React.CSSProperties}
            >
              Бац!
            </span>

            <Stage
              panels={panels}
              bubbles={bubbles}
              rects={rects}
              ratio={format.ratio}
              bg={bg}
              title={title}
              showTitle={showTitle}
              selectedPanelId={selectedPanelId}
              selectedBubbleId={selectedBubbleId}
              editingBubbleId={editingBubbleId}
              onSelectPanel={setSelectedPanelId}
              onSelectBubble={setSelectedBubbleId}
              onUpdatePanel={updatePanel}
              onUpdateBubble={updateBubble}
              onDeleteBubble={deleteBubble}
              onSetEditing={handleSetEditing}
              onDropFiles={(files) => addFilesRef.current(files)}
              onAddClick={() => fileRef.current?.click()}
              tapToEdit={isMobile}
            />
          </div>
        </div>

        {/* inspector */}
        <div className="lg:col-start-2 lg:row-span-3 lg:row-start-1">
          <Inspector
            tab={tab}
            setTab={setTab}
            panels={panels}
            bubbles={bubbles}
            layoutIdx={layoutIdx}
            setLayoutIdx={setLayoutIdx}
            formatId={formatId}
            setFormatId={setFormatId}
            bg={bg}
            setBg={setBg}
            title={title}
            setTitle={setTitle}
            showTitle={showTitle}
            setShowTitle={setShowTitle}
            exportSize={exportSize}
            setExportSize={setExportSize}
            selectedPanelId={selectedPanelId}
            selectedBubbleId={selectedBubbleId}
            onSelectPanel={(id) => {
              setSelectedPanelId(id);
              setSelectedBubbleId(null);
            }}
            onSelectBubble={selectBubbleEverywhere}
            onReorder={reorder}
            onDeletePanel={deletePanel}
            onUpdatePanel={updatePanel}
            onAddPhotos={() => fileRef.current?.click()}
            onReplacePhoto={(id) => {
              replaceTarget.current = id;
              replaceRef.current?.click();
            }}
            onAddBubble={addBubble}
            onUpdateBubble={updateBubble}
            onDeleteBubble={deleteBubble}
            onDuplicateBubble={duplicateBubble}
            onExport={() => doExport("download")}
            onShare={() => doExport("share")}
            onReset={resetAll}
            onDemo={loadDemo}
            exporting={exporting}
          />
        </div>

        {/* tips - hide on mobile to save space */}
        <div className="hidden sm:grid sm:grid-cols-3 sm:gap-2 lg:col-start-1 lg:row-start-3 lg:gap-3">
          {[
            {
              icon: <Hand size={16} strokeWidth={2.5} />,
              t: "Тяни фото",
              d: "Зажми картинку на листе и двигай — выберешь лучший фрагмент.",
            },
            {
              icon: <MousePointerClick size={16} strokeWidth={2.5} />,
              t: "Редактировать",
              d: "Текст правится прямо на листе. Уголок меняет ширину облачка.",
            },
            {
              icon: <ClipboardPaste size={16} strokeWidth={2.5} />,
              t: "Вставить",
              d: "Скопировал скриншот? Жми Ctrl+V — картинка станет кадром.",
            },
          ].map((tip) => (
            <div key={tip.t} className="rounded-2xl border-[3px] border-ink bg-white p-2.5 shadow-comic sm:p-3.5">
              <div className="mb-1 flex items-center gap-1.5 font-display text-[12px] uppercase sm:text-[13px]">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg border-2 border-ink bg-pop-yellow sm:h-8 sm:w-8">
                  {tip.icon}
                </span>
                {tip.t}
              </div>
              <p className="text-[12px] font-medium leading-snug text-ink/60 sm:text-[13px]">{tip.d}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="mx-auto max-w-[1400px] px-4 pb-28 pt-1 text-center text-[12px] font-semibold text-ink/55 sm:px-5 sm:pb-8">
        <p className="mb-1">
          КомиксЛаб — всё собирается локально в твоём браузере, картинки никуда не отправляются.
        </p>
        <p>
          Работает как обычный сайт и как Telegram Mini App. Автор:{" "}
          <span className="font-display text-pop-red">Disa</span>
        </p>
      </footer>

      {/* ---------- mobile action bar ---------- */}
      <div
        className="mobile-bar fixed inset-x-0 bottom-0 z-50 border-t-[3px] border-ink bg-pop-yellow/97 backdrop-blur-sm lg:hidden"
        style={{ backgroundColor: "rgba(255,212,0,0.97)" }}
      >
        <div className="mx-auto flex max-w-[560px] gap-2 pt-2">
          <button
            onClick={() => doExport("download")}
            disabled={!panels.length || exporting}
            className="btn btn-primary btn-md flex-1 flex-col gap-0.5 px-1 disabled:opacity-40"
            title="Выгрузить комикс в PNG"
          >
            <Download size={19} strokeWidth={2.6} />
            <span className="text-[11px] leading-tight">{exporting ? "Сборка…" : "Выгрузить"}</span>
          </button>
          <button
            onClick={() => doExport("share")}
            disabled={!panels.length || exporting}
            className="btn btn-secondary btn-md flex-1 flex-col gap-0.5 px-1 disabled:opacity-40"
            title="Поделиться комиксом"
          >
            <Share2 size={19} strokeWidth={2.6} />
            <span className="text-[11px] leading-tight">Поделиться</span>
          </button>
          <button
            onClick={() => {
              if (panels.length === 0) return;
              if (window.confirm("Очистить все кадры и надписи?")) {
                resetAll();
              }
            }}
            disabled={!panels.length}
            className="btn btn-tertiary btn-md flex-1 flex-col gap-0.5 px-1 text-pop-red hover:bg-red-50 disabled:opacity-40"
            title="Удалить все кадры и начать заново"
          >
            <Trash2 size={19} strokeWidth={2.6} />
            <span className="text-[11px] leading-tight">Удалить все</span>
          </button>
        </div>
      </div>

      {/* hidden file inputs */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          e.target.value = "";
          if (files.length) addFilesRef.current(files);
        }}
      />
      <input
        ref={replaceRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={async (e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          const id = replaceTarget.current;
          if (!f || !id) return;
          try {
            const np = await fileToPanel(f);
            updatePanel(id, { src: np.src, iw: np.iw, ih: np.ih, zoom: 1, tx: 0.5, ty: 0.5 });
            showToast("Кадр заменён");
          } catch {
            showToast("Не смог открыть картинку", "warn");
          }
        }}
      />

      {/* mobile bubble editor */}
      {sheetBubble && (
        <BubbleSheet
          bubble={sheetBubble}
          panelIndex={Math.max(0, sheetPanelIndex)}
          onUpdate={(patch) => updateBubble(sheetBubble.id, patch)}
          onDuplicate={() => duplicateBubble(sheetBubble.id)}
          onDelete={() => deleteBubble(sheetBubble.id)}
          onClose={() => setSheetBubbleId(null)}
        />
      )}

      {/* result modal */}
      {result && (
        <ExportModal
          url={result.url}
          onClose={() => setResult(null)}
          onDownload={() => downloadBlob(result.blob, fileName())}
          onShare={async () => {
            const ok = await shareBlob(result.blob, fileName());
            if (!ok) showToast("Шаринг недоступен — скачай файл кнопкой слева", "warn");
          }}
        />
      )}

      {/* toast */}
      {toast && (
        <div
          key={toast.id}
          className={cn(
            "anim-toast fixed bottom-24 left-1/2 z-[90] flex w-[calc(100%-2rem)] max-w-md -translate-x-1/2 items-center gap-2.5 rounded-2xl border-[3px] border-ink px-4 py-3 font-bold shadow-comic-lg lg:bottom-5",
            toast.kind === "ok" ? "bg-ink text-white" : "bg-pop-red text-white"
          )}
        >
          {toast.kind === "ok" ? (
            <CheckCircle2 size={20} className="shrink-0 text-pop-yellow" />
          ) : (
            <TriangleAlert size={20} className="shrink-0" />
          )}
          <span className="text-sm leading-snug">{toast.msg}</span>
        </div>
      )}
    </div>
  );
}
