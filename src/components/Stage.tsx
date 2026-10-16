import { useEffect, useRef, useState } from "react";
import { ImagePlus, MousePointer2 } from "lucide-react";
import BubbleView from "./BubbleView";
import { coverRect, isDark } from "../lib/geometry";
import { PAGE_GAP, PAGE_PAD, TITLE_H } from "../lib/render";
import { filterCss, type Bubble, type Panel, type Rect } from "../lib/types";
import { cn } from "../utils/cn";

interface Props {
  panels: Panel[];
  bubbles: Bubble[];
  rects: Rect[];
  ratio: number;
  bg: string;
  title: string;
  showTitle: boolean;
  selectedPanelId: string | null;
  selectedBubbleId: string | null;
  editingBubbleId: string | null;
  onSelectPanel: (id: string | null) => void;
  onSelectBubble: (id: string | null) => void;
  onUpdatePanel: (id: string, patch: Partial<Panel>) => void;
  onUpdateBubble: (id: string, patch: Partial<Bubble>) => void;
  onDeleteBubble: (id: string) => void;
  onSetEditing: (id: string | null) => void;
  onDropFiles: (files: File[]) => void;
  onAddClick: () => void;
}

type Drag =
  | {
      kind: "pan";
      panelId: string;
      startX: number;
      startY: number;
      startDx: number;
      startDy: number;
      pw: number;
      ph: number;
      dw: number;
      dh: number;
    }
  | { kind: "bubble-move"; bubbleId: string; panelId: string; ox: number; oy: number }
  | { kind: "bubble-resize"; bubbleId: string; panelId: string; cx: number };

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

export default function Stage(p: Props) {
  const pageRef = useRef<HTMLDivElement>(null);
  const panelEls = useRef(new Map<string, HTMLDivElement>());
  const dragRef = useRef<Drag | null>(null);
  const [pageW, setPageW] = useState(0);
  const [dragOver, setDragOver] = useState(false);

  const panelsRef = useRef(p.panels);
  panelsRef.current = p.panels;
  const bubblesRef = useRef(p.bubbles);
  bubblesRef.current = p.bubbles;

  useEffect(() => {
    const el = pageRef.current;
    if (!el) return;
    const ro = new ResizeObserver((e) => setPageW(e[0].contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const move = (e: PointerEvent) => {
      const d = dragRef.current;
      if (!d) return;
      if (d.kind === "pan") {
        const nx = d.startDx + (e.clientX - d.startX);
        const ny = d.startDy + (e.clientY - d.startY);
        const tx = d.dw > d.pw ? clamp(nx / (d.pw - d.dw), 0, 1) : 0.5;
        const ty = d.dh > d.ph ? clamp(ny / (d.ph - d.dh), 0, 1) : 0.5;
        p.onUpdatePanel(d.panelId, { tx, ty });
      } else {
        const el = panelEls.current.get(d.panelId);
        if (!el) return;
        const r = el.getBoundingClientRect();
        const px = ((e.clientX - r.left) / r.width) * 100;
        const py = ((e.clientY - r.top) / r.height) * 100;
        if (d.kind === "bubble-move") {
          p.onUpdateBubble(d.bubbleId, { x: clamp(px, 3, 97), y: clamp(py, 3, 97) });
        } else {
          p.onUpdateBubble(d.bubbleId, { w: clamp(2 * (px - d.cx), 14, 98) });
        }
      }
    };
    const up = () => {
      dragRef.current = null;
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  });

  const pageH = pageW / p.ratio;
  const showTitleEff = p.showTitle && p.title.trim().length > 0;
  const padPx = pageW * PAGE_PAD;
  const gapPx = pageW * PAGE_GAP;
  const titleHPx = showTitleEff ? pageH * TITLE_H : 0;
  const contentW = pageW - padPx * 2;
  const contentH = pageH - padPx * 2 - titleHPx;
  const dark = isDark(p.bg);

  const beginPan = (e: React.PointerEvent, panel: Panel, rect: Rect) => {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    p.onSelectPanel(panel.id);
    p.onSelectBubble(null);
    p.onSetEditing(null);
    const pw = rect.w * contentW - gapPx;
    const ph = rect.h * contentH - gapPx;
    const { dx, dy, dw, dh } = coverRect(pw, ph, panel.iw, panel.ih, panel.zoom, panel.tx, panel.ty);
    dragRef.current = {
      kind: "pan",
      panelId: panel.id,
      startX: e.clientX,
      startY: e.clientY,
      startDx: dx,
      startDy: dy,
      pw,
      ph,
      dw,
      dh,
    };
  };

  const bubblePointer = (e: React.PointerEvent, bubbleId: string, mode: "move" | "resize") => {
    const b = bubblesRef.current.find((x) => x.id === bubbleId);
    if (!b) return;
    p.onSelectBubble(bubbleId);
    p.onSelectPanel(b.panelId);
    if (mode === "move") {
      const el = panelEls.current.get(b.panelId);
      let ox = 0;
      let oy = 0;
      if (el) {
        const r = el.getBoundingClientRect();
        ox = b.x - ((e.clientX - r.left) / r.width) * 100;
        oy = b.y - ((e.clientY - r.top) / r.height) * 100;
      }
      dragRef.current = { kind: "bubble-move", bubbleId, panelId: b.panelId, ox, oy };
    } else {
      dragRef.current = { kind: "bubble-resize", bubbleId, panelId: b.panelId, cx: b.x };
    }
  };

  const titleFs = Math.min(5.4, 118 / Math.max(6, p.title.trim().length));

  return (
      <div
        className="stage-max relative"
        style={{ "--ratio": p.ratio } as React.CSSProperties}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith("image/"));
          if (files.length) p.onDropFiles(files);
        }}
      >
      <div
        ref={pageRef}
        className={cn(
          "stage-page relative shadow-comic-lg [container-type:inline-size]",
          dark ? "halftone-white" : "halftone-paper"
        )}
        style={{
          ...( { "--ratio": p.ratio } as React.CSSProperties),
          aspectRatio: `${p.ratio}`,
          backgroundColor: p.bg,
          border: `${Math.max(3, pageW * 0.0063)}px solid ${dark ? "#FFFFFF" : "#141310"}`,
        }}
        onPointerDown={(e) => {
          if (e.target === e.currentTarget) {
            p.onSelectPanel(null);
            p.onSelectBubble(null);
          }
        }}
      >
        {/* title */}
        {showTitleEff && (
          <div
            className="absolute left-0 right-0 top-0 z-10 flex items-center justify-center px-[4cqw]"
            style={{ height: `${TITLE_H * 100}%`, paddingTop: "3cqw" }}
          >
            <span
              className="whitespace-nowrap text-center font-display uppercase leading-none"
              style={{
                fontSize: `${titleFs}cqw`,
                color: dark ? "#FFFFFF" : "#141310",
                transform: "rotate(-1.3deg)",
                textShadow: dark ? "none" : "0.5cqw 0.5cqw 0 #FF3B30",
              }}
            >
              {p.title}
            </span>
          </div>
        )}

        {/* panels layer */}
        <div
          className="absolute"
          style={{
            left: "3cqw",
            right: "3cqw",
            bottom: "3cqw",
            top: showTitleEff ? `calc(3cqw + ${TITLE_H * 100}%)` : "3cqw",
          }}
        >
           {p.panels.length === 0 ? (
             <button
               onClick={p.onAddClick}
               className="dropzone-dash flex h-full w-full flex-col items-center justify-center gap-2 rounded-xl bg-white/60 p-4 text-center transition hover:bg-white/85 sm:gap-3 sm:p-6"
             >
               <span className="anim-float flex h-14 w-14 items-center justify-center rounded-2xl border-[3px] border-ink bg-pop-yellow shadow-comic sm:h-16 sm:w-16">
                 <ImagePlus size={26} strokeWidth={2.4} className="sm:size-6" />
               </span>
               <span className="font-display text-[15px] uppercase leading-tight sm:text-lg">
                 Перетащи сюда
                 <br />
                 1–4 картинки
               </span>
               <span className="max-w-[240px] text-[11px] font-medium text-ink/60 sm:max-w-[280px] sm:text-sm">
                 или нажми, чтобы выбрать файлы
               </span>
             </button>
          ) : (
            p.panels.map((panel, i) => {
              const rect = p.rects[i];
              if (!rect) return null;
              const pw = rect.w * contentW - gapPx;
              const ph = rect.h * contentH - gapPx;
              const cov = pageW
                ? coverRect(pw, ph, panel.iw, panel.ih, panel.zoom, panel.tx, panel.ty)
                : null;
              const selected = p.selectedPanelId === panel.id;
              return (
                <div
                  key={panel.id}
                  className="absolute"
                  style={{
                    left: `${rect.x * 100}%`,
                    top: `${rect.y * 100}%`,
                    width: `${rect.w * 100}%`,
                    height: `${rect.h * 100}%`,
                    padding: `${PAGE_GAP * 50}cqw`,
                  }}
                >
                  <div
                    ref={(el) => {
                      if (el) panelEls.current.set(panel.id, el);
                      else panelEls.current.delete(panel.id);
                    }}
                    className={cn(
                      "touch-drag relative h-full w-full cursor-grab overflow-hidden bg-white active:cursor-grabbing",
                      selected && "z-10"
                    )}
                    style={{
                      border: `${Math.max(2.5, pageW * 0.0042)}px solid #141310`,
                      boxShadow: selected
                        ? "inset 0 0 0 3px #2563EB, 0 0 0 3px #2563EB"
                        : undefined,
                    }}
                    onPointerDown={(e) => beginPan(e, panel, rect)}
                  >
                    {cov ? (
                      <img
                        src={panel.src}
                        alt=""
                        draggable={false}
                        className="pointer-events-none absolute left-0 top-0 max-w-none select-none"
                        style={{
                          width: cov.dw,
                          height: cov.dh,
                          transform: `translate(${cov.dx}px, ${cov.dy}px)`,
                          filter: filterCss(panel.filter),
                        }}
                      />
                    ) : (
                      <img
                        src={panel.src}
                        alt=""
                        draggable={false}
                        className="pointer-events-none absolute inset-0 h-full w-full select-none object-cover"
                        style={{ filter: filterCss(panel.filter) }}
                      />
                    )}

                    {/* editor-only badge */}
                    <span
                      className={cn(
                        "pointer-events-none absolute left-1 top-1 z-40 flex h-6 min-w-6 items-center justify-center rounded-md border-2 border-ink px-1 font-display text-[12px] leading-none text-white sm:left-1.5 sm:top-1.5 sm:h-5 sm:min-w-5 sm:text-[11px]",
                        selected ? "bg-pop-blue" : "bg-ink/85"
                      )}
                    >
                      {i + 1}
                    </span>

                    {selected && (
                      <span className="pointer-events-none absolute bottom-1 right-1 z-40 hidden items-center gap-1 rounded-md border-2 border-ink bg-white/95 px-1.5 py-0.5 text-[10px] font-bold sm:flex">
                        <MousePointer2 size={11} /> тяни фото
                      </span>
                    )}

                    {/* bubbles of this panel */}
                    {p.bubbles
                      .filter((b) => b.panelId === panel.id)
                      .map((b) => (
                        <BubbleView
                          key={b.id}
                          bubble={b}
                          pageW={pageW}
                          selected={p.selectedBubbleId === b.id}
                          editing={p.editingBubbleId === b.id}
                          onPointerDown={bubblePointer}
                          onDoubleClick={(id) => {
                            p.onSelectBubble(id);
                            p.onSetEditing(id);
                          }}
                          onTextChange={(id, text) => p.onUpdateBubble(id, { text })}
                          onEditEnd={() => p.onSetEditing(null)}
                          onDelete={p.onDeleteBubble}
                        />
                      ))}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* drop overlay */}
        {dragOver && (
          <div className="pointer-events-none absolute inset-0 z-50 flex items-center justify-center bg-pop-blue/25 backdrop-blur-[1px]">
            <span className="anim-pop-in rounded-2xl border-[3px] border-ink bg-white px-5 py-3 font-display text-xl uppercase shadow-comic">
              Отпускай!
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
