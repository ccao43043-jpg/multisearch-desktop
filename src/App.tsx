import { useCallback, useEffect, useState } from "react";
import { Sidebar } from "./components/Sidebar";
import {
  loadFavorites,
  loadHistory,
  loadSettings,
} from "./lib/storage";
import {
  AppSettings,
  FavoriteItem,
  HistoryItem,
  PageId,
} from "./lib/types";
import { FavoritesPage } from "./pages/FavoritesPage";
import { HistoryPage } from "./pages/HistoryPage";
import { SearchPage } from "./pages/SearchPage";
import { SettingsPage } from "./pages/SettingsPage";

export default function App() {
  const [collapsed, setCollapsed] = useState(false);
  const [page, setPage] = useState<PageId>("search");
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings());
  const [history, setHistory] = useState<HistoryItem[]>(() => loadHistory());
  const [favorites, setFavorites] = useState<FavoriteItem[]>(() =>
    loadFavorites(),
  );
  const [searchKey, setSearchKey] = useState(0);
  const [reuseQuery, setReuseQuery] = useState<string | undefined>(undefined);

  useEffect(() => {
    setSettings(loadSettings());
    setHistory(loadHistory());
    setFavorites(loadFavorites());
  }, []);

  const reuse = useCallback((query: string) => {
    setReuseQuery(query);
    setSearchKey((k) => k + 1);
    setPage("search");
  }, []);

  return (
    <div className="flex h-full w-full overflow-hidden bg-black text-neutral-200">
      <Sidebar
        collapsed={collapsed}
        page={page}
        onToggle={() => setCollapsed((c) => !c)}
        onNavigate={setPage}
      />
      <main className="min-w-0 flex-1">
        {page === "search" && (
          <SearchPage
            key={searchKey}
            settings={settings}
            initialQuery={reuseQuery}
            onHistoryChange={setHistory}
            onFavoritesChange={setFavorites}
          />
        )}
        {page === "history" && (
          <HistoryPage items={history} onChange={setHistory} onReuse={reuse} />
        )}
        {page === "favorites" && (
          <FavoritesPage
            items={favorites}
            onChange={setFavorites}
            onReuse={reuse}
          />
        )}
        {page === "settings" && (
          <SettingsPage settings={settings} onChange={setSettings} />
        )}
      </main>
    </div>
  );
}
