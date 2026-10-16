import { Download, Share2, X } from "lucide-react";
import { isTelegram } from "../lib/telegram";

interface Props {
  url: string;
  onClose: () => void;
  onDownload: () => void;
  onShare: () => void;
}

export default function ExportModal({ url, onClose, onDownload, onShare }: Props) {
  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-ink/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="anim-pop-in max-h-full w-full max-w-lg overflow-y-auto rounded-3xl border-[3px] border-ink bg-paper p-4 shadow-comic-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg uppercase">Комикс готов!</h2>
          <button
            onClick={onClose}
            aria-label="Закрыть"
            className="btn btn-tertiary btn-icon"
          >
            <X size={17} strokeWidth={3} />
          </button>
        </div>

        <img
          src={url}
          alt="Готовый комикс"
          className="w-full rounded-xl border-2 border-ink bg-white"
        />

        {isTelegram && (
          <p className="mt-3 rounded-lg border-2 border-dashed border-ink/30 bg-white/70 p-2 text-center text-[13px] font-semibold leading-snug text-ink/70">
            В Telegram удобнее так: зажми картинку пальцем и выбери «Сохранить» — или жми «Поделиться».
          </p>
        )}

        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <button
            onClick={onDownload}
            className="btn btn-primary btn-lg flex-1"
          >
            <Download size={18} strokeWidth={2.6} />
            Скачать PNG
          </button>
          <button
            onClick={onShare}
            className="btn btn-tertiary btn-lg flex-1"
          >
            <Share2 size={17} strokeWidth={2.6} />
            Поделиться
          </button>
        </div>
      </div>
    </div>
  );
}
