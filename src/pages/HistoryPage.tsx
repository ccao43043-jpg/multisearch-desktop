import { openInBrowser } from "../lib/search";
import { clearHistory, removeHistory } from "../lib/storage";
import { HistoryItem } from "../lib/types";

interface Props {
  items: HistoryItem[];
  onChange: (items: HistoryItem[]) => void;
  onReuse: (query: string) => void;
}

function formatTime(at: number): string {
  try {
    return new Date(at).toLocaleString("zh-CN", {
      hour12: false,
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

export function HistoryPage({ items, onChange, onReuse }: Props) {
  return (
    <div className="mx-auto h-full w-full max-w-2xl overflow-y-auto px-6 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-lg font-medium text-neutral-200">历史</h2>
        {items.length > 0 && (
          <button
            type="button"
            onClick={() => onChange(clearHistory())}
            className="text-xs text-neutral-500 hover:text-neutral-300"
          >
            清空
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <p className="py-16 text-center text-sm text-neutral-600">暂无搜索历史</p>
      ) : (
        <ul className="divide-y divide-neutral-900">
          {items.map((item) => (
            <li key={item.id} className="group flex items-center gap-3 py-3">
              <button
                type="button"
                onClick={() => onReuse(item.query)}
                className="min-w-0 flex-1 text-left"
              >
                <div className="truncate text-sm text-neutral-200">{item.query}</div>
                <div className="mt-0.5 text-xs text-neutral-600">
                  {formatTime(item.at)}
                </div>
              </button>
              <button
                type="button"
                onClick={() =>
                  void openInBrowser(
                    `https://www.bing.com/search?q=${encodeURIComponent(item.query)}`,
                  )
                }
                className="rounded px-2 py-1 text-xs text-neutral-600 opacity-0 hover:text-neutral-300 group-hover:opacity-100"
              >
                打开
              </button>
              <button
                type="button"
                onClick={() => onChange(removeHistory(item.id))}
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
