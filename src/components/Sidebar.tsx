import type { ReactNode } from "react";
import { PageId } from "../lib/types";

interface NavItem {
  id: PageId;
  label: string;
  icon: ReactNode;
}

const icons = {
  search: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" strokeLinecap="round" />
    </svg>
  ),
  history: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M3 12a9 9 0 1 0 3-6.7" strokeLinecap="round" />
      <path d="M3 4v5h5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 7v5l3 2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  favorites: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path
        d="M12 17.3l-5.5 3.1 1.1-6.1L3 9.9l6.2-.9L12 3.5l2.8 5.5 6.2.9-4.6 4.4 1.1 6.1z"
        strokeLinejoin="round"
      />
    </svg>
  ),
  settings: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="3" />
      <path
        d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9c.3.6.9 1 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"
        strokeLinejoin="round"
      />
    </svg>
  ),
  collapse: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M15 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  expand: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
};

const NAV: NavItem[] = [
  { id: "search", label: "搜索", icon: icons.search },
  { id: "history", label: "历史", icon: icons.history },
  { id: "favorites", label: "收藏", icon: icons.favorites },
  { id: "settings", label: "设置", icon: icons.settings },
];

interface Props {
  collapsed: boolean;
  page: PageId;
  onToggle: () => void;
  onNavigate: (page: PageId) => void;
}

export function Sidebar({ collapsed, page, onToggle, onNavigate }: Props) {
  return (
    <aside
      className={`flex h-full shrink-0 flex-col border-r border-neutral-900 bg-black transition-[width] duration-200 ${
        collapsed ? "w-14" : "w-44"
      }`}
    >
      <div
        className={`flex h-14 items-center border-b border-neutral-900 ${
          collapsed ? "justify-center px-0" : "justify-between px-3"
        }`}
      >
        {!collapsed && (
          <span className="truncate text-sm font-medium tracking-wide text-neutral-200">
            聚合搜索
          </span>
        )}
        <button
          type="button"
          onClick={onToggle}
          className="flex h-8 w-8 items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-900 hover:text-neutral-200"
          title={collapsed ? "展开导航" : "折叠导航"}
          aria-label={collapsed ? "展开导航" : "折叠导航"}
        >
          {collapsed ? icons.expand : icons.collapse}
        </button>
      </div>

      <nav className="flex flex-1 flex-col gap-1 p-2">
        {NAV.map((item) => {
          const active = page === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              title={item.label}
              className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors ${
                collapsed ? "justify-center px-0" : ""
              } ${
                active
                  ? "bg-neutral-900 text-white"
                  : "text-neutral-400 hover:bg-neutral-950 hover:text-neutral-200"
              }`}
            >
              <span className="shrink-0">{item.icon}</span>
              {!collapsed && <span>{item.label}</span>}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
