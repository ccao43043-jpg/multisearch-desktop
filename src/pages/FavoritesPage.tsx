import { openInBrowser } from "../lib/search";
import { removeFavorite } from "../lib/storage";
import { FavoriteItem } from "../lib/types";

interface Props {
  items: FavoriteItem[];
  onChange: (items: FavoriteItem[]) => void;
  onReuse: (query: string) => void;
}

export function FavoritesPage({ items, onChange, onReuse }: Props) {
  return (
    <div className="mx-auto h-full w-full max-w-2xl overflow-y-auto px-6 py-8">
      <h2 className="mb-6 text-lg font-medium text-neutral-200">收藏</h2>

      {items.length === 0 ? (
        <p className="py-16 text-center text-sm text-neutral-600">
          暂无收藏。可在搜索页收藏关键词或搜索结果。
        </p>
      ) : (
        <ul className="divide-y divide-neutral-900">
          {items.map((item) => (
            <li key={item.id} className="group flex items-center gap-3 py-3">
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm text-neutral-200">{item.title}</div>
                {item.url && (
                  <div className="mt-0.5 truncate text-xs text-neutral-600">
                    {item.url}
                  </div>
                )}
              </div>
              {item.query && (
                <button
                  type="button"
                  onClick={() => onReuse(item.query!)}
                  className="rounded px-2 py-1 text-xs text-neutral-600 opacity-0 hover:text-neutral-300 group-hover:opacity-100"
                >
                  再搜
                </button>
              )}
              {item.url && (
                <button
                  type="button"
                  onClick={() => void openInBrowser(item.url!)}
                  className="rounded-lg border border-neutral-800 px-3 py-1.5 text-xs text-neutral-300 hover:border-neutral-600"
                >
                  打开
                </button>
              )}
              <button
                type="button"
                onClick={() => onChange(removeFavorite(item.id))}
                className="rounded px-2 py-1 text-xs text-neutral-600 opacity-0 hover:text-red-400 group-hover:opacity-100"
              >
                删除
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
