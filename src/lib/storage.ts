import {
  AppSettings,
  DEFAULT_ENGINE_ORDER,
  DEFAULT_SETTINGS,
  EngineId,
  FavoriteItem,
  HistoryItem,
} from "./types";

const KEYS = {
  settings: "ms.settings",
  history: "ms.history",
  favorites: "ms.favorites",
} as const;

const MAX_HISTORY = 100;

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}

function normalizeOrder(order: EngineId[] | undefined): EngineId[] {
  const seen = new Set<EngineId>();
  const next: EngineId[] = [];
  for (const id of order ?? []) {
    if (DEFAULT_ENGINE_ORDER.includes(id) && !seen.has(id)) {
      seen.add(id);
      next.push(id);
    }
  }
  for (const id of DEFAULT_ENGINE_ORDER) {
    if (!seen.has(id)) next.push(id);
  }
  return next;
}

export function loadSettings(): AppSettings {
  const saved = readJson<Partial<AppSettings>>(KEYS.settings, {});
  return {
    engines: { ...DEFAULT_SETTINGS.engines, ...(saved.engines ?? {}) },
    engineOrder: normalizeOrder(saved.engineOrder),
    bingApiKey:
      typeof saved.bingApiKey === "string"
        ? saved.bingApiKey
        : DEFAULT_SETTINGS.bingApiKey,
  };
}

export function saveSettings(settings: AppSettings) {
  writeJson(KEYS.settings, settings);
}

export function loadHistory(): HistoryItem[] {
  return readJson<HistoryItem[]>(KEYS.history, []);
}

export function addHistory(query: string): HistoryItem[] {
  const q = query.trim();
  if (!q) return loadHistory();
  const now = Date.now();
  const prev = loadHistory().filter(
    (h) => h.query.toLowerCase() !== q.toLowerCase(),
  );
  const next: HistoryItem[] = [
    { id: `${now}-${Math.random().toString(36).slice(2, 8)}`, query: q, at: now },
    ...prev,
  ].slice(0, MAX_HISTORY);
  writeJson(KEYS.history, next);
  return next;
}

export function removeHistory(id: string): HistoryItem[] {
  const next = loadHistory().filter((h) => h.id !== id);
  writeJson(KEYS.history, next);
  return next;
}

export function clearHistory(): HistoryItem[] {
  writeJson(KEYS.history, []);
  return [];
}

export function loadFavorites(): FavoriteItem[] {
  return readJson<FavoriteItem[]>(KEYS.favorites, []);
}

export function addFavorite(item: Omit<FavoriteItem, "id" | "at">): FavoriteItem[] {
  const now = Date.now();
  const prev = loadFavorites();
  const exists = prev.some(
    (f) =>
      (item.url && f.url === item.url) ||
      (!item.url && f.title === item.title && f.query === item.query),
  );
  if (exists) return prev;
  const next: FavoriteItem[] = [
    {
      id: `${now}-${Math.random().toString(36).slice(2, 8)}`,
      at: now,
      ...item,
    },
    ...prev,
  ];
  writeJson(KEYS.favorites, next);
  return next;
}

export function removeFavorite(id: string): FavoriteItem[] {
  const next = loadFavorites().filter((f) => f.id !== id);
  writeJson(KEYS.favorites, next);
  return next;
}

/** 按设置中的顺序返回已启用引擎 */
export function enabledEngineIds(settings: AppSettings): EngineId[] {
  const order = normalizeOrder(settings.engineOrder);
  return order.filter((id) => settings.engines[id]);
}
