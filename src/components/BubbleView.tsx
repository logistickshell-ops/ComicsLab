import { useEffect, useRef, useState } from "react";
import { Pencil, X } from "lucide-react";
import {
  BUBBLE_METRICS,
  FONT_FAMILY,
  FONT_SCALE,
  bubblePoints,
  polygonPoints,
  smoothClosedPath,
  thoughtTrail,
} from "../lib/geometry";
import type { Bubble } from "../lib/types";
import { cn } from "../utils/cn";

interface Props {
  bubble: Bubble;
  pageW: number;
  selected: boolean;
  editing: boolean;
  onPointerDown: (e: React.PointerEvent, bubbleId: string, mode: "move" | "resize") => void;
  onDoubleClick: (bubbleId: string) => void;
  onTextChange: (bubbleId: string, text: string) => void;
  onEditEnd: () => void;
  onDelete: (bubbleId: string) => void;
}

export default function BubbleView({
  bubble: b,
  pageW,
  selected,
  editing,
  onPointerDown,
  onDoubleClick,
  onTextChange,
  onEditEnd,
  onDelete,
}: Props) {
  const innerRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const el = innerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const r = entries[0].contentRect;
      setSize({ w: r.width, h: r.height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (editing && taRef.current) {
      const ta = taRef.current;
      ta.focus();
      ta.select();
      ta.style.height = "auto";
      ta.style.height = ta.scrollHeight + "px";
    }
  }, [editing]);

  const fontPx = pageW ? (b.fontSize / 100) * pageW : 20;
  const tailLen = Math.max(fontPx * 0.95, size.h * 0.34);
  const strokeW = Math.max(1.8, pageW * 0.0038);
  const metrics = BUBBLE_METRICS[b.type];
  const pts =
    size.w > 4 ? bubblePoints(b.type, size.w, size.h, b.tail, tailLen) : [];
  const trail =
    size.w > 4 && b.type === "thought"
      ? thoughtTrail(size.w, size.h, b.tail, fontPx)
      : [];

  const textStyle: React.CSSProperties = {
    fontFamily: FONT_FAMILY[b.font],
    fontSize: `${b.fontSize * (FONT_SCALE[b.font] ?? 1)}cqw`,
    lineHeight: b.font === "caveat" ? 1.02 : 1.16,
    color: b.color,
    textTransform: b.font === "russo" ? "uppercase" : "none",
    fontWeight: b.font === "caveat" ? 700 : 400,
  };

  return (
    <div
      className={cn(
        "absolute touch-drag select-none",
        selected && "z-30",
        !selected && "z-20"
      )}
      style={{
        left: `${b.x}%`,
        top: `${b.y}%`,
        width: `${b.w}%`,
        transform: "translate(-50%, -50%)",
      }}
      onPointerDown={(e) => {
        if (editing) return;
        e.stopPropagation();
        onPointerDown(e, b.id, "move");
      }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        onDoubleClick(b.id);
      }}
    >
      <div
        ref={innerRef}
        className={cn("relative", editing ? "cursor-text" : "cursor-grab active:cursor-grabbing")}
        style={
          selected && !editing
            ? { outline: "2px dashed #2563EB", outlineOffset: "5px", borderRadius: "6px" }
            : undefined
        }
      >
        {/* shape */}
        {size.w > 4 && (
          <svg
            className="pointer-events-none absolute left-0 top-0"
            width={size.w}
            height={size.h}
            viewBox={`0 0 ${size.w} ${size.h}`}
            style={{
              overflow: "visible",
              filter: "drop-shadow(0.5cqw 0.5cqw 0 rgba(20,19,16,0.9))",
            }}
          >
            {b.type === "thought" ? (
              <path
                d={smoothClosedPath(pts)}
                fill={b.bg}
                stroke="#141310"
                strokeWidth={strokeW}
                strokeLinejoin="round"
              />
            ) : (
              <polygon
                points={polygonPoints(pts)}
                fill={b.bg}
                stroke="#141310"
                strokeWidth={strokeW}
                strokeLinejoin="round"
              />
            )}
            {trail.map((c, i) => (
              <circle
                key={i}
                cx={c.x}
                cy={c.y}
                r={Math.max(2, c.r)}
                fill={b.bg}
                stroke="#141310"
                strokeWidth={strokeW * 0.8}
              />
            ))}
          </svg>
        )}

        {/* text / editor */}
        {editing ? (
          <textarea
            ref={taRef}
            value={b.text}
            onChange={(e) => {
              onTextChange(b.id, e.target.value);
              e.target.style.height = "auto";
              e.target.style.height = e.target.scrollHeight + "px";
            }}
            onBlur={onEditEnd}
            onPointerDown={(e) => e.stopPropagation()}
            onDoubleClick={(e) => e.stopPropagation()}
            className="relative z-10 w-full resize-none overflow-hidden bg-transparent text-center outline-none"
            style={{
              ...textStyle,
              padding: `${metrics.padYcss} ${metrics.padX}`,
            }}
            rows={2}
          />
        ) : (
          <div
            className="relative z-10 w-full whitespace-pre-wrap break-words text-center"
            style={{
              ...textStyle,
              padding: `${metrics.padYcss} ${metrics.padX}`,
            }}
          >
            {b.text || "…"}
          </div>
        )}

        {/* selected controls */}
        {selected && !editing && (
          <>
            <button
              aria-label="Удалить надпись"
              className="handle absolute -right-2 -top-2 z-40 bg-pop-red text-white"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                onDelete(b.id);
              }}
            >
              <X size={16} strokeWidth={3.5} />
            </button>
            <button
              aria-label="Редактировать текст"
              className="handle absolute -left-2 -top-2 z-40 bg-white"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                onDoubleClick(b.id);
              }}
            >
              <Pencil size={15} strokeWidth={3} />
            </button>
            <div
              aria-label="Изменить размер"
              className="handle absolute -bottom-2 -right-2 z-40 cursor-nwse-resize bg-pop-blue"
              onPointerDown={(e) => {
                e.stopPropagation();
                onPointerDown(e, b.id, "resize");
              }}
            >
              <svg width="14" height="14" viewBox="0 0 12 12" fill="none">
                <path d="M11 1L1 11M11 6L6 11" stroke="white" strokeWidth="2.4" strokeLinecap="round" />
              </svg>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
