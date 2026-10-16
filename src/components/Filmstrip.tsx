import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, GripVertical, Plus, X } from "lucide-react";
import type { Panel } from "../lib/types";
import { cn } from "../utils/cn";

interface Props {
  panels: Panel[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onReorder: (from: number, to: number) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
}

/** HTML5 drag-n-drop only makes sense with a mouse; on touch it blocks scrolling. */
function useCanDrag() {
  const [can, setCan] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    const apply = () => setCan(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);
  return can;
}

export default function Filmstrip({ panels, selectedId, onSelect, onReorder, onDelete, onAdd }: Props) {
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const canDrag = useCanDrag();

  return (
    <div className="scroll-comic flex gap-2.5 overflow-x-auto pb-1.5 pt-0.5">
      {panels.map((panel, i) => {
        const selected = panel.id === selectedId;
        return (
          <div
            key={panel.id}
            draggable={canDrag}
            onDragStart={(e) => {
              setDragIdx(i);
              e.dataTransfer.effectAllowed = "move";
            }}
            onDragEnter={() => {
              if (dragIdx !== null && dragIdx !== i) {
                onReorder(dragIdx, i);
                setDragIdx(i);
              }
            }}
            onDragOver={(e) => e.preventDefault()}
            onDragEnd={() => setDragIdx(null)}
            className={cn(
              "group relative w-[86px] shrink-0 cursor-grab select-none transition-transform active:cursor-grabbing",
              dragIdx === i && "rotate-2 scale-105 opacity-80"
            )}
          >
            <button
              onClick={() => onSelect(panel.id)}
              className={cn(
                "block h-[86px] w-[86px] overflow-hidden rounded-xl border-[3px] bg-white",
                selected ? "border-pop-blue shadow-comic-blue" : "border-ink shadow-comic-sm"
              )}
              aria-label={`Выбрать кадр ${i + 1}`}
            >
              <img src={panel.src} alt={`Кадр ${i + 1}`} className="h-full w-full object-cover" draggable={false} />
            </button>

            <span
              className={cn(
                "pointer-events-none absolute -left-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-lg border-2 border-ink font-display text-xs text-white",
                selected ? "bg-pop-blue" : "bg-ink"
              )}
            >
              {i + 1}
            </span>

            {canDrag && (
              <GripVertical
                size={16}
                className="pointer-events-none absolute bottom-7 right-0.5 text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.9)]"
              />
            )}

             <button
               aria-label="Удалить кадр"
               onClick={() => onDelete(panel.id)}
               className="btn btn-primary btn-icon absolute -right-1.5 -top-1.5 opacity-0 transition group-hover:opacity-100 max-lg:opacity-100"
             >
               <X size={12} strokeWidth={3.5} />
             </button>

             <div className="mt-1.5 flex justify-center gap-1">
               <button
                 aria-label="Левее"
                 disabled={i === 0}
                 onClick={() => onReorder(i, i - 1)}
                 className="btn btn-tertiary btn-icon disabled:opacity-30"
               >
                 <ArrowLeft size={13} strokeWidth={3} />
               </button>
               <button
                 aria-label="Правее"
                 disabled={i === panels.length - 1}
                 onClick={() => onReorder(i, i + 1)}
                 className="btn btn-tertiary btn-icon disabled:opacity-30"
               >
                 <ArrowRight size={13} strokeWidth={3} />
               </button>
             </div>
          </div>
        );
      })}

       {panels.length < 4 && (
         <button
           onClick={onAdd}
           className="btn btn-tertiary btn-md flex-col h-[86px] w-[86px] border-dashed border-ink/50 bg-white/50 text-ink/60 hover:border-ink hover:bg-white hover:text-ink"
         >
           <Plus size={22} strokeWidth={3} />
           <span className="text-[11px] leading-none">кадр</span>
         </button>
       )}
    </div>
  );
}
