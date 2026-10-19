import type { ReactNode } from "react";
import { BUBBLE_COLORS } from "../lib/types";
import { cn } from "../utils/cn";

/* Shared, reused by the desktop inspector and the mobile bubble sheet. */

export function Section({
  title,
  children,
  right,
}: {
  title: string;
  children: ReactNode;
  right?: ReactNode;
}) {
  return (
    <section className="border-b-2 border-dashed border-ink/15 px-3.5 py-3.5 last:border-b-0 sm:px-4 sm:py-4">
      <div className="mb-2.5 flex items-center justify-between gap-2 sm:mb-3">
        <h3 className="font-display text-[13px] uppercase tracking-wide">{title}</h3>
        {right}
      </div>
      {children}
    </section>
  );
}

export function Chip({
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

export function SliderRow({
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
    <label className="mb-3.5 block last:mb-0">
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

export function ColorRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="mb-3.5 last:mb-0">
      <div className="mb-1.5 text-[13px] font-bold">{label}</div>
      <div className="flex flex-wrap items-center gap-1.5">
        {BUBBLE_COLORS.map((c) => (
          <button
            key={c}
            aria-label={c}
            onClick={() => onChange(c)}
            className={cn(
              "h-9 w-9 rounded-lg border-2 transition sm:h-8 sm:w-8",
              value.toLowerCase() === c.toLowerCase()
                ? "scale-110 border-pop-blue shadow-comic-blue"
                : "border-ink hover:-translate-y-0.5"
            )}
            style={{ background: c }}
          />
        ))}
        <input
          type="color"
          className="color-comic h-9 w-10 sm:h-8"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-label="Свой цвет"
        />
      </div>
    </div>
  );
}
