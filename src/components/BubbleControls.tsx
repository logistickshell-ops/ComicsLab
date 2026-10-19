import type { ReactNode } from "react";
import {
  ArrowDown,
  ArrowDownLeft,
  ArrowDownRight,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowUpLeft,
  ArrowUpRight,
  Ban,
  Cloud,
  Copy,
  MessageCircle,
  RectangleHorizontal,
  Trash2,
  Zap,
} from "lucide-react";
import { FONT_FAMILY } from "../lib/geometry";
import type { Bubble, BubbleFont, BubbleType, TailDir } from "../lib/types";
import { ColorRow, SliderRow } from "./ui";
import { cn } from "../utils/cn";

const FONTS: { id: BubbleFont; name: string }[] = [
  { id: "neucha", name: "Комикс" },
  { id: "russo", name: "Заголовок" },
  { id: "caveat", name: "От руки" },
];

const TYPES: { type: BubbleType; name: string; icon: ReactNode }[] = [
  { type: "speech", name: "Реплика", icon: <MessageCircle size={16} /> },
  { type: "thought", name: "Мысль", icon: <Cloud size={16} /> },
  { type: "caption", name: "Подпись", icon: <RectangleHorizontal size={16} /> },
  { type: "shout", name: "Крик", icon: <Zap size={16} /> },
];

const TAILS: { id: TailDir; icon: ReactNode; label: string }[] = [
  { id: "top-left", icon: <ArrowUpLeft size={15} />, label: "Вверх-влево" },
  { id: "top", icon: <ArrowUp size={15} />, label: "Вверх" },
  { id: "top-right", icon: <ArrowUpRight size={15} />, label: "Вверх-вправо" },
  { id: "left", icon: <ArrowLeft size={15} />, label: "Влево" },
  { id: "none", icon: <Ban size={15} />, label: "Без хвоста" },
  { id: "right", icon: <ArrowRight size={15} />, label: "Вправо" },
  { id: "bottom-left", icon: <ArrowDownLeft size={15} />, label: "Вниз-влево" },
  { id: "bottom", icon: <ArrowDown size={15} />, label: "Вниз" },
  { id: "bottom-right", icon: <ArrowDownRight size={15} />, label: "Вниз-вправо" },
];

interface Props {
  bubble: Bubble;
  onUpdate: (patch: Partial<Bubble>) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  /** autofocus the textarea (used by the mobile sheet) */
  autoFocus?: boolean;
}

export default function BubbleControls({ bubble: b, onUpdate, onDuplicate, onDelete, autoFocus }: Props) {
  const up = onUpdate;

  return (
    <div className="anim-pop-in">
      <textarea
        value={b.text}
        onChange={(e) => up({ text: e.target.value })}
        rows={3}
        autoFocus={autoFocus}
        placeholder="Текст надписи…"
        className="mb-3.5 w-full resize-y rounded-xl border-2 border-ink bg-white px-3 py-2.5 text-[16px] font-semibold outline-none transition placeholder:text-ink/35 focus:shadow-comic-sm"
        style={{ fontFamily: FONT_FAMILY[b.font], fontSize: b.font === "caveat" ? 20 : 16 }}
      />

      <div className="mb-1.5 text-[13px] font-bold">Тип облачка</div>
      <div className="mb-4 grid grid-cols-4 gap-1.5">
        {TYPES.map((t) => (
          <button
            key={t.type}
            onClick={() => up({ type: t.type })}
            className={cn(
              "flex flex-col items-center gap-0.5 rounded-lg border-2 border-ink px-1 py-2 text-[10px] font-bold transition active:translate-y-0.5",
              b.type === t.type ? "bg-ink text-pop-yellow" : "bg-white shadow-comic-sm hover:-translate-y-px"
            )}
          >
            {t.icon}
            {t.name}
          </button>
        ))}
      </div>

      <div className="mb-1.5 text-[13px] font-bold">Шрифт</div>
      <div className="mb-4 grid grid-cols-3 gap-1.5">
        {FONTS.map((f) => (
          <button
            key={f.id}
            onClick={() => up({ font: f.id })}
            className={cn(
              "rounded-lg border-2 border-ink px-1 py-2 transition active:translate-y-0.5",
              b.font === f.id ? "bg-ink text-pop-yellow" : "bg-white shadow-comic-sm hover:-translate-y-px"
            )}
          >
            <span className="block text-[17px] leading-tight" style={{ fontFamily: FONT_FAMILY[f.id] }}>
              Привет!
            </span>
            <span className="block text-[10px] font-bold opacity-70">{f.name}</span>
          </button>
        ))}
      </div>

      <SliderRow
        label="Размер текста"
        value={b.fontSize}
        min={1.6}
        max={7}
        step={0.1}
        fmt={(v) => v.toFixed(1)}
        onChange={(v) => up({ fontSize: v })}
      />
      <SliderRow
        label="Ширина облачка"
        value={b.w}
        min={16}
        max={96}
        step={1}
        fmt={(v) => `${Math.round(v)}%`}
        onChange={(v) => up({ w: v })}
      />

      <div className="mt-4">
        <ColorRow label="Фон облачка" value={b.bg} onChange={(v) => up({ bg: v })} />
        <ColorRow label="Цвет текста" value={b.color} onChange={(v) => up({ color: v })} />
      </div>

      {(b.type === "speech" || b.type === "thought") && (
        <div className="mt-4">
          <div className="mb-1.5 text-[13px] font-bold">
            {b.type === "speech" ? "Хвост облачка" : "Пузырьки к герою"}
          </div>
          <div className="grid w-[140px] grid-cols-3 gap-1.5">
            {TAILS.map((t) => (
              <button
                key={t.id}
                title={t.label}
                aria-label={t.label}
                onClick={() => up({ tail: t.id })}
                className={cn(
                  "flex h-10 items-center justify-center rounded-lg border-2 border-ink transition active:translate-y-0.5 sm:h-9",
                  b.tail === t.id ? "bg-pop-blue text-white" : "bg-white shadow-comic-sm hover:-translate-y-px"
                )}
              >
                {t.icon}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mt-5 flex gap-1.5">
        <button onClick={onDuplicate} className="btn btn-tertiary btn-md flex-1">
          <Copy size={15} /> Дублировать
        </button>
        <button onClick={onDelete} className="btn btn-primary btn-md flex-1">
          <Trash2 size={15} /> Удалить
        </button>
      </div>
    </div>
  );
}
