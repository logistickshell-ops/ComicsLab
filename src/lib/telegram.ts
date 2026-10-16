/* Telegram Mini App bridge — safely no-ops outside Telegram. */

interface TgWebApp {
  ready: () => void;
  expand: () => void;
  setHeaderColor?: (color: string) => void;
  setBackgroundColor?: (color: string) => void;
  colorScheme?: string;
  HapticFeedback?: {
    impactOccurred: (style: string) => void;
    notificationOccurred: (type: string) => void;
    selectionChanged: () => void;
  };
  MainButton?: {
    setText: (t: string) => void;
    show: () => void;
    hide: () => void;
    onClick: (cb: () => void) => void;
    offClick: (cb: () => void) => void;
    showProgress?: (leave?: boolean) => void;
    hideProgress?: () => void;
  };
}

export const tg: TgWebApp | null =
  typeof window !== "undefined"
    ? ((window as unknown as { Telegram?: { WebApp?: TgWebApp } }).Telegram?.WebApp ?? null)
    : null;

export const isTelegram = !!tg && !!(tg as unknown as { initData?: string }).initData;

export function initTelegram() {
  if (!tg) return;
  try {
    tg.ready();
    tg.expand();
    tg.setHeaderColor?.("#FFD400");
    tg.setBackgroundColor?.("#FFD400");
  } catch {
    /* older clients */
  }
}

export function haptic(kind: "light" | "success" | "error" | "select" = "light") {
  try {
    if (!tg?.HapticFeedback) return;
    if (kind === "success") tg.HapticFeedback.notificationOccurred("success");
    else if (kind === "error") tg.HapticFeedback.notificationOccurred("error");
    else if (kind === "select") tg.HapticFeedback.selectionChanged();
    else tg.HapticFeedback.impactOccurred("light");
  } catch {
    /* noop */
  }
}

export function setupMainButton(text: string, onClick: () => void) {
  if (!tg?.MainButton || !isTelegram) return () => {};
  const mb = tg.MainButton;
  try {
    mb.setText(text);
    mb.show();
    mb.onClick(onClick);
  } catch {
    /* noop */
  }
  return () => {
    try {
      mb.offClick(onClick);
      mb.hide();
    } catch {
      /* noop */
    }
  };
}
