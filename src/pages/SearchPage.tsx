import { FormEvent, useEffect, useState } from "react";
import { buildSearchEntries, openInBrowser } from "../lib/search";
import { addFavorite, addHistory, enabledEngineIds } from "../lib/storage";
import { AppSettings, FavoriteItem, HistoryItem, SearchEntry } from "../lib/types";

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
  const [entries, setEntries] = useState<SearchEntry[]>([]);
  const [searched, setSearched] = useState(false);
  const [busy, setBusy] = useState(false);

  async function doSearch(raw?: string) {
    const q = (raw ?? query).trim();
    if (!q) return;
    setBusy(true);
    setQuery(q);
    try {
      const engines = enabledEngineIds(settings);
      const list = await buildSearchEntries(q, engines);
      setEntries(list);
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
    // 仅挂载时根据 initialQuery 触发一次
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

  function favoriteEntry(entry: SearchEntry) {
    onFavoritesChange(
      addFavorite({
        title: `${entry.name} · ${query.trim()}`,
        url: entry.url,
        query: query.trim(),
      }),
    );
  }

  const hasResults = searched && entries.length > 0;
  const emptyEnabled = searched && entries.length === 0;

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
              placeholder="输入关键词，聚合搜索…"
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
              {busy ? "…" : "搜索"}
            </button>
          </div>
        </form>
      </div>

      {(hasResults || emptyEnabled) && (
        <div className="mx-auto w-full max-w-2xl flex-1 overflow-y-auto px-6 pb-8">
          {emptyEnabled ? (
            <p className="py-8 text-center text-sm text-neutral-500">
              未启用任何搜索源，请到「设置」中开启。
            </p>
          ) : (
            <ul className="divide-y divide-neutral-900">
              {entries.map((entry) => (
                <li key={entry.id} className="group flex items-center gap-3 py-3.5">
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-neutral-200">
                      {entry.name}
                    </div>
                    <div className="mt-0.5 truncate text-xs text-neutral-600">
                      {entry.url}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => favoriteEntry(entry)}
                    className="rounded px-2 py-1 text-xs text-neutral-600 opacity-0 transition-opacity hover:text-amber-400 group-hover:opacity-100"
                    title="收藏此结果入口"
                  >
                    收藏
                  </button>
                  <button
                    type="button"
                    onClick={() => void openInBrowser(entry.url)}
                    className="rounded-lg border border-neutral-800 px-3 py-1.5 text-xs text-neutral-300 hover:border-neutral-600 hover:text-white"
                  >
                    在浏览器打开
                  </button>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-6 text-center text-xs text-neutral-700">
            MVP：展示各引擎搜索入口（无 API Key）。点击即可在系统浏览器中打开结果页。
          </p>
        </div>
      )}
    </div>
  );
}
