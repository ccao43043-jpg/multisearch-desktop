mod search;

use search::{AggregateResponse, EngineMeta, SearchOptions};
use serde::Serialize;

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct EngineEntry {
    pub id: String,
    pub name: String,
    pub url: String,
}

/// 根据关键词与启用的引擎 ID，生成各引擎搜索入口 URL（兼容旧调用）。
#[tauri::command]
fn build_search_entries(query: String, engines: Vec<String>) -> Vec<EngineEntry> {
    let q = query.trim();
    if q.is_empty() {
        return Vec::new();
    }
    engines
        .into_iter()
        .filter(|id| {
            matches!(
                id.as_str(),
                "baidu" | "bing" | "google" | "sogou" | "so360" | "duckduckgo"
            )
        })
        .map(|id| EngineEntry {
            name: search::engine_name(&id).into(),
            url: search::portal_url(&id, q),
            id,
        })
        .collect()
}

/// 并行请求各引擎并聚合结果（标题 / 来源 / 摘要 / 链接）。
#[tauri::command]
async fn aggregate_search(
    query: String,
    engines: Vec<String>,
    options: Option<SearchOptions>,
) -> AggregateResponse {
    search::aggregate_search(query, engines, options.unwrap_or_default()).await
}

#[tauri::command]
fn list_engines() -> Vec<EngineMeta> {
    search::catalog()
}

#[tauri::command]
fn greet() -> String {
    "MultiSearch / 聚合搜索".into()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            build_search_entries,
            aggregate_search,
            list_engines,
            greet
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

