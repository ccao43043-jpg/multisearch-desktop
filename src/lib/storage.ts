import {
  AppSettings,
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

export function loadSettings(): AppSettings {
  const saved = readJson<Partial<AppSettings>>(KEYS.settings, {});
  return {
    engines: { ...DEFAULT_SETTINGS.engines, ...(saved.engines ?? {}) },
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
  // 去重：同 URL 或同标题+查询
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

export function enabledEngineIds(settings: AppSettings): EngineId[] {
  return (Object.keys(settings.engines) as EngineId[]).filter(
    (id) => settings.engines[id],
  );
}
