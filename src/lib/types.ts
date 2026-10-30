export type PageId = "search" | "history" | "favorites" | "settings";

export type EngineId = "baidu" | "bing" | "google" | "duckduckgo" | "github";

export interface EngineDef {
  id: EngineId;
  name: string;
  /** 用于生成搜索 URL 的模板，{q} 为编码后的关键词 */
  buildUrl: (q: string) => string;
}

export interface SearchEntry {
  id: string;
  name: string;
  url: string;
}

export interface HistoryItem {
  id: string;
  query: string;
  at: number;
}

export interface FavoriteItem {
  id: string;
  /** 收藏的搜索词，或结果标题 */
  title: string;
  /** 可选：结果 URL */
  url?: string;
  query?: string;
  at: number;
}

export interface AppSettings {
  engines: Record<EngineId, boolean>;
}

export const ENGINE_CATALOG: EngineDef[] = [
  {
    id: "baidu",
    name: "百度",
    buildUrl: (q) => `https://www.baidu.com/s?wd=${q}`,
  },
  {
    id: "bing",
    name: "必应",
    buildUrl: (q) => `https://www.bing.com/search?q=${q}`,
  },
  {
    id: "google",
    name: "Google",
    buildUrl: (q) => `https://www.google.com/search?q=${q}`,
  },
  {
    id: "duckduckgo",
    name: "DuckDuckGo",
    buildUrl: (q) => `https://duckduckgo.com/?q=${q}`,
  },
  {
    id: "github",
    name: "GitHub",
    buildUrl: (q) => `https://github.com/search?q=${q}&type=repositories`,
  },
];

export const DEFAULT_SETTINGS: AppSettings = {
  engines: {
    baidu: true,
    bing: true,
    google: true,
    duckduckgo: false,
    github: false,
  },
};
