# MultiSearch / 聚合搜索

一次输入，**多引擎并行请求并聚合结果**。Windows 桌面应用（**Tauri 2 + React + TypeScript + Tailwind**）。

> 本仓库是全新的 Tauri 实现，与旧仓库 `multisearch`（Electron/Android）独立，互不覆盖。

## 功能（v0.2.0）

- **纯黑极简 UI**：主界面大搜索框；左侧可折叠导航（搜索 / 历史 / 收藏 / 设置）
- **多引擎并行聚合**：百度、必应、Google（可选搜狗、360、DuckDuckGo）
- **结果列表**：标题、来源、摘要、链接；一键在系统浏览器打开
- **设置**：开关 / 上下排序搜索源；可选配置 Bing Web Search API Key
- **历史 / 收藏**：本地 `localStorage`

## 实现方案摘要

| 引擎 | 默认策略 | 失败时 |
|------|----------|--------|
| **必应** | Bing RSS（`format=rss`）；若配置了 Azure Bing Web Search Key 则优先 API | HTML 解析 → 官方搜索入口 |
| **DuckDuckGo** | Instant Answer 公开 JSON API；再尽力解析 HTML lite | 官方搜索入口 |
| **百度 / Google / 搜狗 / 360** | 尽力请求结果页并解析 HTML | 检测验证码/反爬后降级为**可点击的官方结果入口** |

聚合在 **Rust 后端并行**完成（`reqwest` + `tokio`），避免浏览器 CORS，并由前端展示统一列表。

## 限制与可选 API Key

- **反爬**：百度、Google、搜狗、360、DuckDuckGo HTML 在部分网络环境会返回验证码或空页。应用会降级为「打开官方搜索页」入口，并在结果旁标注引擎状态。
- **Bing RSS**：相对稳定，适合无 Key 场景；结果条数与官方页可能不完全一致。
- **可选 Bing API Key**：在「设置」中填写 Azure [Bing Web Search](https://www.microsoft.com/en-us/bing/apis/bing-web-search-api) 订阅密钥（`Ocp-Apim-Subscription-Key`）。填写后必应优先走官方 API，更稳定、链接更干净。
- **无 Google / 百度官方免费搜索 API**：未内置付费 CSE 等；需要时可后续扩展。
- **浏览器预览**（`npm run dev`）：无法调用原生聚合命令时，会降级为各引擎官方入口列表。

## 环境要求

| 组件 | 版本建议 |
|------|----------|
| Node.js | 18+（推荐 20/22） |
| Rust | stable（`rustup`，建议 1.90+） |
| 系统 | Windows 10/11（目标平台）；macOS / Linux 也可开发 |

### Linux 额外依赖

```bash
sudo apt update
sudo apt install -y \
  libwebkit2gtk-4.1-dev \
  libayatana-appindicator3-dev \
  librsvg2-dev \
  patchelf \
  libgtk-3-dev
```

若缺少 WebKitGTK，`cargo check` / `tauri build` 可能失败；**前端 `npm run build` 仍可独立完成**。Windows 打包不依赖 WebKitGTK。

## 安装依赖

```bash
git clone https://github.com/ccao43043-jpg/multisearch-desktop.git
cd multisearch-desktop
npm install
```

## 开发运行

仅前端（浏览器预览）：

```bash
npm run dev
```

完整桌面端：

```bash
npm run tauri dev
```

## 构建

```bash
npm run build
# Windows 打包
npm run tauri build
```

产物：`src-tauri/target/release/bundle/`。GitHub Actions 工作流 `release-windows.yml` 可在打 `v*` tag 时自动构建 NSIS 安装包并上传 Release。

## 项目结构

```
multisearch-desktop/
├── src/                 # React 前端
│   ├── components/      # 侧栏等
│   ├── pages/           # 搜索 / 历史 / 收藏 / 设置
│   └── lib/             # 类型、本地存储、聚合调用
├── src-tauri/           # Tauri 2 + Rust
│   └── src/search/      # 并行抓取与各引擎解析
└── README.md
```

## 许可证

MIT
