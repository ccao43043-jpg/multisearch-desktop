export type PageId = "search" | "history" | "favorites" | "settings";

export type EngineId =
  | "baidu"
  | "bing"
  | "google"
  | "sogou"
  | "so360"
  | "duckduckgo";

export interface EngineDef {
  id: EngineId;
  name: string;
  /** 用于生成搜索 URL 的模板，q 为编码后的关键词 */
  buildUrl: (q: string) => string;
}

export interface SearchEntry {
  id: string;
  name: string;
  url: string;
}

/** 聚合搜索单条结果 */
export interface SearchResultItem {
  id: string;
  title: string;
  url: string;
  snippet: string;
  source: string;
  engineId: string;
  /** result | portal | error */
  kind: "result" | "portal" | "error" | string;
}

export interface EngineStatus {
  engineId: string;
  name: string;
  ok: boolean;
  message: string;
  count: number;
}

export interface AggregateResponse {
  query: string;
  results: SearchResultItem[];
  statuses: EngineStatus[];
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
  /** 引擎开关 */
  engines: Record<EngineId, boolean>;
  /** 引擎展示/请求顺序 */
  engineOrder: EngineId[];
  /** 可选 Azure Bing Web Search API Key */
  bingApiKey: string;
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
    id: "sogou",
    name: "搜狗",
    buildUrl: (q) => `https://www.sogou.com/web?query=${q}`,
  },
  {
    id: "so360",
    name: "360搜索",
    buildUrl: (q) => `https://www.so.com/s?q=${q}`,
  },
  {
    id: "duckduckgo",
    name: "DuckDuckGo",
    buildUrl: (q) => `https://duckduckgo.com/?q=${q}`,
  },
];

export const DEFAULT_ENGINE_ORDER: EngineId[] = [
  "baidu",
  "bing",
  "google",
  "sogou",
  "so360",
  "duckduckgo",
];

export const DEFAULT_SETTINGS: AppSettings = {
  engines: {
    baidu: true,
    bing: true,
    google: true,
    sogou: false,
    so360: false,
    duckduckgo: true,
  },
  engineOrder: [...DEFAULT_ENGINE_ORDER],
  bingApiKey: "",
};
