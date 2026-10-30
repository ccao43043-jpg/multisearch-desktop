import { invoke } from "@tauri-apps/api/core";
import { openUrl } from "@tauri-apps/plugin-opener";
import {
  AggregateResponse,
  ENGINE_CATALOG,
  EngineId,
  SearchEntry,
  SearchResultItem,
} from "./types";

function encodeQuery(q: string): string {
  return encodeURIComponent(q.trim());
}

/** 并行聚合多引擎结果。桌面端走 Rust；浏览器预览降级为入口列表。 */
export async function aggregateSearch(
  query: string,
  engines: EngineId[],
  bingApiKey?: string,
): Promise<AggregateResponse> {
  const q = query.trim();
  if (!q || engines.length === 0) {
    return { query: q, results: [], statuses: [] };
  }

  try {
    const resp = await invoke<AggregateResponse>("aggregate_search", {
      query: q,
      engines,
      options: {
        bingApiKey: bingApiKey?.trim() ? bingApiKey.trim() : null,
      },
    });
    return resp;
  } catch {
    // 浏览器预览 / invoke 不可用：生成可点击的官方入口
    const encoded = encodeQuery(q);
    const results: SearchResultItem[] = ENGINE_CATALOG.filter((e) =>
      engines.includes(e.id),
    ).map((e) => ({
      id: `${e.id}-portal`,
      title: `在${e.name}中搜索「${q}」`,
      url: e.buildUrl(encoded),
      snippet:
        "当前为浏览器预览模式，无法发起原生聚合请求。点击在新标签打开官方结果页。",
      source: e.name,
      engineId: e.id,
      kind: "portal",
    }));
    return {
      query: q,
      results,
      statuses: results.map((r) => ({
        engineId: r.engineId,
        name: r.source,
        ok: false,
        message: "预览降级",
        count: 0,
      })),
    };
  }
}

/** @deprecated 兼容旧入口生成 */
export async function buildSearchEntries(
  query: string,
  engines: EngineId[],
): Promise<SearchEntry[]> {
  const q = query.trim();
  if (!q || engines.length === 0) return [];

  try {
    return await invoke<SearchEntry[]>("build_search_entries", {
      query: q,
      engines,
    });
  } catch {
    const encoded = encodeQuery(q);
    return ENGINE_CATALOG.filter((e) => engines.includes(e.id)).map((e) => ({
      id: e.id,
      name: e.name,
      url: e.buildUrl(encoded),
    }));
  }
}

export async function openInBrowser(url: string): Promise<void> {
  try {
    await openUrl(url);
  } catch {
    window.open(url, "_blank", "noopener,noreferrer");
  }
}
