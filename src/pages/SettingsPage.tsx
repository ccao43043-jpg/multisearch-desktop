import { ENGINE_CATALOG, AppSettings, EngineId } from "../lib/types";
import { saveSettings } from "../lib/storage";

interface Props {
  settings: AppSettings;
  onChange: (settings: AppSettings) => void;
}

export function SettingsPage({ settings, onChange }: Props) {
  function toggle(id: EngineId) {
    const next: AppSettings = {
      engines: {
        ...settings.engines,
        [id]: !settings.engines[id],
      },
    };
    saveSettings(next);
    onChange(next);
  }

  return (
    <div className="mx-auto h-full w-full max-w-2xl overflow-y-auto px-6 py-8">
      <h2 className="mb-2 text-lg font-medium text-neutral-200">设置</h2>
      <p className="mb-8 text-sm text-neutral-600">开关搜索源。至少开启一个以进行聚合搜索。</p>

      <section>
        <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-neutral-500">
          搜索源
        </h3>
        <ul className="divide-y divide-neutral-900 rounded-xl border border-neutral-900">
          {ENGINE_CATALOG.map((engine) => {
            const on = settings.engines[engine.id];
            return (
              <li
                key={engine.id}
                className="flex items-center justify-between px-4 py-3.5"
              >
                <div>
                  <div className="text-sm text-neutral-200">{engine.name}</div>
                  <div className="mt-0.5 text-xs text-neutral-600">{engine.id}</div>
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
          关于
        </h3>
        <div className="rounded-xl border border-neutral-900 px-4 py-3.5 text-sm text-neutral-400">
          <div>MultiSearch / 聚合搜索</div>
          <div className="mt-1 text-xs text-neutral-600">版本 0.1.0 · Tauri 2 + React</div>
        </div>
      </section>
    </div>
  );
}
