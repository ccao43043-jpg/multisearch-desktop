import {
  ENGINE_CATALOG,
  AppSettings,
  EngineId,
  DEFAULT_ENGINE_ORDER,
} from "../lib/types";
import { saveSettings } from "../lib/storage";

interface Props {
  settings: AppSettings;
  onChange: (settings: AppSettings) => void;
}

function orderedCatalog(order: EngineId[]) {
  const map = new Map(ENGINE_CATALOG.map((e) => [e.id, e]));
  const list: typeof ENGINE_CATALOG = [];
  for (const id of order) {
    const e = map.get(id);
    if (e) list.push(e);
  }
  for (const e of ENGINE_CATALOG) {
    if (!list.find((x) => x.id === e.id)) list.push(e);
  }
  return list;
}

export function SettingsPage({ settings, onChange }: Props) {
  const order =
    settings.engineOrder?.length > 0 ? settings.engineOrder : DEFAULT_ENGINE_ORDER;
  const catalog = orderedCatalog(order);

  function commit(next: AppSettings) {
    saveSettings(next);
    onChange(next);
  }

  function toggle(id: EngineId) {
    commit({
      ...settings,
      engines: {
        ...settings.engines,
        [id]: !settings.engines[id],
      },
    });
  }

  function move(id: EngineId, dir: -1 | 1) {
    const ids = catalog.map((e) => e.id);
    const idx = ids.indexOf(id);
    const j = idx + dir;
    if (idx < 0 || j < 0 || j >= ids.length) return;
    const next = [...ids];
    [next[idx], next[j]] = [next[j], next[idx]];
    commit({ ...settings, engineOrder: next });
  }

  function onKeyChange(value: string) {
    commit({ ...settings, bingApiKey: value });
  }

  return (
    <div className="mx-auto h-full w-full max-w-2xl overflow-y-auto px-6 py-8">
      <h2 className="mb-2 text-lg font-medium text-neutral-200">设置</h2>
      <p className="mb-8 text-sm text-neutral-600">
        开关与排序搜索源。至少开启一个以进行聚合搜索。
      </p>

      <section>
        <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-neutral-500">
          搜索源
        </h3>
        <ul className="divide-y divide-neutral-900 rounded-xl border border-neutral-900">
          {catalog.map((engine, index) => {
            const on = settings.engines[engine.id];
            return (
              <li
                key={engine.id}
                className="flex items-center justify-between gap-3 px-4 py-3.5"
              >
                <div className="min-w-0 flex-1">
                  <div className="text-sm text-neutral-200">{engine.name}</div>
                  <div className="mt-0.5 text-xs text-neutral-600">{engine.id}</div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={index === 0}
                    onClick={() => move(engine.id, -1)}
                    className="rounded px-2 py-1 text-xs text-neutral-500 hover:text-neutral-200 disabled:opacity-20"
                    title="上移"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    disabled={index === catalog.length - 1}
                    onClick={() => move(engine.id, 1)}
                    className="rounded px-2 py-1 text-xs text-neutral-500 hover:text-neutral-200 disabled:opacity-20"
                    title="下移"
                  >
                    ↓
                  </button>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={on}
                  onClick={() => toggle(engine.id)}
                  className={`relative h-6 w-11 rounded-full transition-colors ${
                    on ? "bg-neutral-200" : "bg-neutral-800"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full transition-transform ${
                      on ? "translate-x-5 bg-black" : "translate-x-0 bg-neutral-500"
                    }`}
                  />
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="mt-10">
        <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-neutral-500">
          可选 API Key
        </h3>
        <div className="rounded-xl border border-neutral-900 px-4 py-3.5">
          <label className="block text-sm text-neutral-300">
            Bing Web Search（Azure）订阅密钥
          </label>
          <p className="mt-1 text-xs text-neutral-600">
            可选。填写后优先走官方 API；留空则使用 Bing RSS / HTML 解析。
          </p>
          <input
            type="password"
            value={settings.bingApiKey}
            onChange={(e) => onKeyChange(e.target.value)}
            placeholder="Ocp-Apim-Subscription-Key"
            className="mt-3 w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-200 placeholder:text-neutral-700"
            autoComplete="off"
          />
        </div>
      </section>

      <section className="mt-10">
        <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-neutral-500">
          关于
        </h3>
        <div className="rounded-xl border border-neutral-900 px-4 py-3.5 text-sm text-neutral-400">
          <div>MultiSearch / 聚合搜索</div>
          <div className="mt-1 text-xs text-neutral-600">
            版本 0.2.0 · Tauri 2 + React · 多引擎并行聚合
          </div>
        </div>
      </section>
    </div>
  );
}
