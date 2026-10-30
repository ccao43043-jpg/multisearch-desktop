use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SearchResult {
    pub id: String,
    pub title: String,
    pub url: String,
    pub snippet: String,
    pub source: String,
    pub engine_id: String,
    /// "result" | "portal" | "error"
    pub kind: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EngineStatus {
    pub engine_id: String,
    pub name: String,
    pub ok: bool,
    pub message: String,
    pub count: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AggregateResponse {
    pub query: String,
    pub results: Vec<SearchResult>,
    pub statuses: Vec<EngineStatus>,
}

#[derive(Debug, Clone, Default, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SearchOptions {
    /// 可选：Azure Bing Web Search API 订阅密钥
    pub bing_api_key: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct EngineMeta {
    pub id: String,
    pub name: String,
}

impl SearchResult {
    pub fn result(
        engine_id: &str,
        idx: usize,
        title: String,
        url: String,
        snippet: String,
    ) -> Self {
        Self {
            id: format!("{}-{}", engine_id, idx),
            title,
            url,
            snippet,
            source: crate::search::engine_name(engine_id).into(),
            engine_id: engine_id.into(),
            kind: "result".into(),
        }
    }

    pub fn portal(engine_id: &str, query: &str, reason: &str) -> Self {
        let name = crate::search::engine_name(engine_id);
        Self {
            id: format!("{}-portal", engine_id),
            title: format!("在{}中搜索「{}」", name, query),
            url: crate::search::portal_url(engine_id, query),
            snippet: reason.into(),
            source: name.into(),
            engine_id: engine_id.into(),
            kind: "portal".into(),
        }
    }
}
