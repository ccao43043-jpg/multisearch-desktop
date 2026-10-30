# MultiSearch / 聚合搜索

一次输入，多引擎结果入口。Windows 桌面 MVP（**Tauri 2 + React + TypeScript + Tailwind**）。

> 本仓库是全新的 Tauri 实现，与旧仓库 `multisearch`（Electron/Android）独立，互不覆盖。

## 功能（v0.1.0 MVP）

- **纯黑极简 UI**：主界面大搜索框；左侧可折叠导航（搜索 / 历史 / 收藏 / 设置）
- **多引擎入口**：百度、必应、Google（可选 DuckDuckGo、GitHub）
- **结果列表**：每条显示引擎名 + 搜索 URL，一键「在浏览器打开」
- **历史**：本地 `localStorage` 保存
- **收藏**：可收藏搜索词或引擎结果入口
- **设置**：开关搜索源

> 说明：当前 MVP **不依赖搜索 API Key**。受各引擎反爬与 CORS 限制，应用内以「引擎结果入口列表」展示；点击后在系统默认浏览器打开真实搜索页。后续可接入官方 API 做页内结果聚合。

## 环境要求

| 组件 | 版本建议 |
|------|----------|
| Node.js | 18+（推荐 20/22） |
| Rust | stable（`rustup`） |
| 系统 | Windows 10/11（目标平台）；macOS / Linux 也可开发 |

### Linux 额外依赖（本 CI/沙箱常缺）

Linux 上构建/运行 Tauri 需要 **WebKitGTK** 等系统库，例如 Debian/Ubuntu：

```bash
sudo apt update
sudo apt install -y \
  libwebkit2gtk-4.1-dev \
  libayatana-appindicator3-dev \
  librsvg2-dev \
  patchelf \
  libgtk-3-dev
```

若缺少 WebKitGTK，`cargo check` / `tauri build` 可能失败；**前端 `npm run build` 仍可独立完成**，代码与工程结构完整。Windows 打包不依赖 WebKitGTK。

## 安装依赖

```bash
git clone https://github.com/ccao43043-jpg/multisearch-desktop.git
cd multisearch-desktop
npm install
```

## 开发运行

仅前端（浏览器预览，打开外链会走 `window.open`）：

```bash
npm run dev
```

完整桌面端（需本机已装好 Tauri 系统依赖）：

```bash
npm run tauri dev
```

## 构建前端

```bash
npm run build
```

产物在 `dist/`。

## 打包桌面应用

```bash
# Windows：生成 .msi / .exe 等安装包（在 Windows 上执行）
npm run tauri build
```

产物目录：`src-tauri/target/release/bundle/`。

可选检查 Rust 侧（需系统依赖齐全）：

```bash
cd src-tauri && cargo check
```

> **构建限制说明**：在缺少 `libwebkit2gtk-4.1-dev` / `libglib2.0-dev` 等 Linux 系统库的环境中，`cargo check` / `tauri build` 会失败（本仓库开发沙箱即如此）。**前端 `npm run build` 已通过**。请在 Windows 本机或装好依赖的 Linux/macOS 上执行 `npm run tauri build` 进行打包。Rust 工具链建议 **1.90+**（当前最新 Tauri 2 要求）。

## 项目结构

```
multisearch-desktop/
├── src/                 # React 前端
│   ├── components/      # 侧栏等
│   ├── pages/           # 搜索 / 历史 / 收藏 / 设置
│   └── lib/             # 类型、本地存储、搜索入口
├── src-tauri/           # Tauri 2 + Rust
│   ├── src/lib.rs       # build_search_entries 等命令
│   └── tauri.conf.json
└── README.md
```

## 许可证

MIT
