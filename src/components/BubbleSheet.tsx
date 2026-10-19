import { useEffect, useRef, useState } from "react";
import { Check, X } from "lucide-react";
import BubbleControls from "./BubbleControls";
import type { Bubble } from "../lib/types";

interface Props {
  bubble: Bubble;
  panelIndex: number;
  onUpdate: (patch: Partial<Bubble>) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onClose: () => void;
}

/**
 * Mobile bottom sheet for editing a bubble.
 * Much easier than the tiny inline textarea on a phone: big text field,
 * thumb-friendly controls, swipe down to dismiss.
 */
export default function BubbleSheet({
  bubble,
  panelIndex,
  onUpdate,
  onDuplicate,
  onDelete,
  onClose,
}: Props) {
  const [dy, setDy] = useState(0);
  const startY = useRef<number | null>(null);
  const dragging = useRef(false);

  /* lock page scroll while open */
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  /* close on Escape */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const endDrag = () => {
    if (dy > 90) onClose();
    setDy(0);
    startY.current = null;
    dragging.current = false;
  };

  return (
    <div className="fixed inset-0 z-[86] flex items-end justify-center lg:hidden">
      {/* backdrop */}
      <div className="anim-fade absolute inset-0 bg-ink/55 backdrop-blur-[2px]" onClick={onClose} />

      {/* sheet */}
      <div
        className="anim-sheet relative flex max-h-[88dvh] w-full max-w-[560px] flex-col rounded-t-3xl border-t-[3px] border-ink bg-paper shadow-comic-lg"
        style={{ transform: dy ? `translateY(${dy}px)` : undefined, transition: dragging.current ? "none" : "transform 0.2s ease" }}
      >
        {/* drag handle */}
        <div
          className="touch-drag flex cursor-grab flex-col items-center pt-2.5 active:cursor-grabbing"
          onPointerDown={(e) => {
            startY.current = e.clientY;
            dragging.current = true;
          }}
          onPointerMove={(e) => {
            if (startY.current === null) return;
            setDy(Math.max(0, e.clientY - startY.current));
          }}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
        >
          <span className="h-1.5 w-12 rounded-full bg-ink/25" />
        </div>

        {/* header */}
        <div className="flex items-center justify-between gap-2 px-4 pb-2 pt-1.5">
          <h2 className="font-display text-[15px] uppercase">
            Надпись
            <span className="ml-1.5 rounded-md border-2 border-ink bg-pop-yellow px-1.5 py-0.5 font-display text-[11px]">
              кадр {panelIndex + 1}
            </span>
          </h2>
          <button onClick={onClose} aria-label="Закрыть" className="btn btn-tertiary btn-icon">
            <X size={18} strokeWidth={3} />
          </button>
        </div>

        {/* body */}
        <div className="scroll-comic flex-1 overflow-y-auto px-4 pb-4">
          <BubbleControls
            key={bubble.id}
            bubble={bubble}
            onUpdate={onUpdate}
            onDuplicate={() => {
              onDuplicate();
              onClose();
            }}
            onDelete={() => {
              onDelete();
              onClose();
            }}
          />
        </div>

        {/* footer */}
        <div
          className="border-t-[3px] border-ink bg-white px-4 pt-2.5"
          style={{ paddingBottom: "max(0.625rem, env(safe-area-inset-bottom))" }}
        >
          <button onClick={onClose} className="btn btn-primary btn-lg btn-full">
            <Check size={20} strokeWidth={3} />
            Готово
          </button>
        </div>
      </div>
    </div>
  );
}
