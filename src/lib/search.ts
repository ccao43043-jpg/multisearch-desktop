import { invoke } from "@tauri-apps/api/core";
import { openUrl } from "@tauri-apps/plugin-opener";
import { ENGINE_CATALOG, EngineId, SearchEntry } from "./types";

function encodeQuery(q: string): string {
  return encodeURIComponent(q.trim());
}

/** 优先走 Rust 命令；在浏览器预览时回退到前端生成。 */
export async function buildSearchEntries(
  query: string,
  engines: EngineId[],
): Promise<SearchEntry[]> {
  const q = query.trim();
  if (!q || engines.length === 0) return [];

  try {
    const entries = await invoke<SearchEntry[]>("build_search_entries", {
      query: q,
      engines,
    });
    return entries;
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
