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
  Download,
  Images,
  MessageCircle,
  Palette,
  RectangleHorizontal,
  RefreshCcw,
  Replace,
  RotateCcw,
  Share2,
  Sparkles,
  Trash2,
  Type,
  Upload,
  Zap,
} from "lucide-react";
import Filmstrip from "./Filmstrip";
import {
  BUBBLE_COLORS,
  FILTERS,
  FORMATS,
  LAYOUTS,
  PAGE_BGS,
  type Bubble,
  type BubbleFont,
  type BubbleType,
  type Panel,
  type TailDir,
} from "../lib/types";
import { FONT_FAMILY } from "../lib/geometry";
import { cn } from "../utils/cn";

export type Tab = "frames" | "text" | "style";

export interface InspectorProps {
  tab: Tab;
  setTab: (t: Tab) => void;
  panels: Panel[];
  bubbles: Bubble[];
  layoutIdx: number;
  setLayoutIdx: (i: number) => void;
  formatId: string;
  setFormatId: (id: string) => void;
  bg: string;
  setBg: (v: string) => void;
  title: string;
  setTitle: (v: string) => void;
  showTitle: boolean;
  setShowTitle: (v: boolean) => void;
  exportSize: number;
  setExportSize: (v: number) => void;
  selectedPanelId: string | null;
  selectedBubbleId: string | null;
  onSelectPanel: (id: string) => void;
  onSelectBubble: (id: string) => void;
  onReorder: (from: number, to: number) => void;
  onDeletePanel: (id: string) => void;
  onUpdatePanel: (id: string, patch: Partial<Panel>) => void;
  onAddPhotos: () => void;
  onReplacePhoto: (id: string) => void;
  onAddBubble: (type: BubbleType) => void;
  onUpdateBubble: (id: string, patch: Partial<Bubble>) => void;
  onDeleteBubble: (id: string) => void;
  onDuplicateBubble: (id: string) => void;
  onExport: () => void;
  onShare: () => void;
  onReset: () => void;
  onDemo: () => void;
  exporting: boolean;
}

/* ---------------- shared bits ---------------- */

function Section({ title, children, right }: { title: string; children: ReactNode; right?: ReactNode }) {
  return (
    <section className="border-b-2 border-dashed border-ink/15 px-4 py-4 last:border-b-0">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="font-display text-[13px] uppercase tracking-wide">{title}</h3>
        {right}
      </div>
      {children}
    </section>
  );
}

function Chip({
  active,
  onClick,
  children,
  className,
}: {
  active?: boolean;
  onClick: () => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-lg border-2 border-ink px-2 py-1.5 text-[12px] font-bold leading-none transition active:translate-y-0.5 sm:px-2.5 sm:text-[13px]",
        active ? "bg-ink text-pop-yellow shadow-none" : "bg-white shadow-comic-sm hover:-translate-y-px",
        className
      )}
    >
      {children}
    </button>
  );
}

function SliderRow({
  label,
  value,
  min,
  max,
  step,
  fmt,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  fmt: (v: number) => string;
  onChange: (v: number) => void;
}) {
  return (
    <label className="mb-3 block last:mb-0">
      <span className="mb-1.5 flex items-center justify-between text-[13px] font-bold">
        {label}
        <span className="rounded-md border-2 border-ink bg-pop-yellow px-1.5 py-0.5 font-display text-[11px]">
          {fmt(value)}
        </span>
      </span>
      <input
        type="range"
        className="range-comic w-full"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
      />
    </label>
  );
}

function ColorRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="mb-3 last:mb-0">
      <div className="mb-1.5 text-[13px] font-bold">{label}</div>
      <div className="flex flex-wrap items-center gap-1.5">
        {BUBBLE_COLORS.map((c) => (
          <button
            key={c}
            aria-label={c}
            onClick={() => onChange(c)}
            className={cn(
              "h-8 w-8 rounded-lg border-2 transition",
              value.toLowerCase() === c.toLowerCase()
                ? "scale-110 border-pop-blue shadow-comic-blue"
                : "border-ink hover:-translate-y-0.5"
            )}
            style={{ background: c }}
          />
        ))}
        <input
          type="color"
          className="color-comic h-8 w-10"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-label="Свой цвет"
        />
      </div>
    </div>
  );
}

/* ---------------- main ---------------- */

export default function Inspector(p: InspectorProps) {
  const selectedPanel = p.panels.find((x) => x.id === p.selectedPanelId) ?? null;
  const selectedBubble = p.bubbles.find((x) => x.id === p.selectedBubbleId) ?? null;
  const layouts = LAYOUTS[p.panels.length] ?? [];

  const tabs: { id: Tab; name: string; icon: ReactNode }[] = [
    { id: "frames", name: "Кадры", icon: <Images size={16} /> },
    { id: "text", name: "Надписи", icon: <Type size={16} /> },
    { id: "style", name: "Стиль", icon: <Palette size={16} /> },
  ];

  return (
    <div className="overflow-hidden rounded-3xl border-[3px] border-ink bg-paper shadow-comic-lg">
      {/* tabs */}
      <div className="grid grid-cols-3 border-b-[3px] border-ink bg-white">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => p.setTab(t.id)}
            className={cn(
              "flex items-center justify-center gap-1.5 border-r-2 border-ink/10 px-2 py-3 font-display text-[13px] uppercase transition last:border-r-0",
              p.tab === t.id ? "bg-pop-yellow" : "hover:bg-paper"
            )}
          >
            {t.icon}
            {t.name}
            {t.id === "text" && p.bubbles.length > 0 && (
              <span className="rounded-md border-2 border-ink bg-pop-red px-1 text-[10px] leading-4 text-white">
                {p.bubbles.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ============ FRAMES ============ */}
      {p.tab === "frames" && (
        <div>
          <Section
            title="Раскадровка"
            right={
              <span className="rounded-md border-2 border-ink bg-white px-1.5 py-0.5 font-display text-[11px]">
                {p.panels.length}/4
              </span>
            }
          >
            <Filmstrip
              panels={p.panels}
              selectedId={p.selectedPanelId}
              onSelect={p.onSelectPanel}
              onReorder={p.onReorder}
              onDelete={p.onDeletePanel}
              onAdd={p.onAddPhotos}
            />
            <p className="mt-1 text-[12px] font-medium leading-snug text-ink/55">
              Перетаскивай миниатюры мышкой или двигай стрелками — кадры на листе поменяются местами.
            </p>
             <button
              onClick={p.onAddPhotos}
              disabled={p.panels.length >= 4}
              className="btn btn-cyan btn-lg btn-full mt-3 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Upload size={17} strokeWidth={2.6} />
              {p.panels.length === 0 ? "Загрузить картинки" : "Добавить ещё"}
            </button>
          </Section>

          {p.panels.length > 1 && (
            <Section title="Раскладка кадров">
              <div className="grid grid-cols-4 gap-2">
                {layouts.map((l, i) => (
                  <button
                    key={l.id}
                    onClick={() => p.setLayoutIdx(i)}
                    title={l.name}
                    className={cn(
                      "group rounded-xl border-2 p-1.5 transition",
                      p.layoutIdx === i
                        ? "border-pop-blue bg-blue-50 shadow-comic-blue"
                        : "border-ink bg-white shadow-comic-sm hover:-translate-y-0.5"
                    )}
                  >
                    <span className="relative block aspect-[4/5] w-full overflow-hidden rounded-md border border-ink/20 bg-paper">
                      {l.rects.map((r, ri) => (
                        <span
                          key={ri}
                          className={cn(
                            "absolute border border-white",
                            p.layoutIdx === i ? "bg-pop-blue" : "bg-ink/70 group-hover:bg-ink"
                          )}
                          style={{
                            left: `${r.x * 100}%`,
                            top: `${r.y * 100}%`,
                            width: `${r.w * 100}%`,
                            height: `${r.h * 100}%`,
                          }}
                        />
                      ))}
                    </span>
                    <span className="mt-1 block truncate text-center text-[10px] font-bold leading-tight">
                      {l.name}
                    </span>
                  </button>
                ))}
              </div>
            </Section>
          )}

          <Section title="Выбранный кадр">
            {selectedPanel ? (
              <div>
                <SliderRow
                  label="Масштаб фото"
                  value={selectedPanel.zoom}
                  min={1}
                  max={3}
                  step={0.01}
                  fmt={(v) => `×${v.toFixed(2)}`}
                  onChange={(v) => p.onUpdatePanel(selectedPanel.id, { zoom: v })}
                />
                <div className="mb-1.5 mt-4 text-[13px] font-bold">Фильтр</div>
                <div className="flex flex-wrap gap-1.5">
                  {FILTERS.map((f) => (
                    <Chip
                      key={f.id}
                      active={selectedPanel.filter === f.id}
                      onClick={() => p.onUpdatePanel(selectedPanel.id, { filter: f.id })}
                    >
                      {f.name}
                    </Chip>
                  ))}
                </div>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  <Chip onClick={() => p.onUpdatePanel(selectedPanel.id, { zoom: 1, tx: 0.5, ty: 0.5 })}>
                    <span className="flex items-center gap-1">
                      <RotateCcw size={13} /> По центру
                    </span>
                  </Chip>
                  <Chip onClick={() => p.onReplacePhoto(selectedPanel.id)}>
                    <span className="flex items-center gap-1">
                      <Replace size={13} /> Заменить
                    </span>
                  </Chip>
                  <Chip
                    onClick={() => p.onDeletePanel(selectedPanel.id)}
                    className="!bg-pop-red text-white"
                  >
                    <span className="flex items-center gap-1">
                      <Trash2 size={13} /> Удалить
                    </span>
                  </Chip>
                </div>
                <p className="mt-3 rounded-lg border-2 border-dashed border-ink/25 bg-white/60 p-2 text-[12px] font-medium leading-snug text-ink/60">
                  Совет: зажми фото прямо на листе и двигай — так выберешь лучший кусок кадра.
                </p>
              </div>
            ) : (
              <p className="text-[13px] font-medium text-ink/55">
                Кликни по кадру на листе или по миниатюре выше, чтобы настроить масштаб и фильтр.
              </p>
            )}
          </Section>
        </div>
      )}

      {/* ============ TEXT ============ */}
      {p.tab === "text" && (
        <div>
          <Section title="Добавить надпись">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {(
                  [
                    { type: "speech", name: "Реплика", icon: <MessageCircle size={20} /> },
                    { type: "thought", name: "Мысль", icon: <Cloud size={20} /> },
                    { type: "caption", name: "Подпись", icon: <RectangleHorizontal size={20} /> },
                    { type: "shout", name: "Крик", icon: <Zap size={20} /> },
                  ] as { type: BubbleType; name: string; icon: ReactNode }[]
                ).map((b) => (
                  <button
                    key={b.type}
                    onClick={() => p.onAddBubble(b.type)}
                    disabled={p.panels.length === 0}
                    className="btn btn-tertiary btn-sm flex-col h-auto p-2 disabled:opacity-40"
                  >
                    {b.icon}
                    <span className="text-[11px] mt-1">{b.name}</span>
                  </button>
                ))}
              </div>
            <p className="mt-2.5 text-[12px] font-medium leading-snug text-ink/55">
              Надпись встанет на выбранный кадр. Тяни её мышкой по листу, двойной клик — править текст прямо на месте.
            </p>
          </Section>

          {p.bubbles.length > 0 && (
            <Section title="Все надписи">
              <div className="flex flex-wrap gap-1.5">
                {p.bubbles.map((b) => {
                  const pi = p.panels.findIndex((x) => x.id === b.panelId);
                  return (
                    <button
                      key={b.id}
                      onClick={() => p.onSelectBubble(b.id)}
                      className={cn(
                        "flex max-w-full items-center gap-1.5 rounded-lg border-2 border-ink px-2 py-1 text-[12px] font-bold transition",
                        p.selectedBubbleId === b.id
                          ? "bg-ink text-pop-yellow"
                          : "bg-white shadow-comic-sm hover:-translate-y-px"
                      )}
                    >
                      <span className="flex h-4.5 min-w-4.5 items-center justify-center rounded border border-current px-0.5 font-display text-[10px]">
                        {pi + 1}
                      </span>
                      <span className="max-w-[150px] truncate">{b.text || "…"}</span>
                    </button>
                  );
                })}
              </div>
            </Section>
          )}

          <Section title="Редактировать надпись">
            {selectedBubble ? (
              <BubbleEditor bubble={selectedBubble} p={p} />
            ) : (
              <p className="text-[13px] font-medium text-ink/55">
                Выбери надпись на листе — здесь появятся текст, шрифт, цвета и хвост облачка.
              </p>
            )}
          </Section>
        </div>
      )}

      {/* ============ STYLE ============ */}
      {p.tab === "style" && (
        <div>
          <Section title="Формат листа">
            <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-5">
              {FORMATS.map((f) => (
                <button
                  key={f.id}
                  onClick={() => p.setFormatId(f.id)}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-xl border-2 px-1 py-2 transition",
                    p.formatId === f.id
                      ? "border-pop-blue bg-blue-50 shadow-comic-blue"
                      : "border-ink bg-white shadow-comic-sm hover:-translate-y-0.5"
                  )}
                >
                  <span
                    className={cn(
                      "block rounded-[3px] border-2",
                      p.formatId === f.id ? "border-pop-blue bg-pop-blue/80" : "border-ink bg-ink/70"
                    )}
                    style={{
                      width: f.ratio >= 1 ? 22 : Math.max(8, 22 * f.ratio),
                      height: f.ratio >= 1 ? Math.max(8, 22 / f.ratio) : 22,
                    }}
                  />
                  <span className="font-display text-[10px] leading-none">{f.label}</span>
                  <span className="text-[9px] font-bold leading-none text-ink/50 hidden sm:block">{f.name}</span>
                </button>
              ))}
            </div>
          </Section>

          <Section title="Заголовок комикса">
            <div className="flex items-center gap-2">
              <button
                role="switch"
                aria-checked={p.showTitle}
                onClick={() => p.setShowTitle(!p.showTitle)}
                className={cn(
                  "relative h-8 w-14 shrink-0 rounded-full border-[3px] border-ink transition",
                  p.showTitle ? "bg-pop-yellow" : "bg-white"
                )}
              >
                <span
                  className={cn(
                    "absolute top-1/2 h-5 w-5 -translate-y-1/2 rounded-full border-2 border-ink bg-white transition-all",
                    p.showTitle ? "left-[26px] bg-ink" : "left-[3px]"
                  )}
                />
              </button>
              <input
                value={p.title}
                onChange={(e) => p.setTitle(e.target.value.slice(0, 42))}
                disabled={!p.showTitle}
                placeholder="Название истории…"
                className="min-w-0 flex-1 rounded-xl border-2 border-ink bg-white px-3 py-2 font-display text-sm uppercase outline-none transition placeholder:font-ui placeholder:normal-case placeholder:text-ink/35 focus:shadow-comic-sm disabled:opacity-40"
              />
            </div>
          </Section>

          <Section title="Фон листа">
            <div className="flex flex-wrap items-center gap-1.5">
              {PAGE_BGS.map((b) => (
                <button
                  key={b.id}
                  title={b.name}
                  onClick={() => p.setBg(b.value)}
                  className={cn(
                    "h-10 w-10 rounded-xl border-2 transition",
                    p.bg.toLowerCase() === b.value.toLowerCase()
                      ? "scale-110 border-pop-blue shadow-comic-blue"
                      : "border-ink hover:-translate-y-0.5"
                  )}
                  style={{ background: b.value }}
                />
              ))}
              <input
                type="color"
                className="color-comic h-10 w-12"
                value={p.bg}
                onChange={(e) => p.setBg(e.target.value)}
                aria-label="Свой фон"
              />
            </div>
          </Section>

          <Section title="Скачать комикс">
            <div className="mb-2 text-[13px] font-bold">Размер картинки</div>
            <div className="mb-3 flex gap-1.5">
              {[1080, 1600, 2048].map((s) => (
                <Chip key={s} active={p.exportSize === s} onClick={() => p.setExportSize(s)} className="flex-1">
                  {s}px
                </Chip>
              ))}
            </div>
              <button
                onClick={p.onExport}
                disabled={p.panels.length === 0 || p.exporting}
                className="btn btn-primary btn-lg btn-full disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Download size={19} strokeWidth={2.6} />
                {p.exporting ? "Собираем…" : "Скачать PNG"}
              </button>
              <button
                onClick={p.onShare}
                disabled={p.panels.length === 0 || p.exporting}
                className="btn btn-tertiary btn-md btn-full mt-2 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Share2 size={16} strokeWidth={2.6} />
                Поделиться
              </button>
          </Section>

          <Section title="Проект">
            <div className="flex gap-1.5">
              <Chip onClick={p.onDemo} className="flex-1">
                <span className="flex items-center justify-center gap-1">
                  <Sparkles size={13} /> Демо-история
                </span>
              </Chip>
              <Chip onClick={p.onReset} className="flex-1 !bg-pop-red text-white">
                <span className="flex items-center justify-center gap-1">
                  <RefreshCcw size={13} /> Сбросить всё
                </span>
              </Chip>
            </div>
          </Section>
        </div>
      )}
    </div>
  );
}

/* ---------------- bubble editor ---------------- */

const FONTS: { id: BubbleFont; name: string }[] = [
  { id: "neucha", name: "Комикс" },
  { id: "russo", name: "Заголовок" },
  { id: "caveat", name: "От руки" },
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

function BubbleEditor({ bubble: b, p }: { bubble: Bubble; p: InspectorProps }) {
  const up = (patch: Partial<Bubble>) => p.onUpdateBubble(b.id, patch);
  return (
    <div className="anim-pop-in">
      <textarea
        value={b.text}
        onChange={(e) => up({ text: e.target.value })}
        rows={2}
        placeholder="Текст надписи…"
        className="mb-3 w-full resize-y rounded-xl border-2 border-ink bg-white px-3 py-2 text-[15px] font-semibold outline-none transition placeholder:text-ink/35 focus:shadow-comic-sm"
        style={{ fontFamily: FONT_FAMILY[b.font], fontSize: b.font === "caveat" ? 19 : 15 }}
      />

      <div className="mb-1.5 text-[13px] font-bold">Тип облачка</div>
      <div className="mb-4 grid grid-cols-4 gap-1.5">
        {(
          [
            { type: "speech", name: "Реплика", icon: <MessageCircle size={16} /> },
            { type: "thought", name: "Мысль", icon: <Cloud size={16} /> },
            { type: "caption", name: "Подпись", icon: <RectangleHorizontal size={16} /> },
            { type: "shout", name: "Крик", icon: <Zap size={16} /> },
          ] as { type: BubbleType; name: string; icon: ReactNode }[]
        ).map((t) => (
          <button
            key={t.type}
            onClick={() => up({ type: t.type })}
            className={cn(
              "flex flex-col items-center gap-0.5 rounded-lg border-2 border-ink px-1 py-1.5 text-[10px] font-bold transition",
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
               "btn btn-tertiary btn-sm flex-col h-auto p-1",
               b.font === f.id ? "bg-ink text-pop-yellow border-pop-yellow" : ""
             )}
           >
             <span className="block text-base leading-tight" style={{ fontFamily: FONT_FAMILY[f.id] }}>
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
           <div className="grid w-[132px] grid-cols-3 gap-1">
             {TAILS.map((t) => (
               <button
                 key={t.id}
                 title={t.label}
                 onClick={() => up({ tail: t.id })}
                 className={cn(
                   "btn btn-icon",
                   b.tail === t.id ? "bg-pop-blue text-white border-pop-blue" : "btn-tertiary"
                 )}
               >
                 {t.icon}
               </button>
             ))}
           </div>
        </div>
      )}

       <div className="mt-4 flex gap-1.5">
         <button onClick={() => p.onDuplicateBubble(b.id)} className="btn btn-tertiary btn-md flex-1">
           <Copy size={13} /> <span className="hidden sm:inline">Дублировать</span>
         </button>
         <button onClick={() => p.onDeleteBubble(b.id)} className="btn btn-primary btn-md flex-1">
           <Trash2 size={13} /> <span className="hidden sm:inline">Удалить</span>
         </button>
       </div>
    </div>
  );
}
