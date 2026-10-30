import { FormEvent, useEffect, useState } from "react";
import { aggregateSearch, openInBrowser } from "../lib/search";
import { addFavorite, addHistory, enabledEngineIds } from "../lib/storage";
import {
  AppSettings,
  EngineStatus,
  FavoriteItem,
  HistoryItem,
  SearchResultItem,
} from "../lib/types";

interface Props {
  settings: AppSettings;
  initialQuery?: string;
  onHistoryChange: (items: HistoryItem[]) => void;
  onFavoritesChange: (items: FavoriteItem[]) => void;
}

export function SearchPage({
  settings,
  initialQuery,
  onHistoryChange,
  onFavoritesChange,
}: Props) {
  const [query, setQuery] = useState(initialQuery ?? "");
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [statuses, setStatuses] = useState<EngineStatus[]>([]);
  const [searched, setSearched] = useState(false);
  const [busy, setBusy] = useState(false);

  async function doSearch(raw?: string) {
    const q = (raw ?? query).trim();
    if (!q) return;
    setBusy(true);
    setQuery(q);
    try {
      const engines = enabledEngineIds(settings);
      const resp = await aggregateSearch(q, engines, settings.bingApiKey);
      setResults(resp.results);
      setStatuses(resp.statuses);
      setSearched(true);
      onHistoryChange(addHistory(q));
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (initialQuery?.trim()) {
      void doSearch(initialQuery);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    void doSearch();
  }

  function favoriteQuery() {
    const q = query.trim();
    if (!q) return;
    onFavoritesChange(addFavorite({ title: q, query: q }));
  }

  function favoriteResult(item: SearchResultItem) {
    onFavoritesChange(
      addFavorite({
        title: item.title,
        url: item.url,
        query: query.trim(),
      }),
    );
  }

  const hasResults = searched && results.length > 0;
  const emptyEnabled = searched && results.length === 0;
  const okCount = statuses.filter((s) => s.ok).length;

  return (
    <div className="flex h-full flex-col">
      <div
        className={`mx-auto flex w-full max-w-2xl flex-col px-6 transition-[padding] duration-300 ${
          hasResults || emptyEnabled ? "pt-10 pb-4" : "flex-1 justify-center pb-24"
        }`}
      >
        {!hasResults && !emptyEnabled && (
          <h1 className="mb-8 text-center text-2xl font-light tracking-widest text-neutral-300">
            MultiSearch
          </h1>
        )}

        <form onSubmit={onSubmit} className="w-full">
          <div className="flex items-center gap-2 rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-3 focus-within:border-neutral-600">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              className="shrink-0 text-neutral-500"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20l-3.5-3.5" strokeLinecap="round" />
            </svg>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="输入关键词，并行聚合多引擎…"
              className="min-w-0 flex-1 bg-transparent text-base text-neutral-100 placeholder:text-neutral-600"
              autoFocus
            />
            {query && (
              <button
                type="button"
                onClick={favoriteQuery}
                className="shrink-0 rounded px-2 py-1 text-xs text-neutral-500 hover:text-amber-400"
                title="收藏此搜索词"
              >
                收藏
              </button>
            )}
            <button
              type="submit"
              disabled={busy || !query.trim()}
              className="shrink-0 rounded-lg bg-neutral-100 px-3 py-1.5 text-sm font-medium text-black disabled:opacity-30"
            >
              {busy ? "搜索中…" : "搜索"}
            </button>
          </div>
        </form>

        {searched && statuses.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {statuses.map((s) => (
              <span
                key={s.engineId}
                title={s.message}
                className={`rounded-full border px-2 py-0.5 text-[11px] ${
                  s.ok
                    ? "border-neutral-700 text-neutral-400"
                    : "border-neutral-900 text-neutral-600"
                }`}
              >
                {s.name}
                {s.ok ? ` · ${s.count}` : " · 降级"}
              </span>
            ))}
          </div>
        )}
      </div>

      {(hasResults || emptyEnabled) && (
        <div className="mx-auto w-full max-w-2xl flex-1 overflow-y-auto px-6 pb-8">
          {emptyEnabled ? (
            <p className="py-8 text-center text-sm text-neutral-500">
              未启用任何搜索源，请到「设置」中开启。
            </p>
          ) : (
            <ul className="divide-y divide-neutral-900">
              {results.map((item) => (
                <li key={item.id} className="group py-3.5">
                  <div className="flex items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        <span className="rounded bg-neutral-900 px-1.5 py-0.5 text-[11px] text-neutral-400">
                          {item.source}
                        </span>
                        {item.kind === "portal" && (
                          <span className="text-[11px] text-neutral-600">官方入口</span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => void openInBrowser(item.url)}
                        className="text-left text-sm font-medium text-neutral-100 hover:text-white hover:underline"
                      >
                        {item.title}
                      </button>
                      {item.snippet && (
                        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-neutral-500">
                          {item.snippet}
                        </p>
                      )}
                      <div className="mt-1 truncate text-[11px] text-neutral-700">
                        {item.url}
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-col gap-1 pt-0.5">
                      <button
                        type="button"
                        onClick={() => void openInBrowser(item.url)}
                        className="rounded-lg border border-neutral-800 px-3 py-1.5 text-xs text-neutral-300 hover:border-neutral-600 hover:text-white"
                      >
                        打开
                      </button>
                      <button
                        type="button"
                        onClick={() => favoriteResult(item)}
                        className="rounded px-2 py-1 text-xs text-neutral-600 opacity-0 transition-opacity hover:text-amber-400 group-hover:opacity-100"
                        title="收藏此结果"
                      >
                        收藏
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-6 text-center text-xs text-neutral-700">
            已聚合 {results.length} 条
            {statuses.length > 0 ? ` · ${okCount}/${statuses.length} 引擎解析成功` : ""}
            。部分引擎受反爬限制时会降级为官方结果入口。
          </p>
        </div>
      )}
    </div>
  );
}
