mod engines;
mod html;
mod types;

#[allow(unused_imports)]
pub use types::{AggregateResponse, EngineStatus, SearchOptions, SearchResult};

use engines::search_one;
use futures::future::join_all;
use types::EngineMeta;

/// 已知引擎元数据（顺序为默认展示顺序）。
pub fn catalog() -> Vec<EngineMeta> {
    vec![
        EngineMeta {
            id: "baidu".into(),
            name: "百度".into(),
        },
        EngineMeta {
            id: "bing".into(),
            name: "必应".into(),
        },
        EngineMeta {
            id: "google".into(),
            name: "Google".into(),
        },
        EngineMeta {
            id: "sogou".into(),
            name: "搜狗".into(),
        },
        EngineMeta {
            id: "so360".into(),
            name: "360搜索".into(),
        },
        EngineMeta {
            id: "duckduckgo".into(),
            name: "DuckDuckGo".into(),
        },
    ]
}

pub fn portal_url(engine_id: &str, query: &str) -> String {
    let q = urlencoding::encode(query);
    match engine_id {
        "baidu" => format!("https://www.baidu.com/s?wd={}", q),
        "bing" => format!("https://www.bing.com/search?q={}", q),
        "google" => format!("https://www.google.com/search?q={}", q),
        "sogou" => format!("https://www.sogou.com/web?query={}", q),
        "so360" => format!("https://www.so.com/s?q={}", q),
        "duckduckgo" => format!("https://duckduckgo.com/?q={}", q),
        _ => format!("https://www.bing.com/search?q={}", q),
    }
}

pub fn engine_name(engine_id: &str) -> String {
    match engine_id {
        "baidu" => "百度".into(),
        "bing" => "必应".into(),
        "google" => "Google".into(),
        "sogou" => "搜狗".into(),
        "so360" => "360搜索".into(),
        "duckduckgo" => "DuckDuckGo".into(),
        _ => engine_id.to_string(),
    }
}

/// 并行请求各引擎并聚合结果。
pub async fn aggregate_search(
    query: String,
    engines: Vec<String>,
    options: SearchOptions,
) -> AggregateResponse {
    let q = query.trim().to_string();
    if q.is_empty() || engines.is_empty() {
        return AggregateResponse {
            query: q,
            results: vec![],
            statuses: vec![],
        };
    }

    let client = match build_client() {
        Ok(c) => c,
        Err(e) => {
            let statuses: Vec<_> = engines
                .iter()
                .map(|id| EngineStatus {
                    engine_id: id.clone(),
                    name: engine_name(id).into(),
                    ok: false,
                    message: format!("HTTP 客户端初始化失败: {}", e),
                    count: 0,
                })
                .collect();
            return AggregateResponse {
                query: q,
                results: vec![],
                statuses,
            };
        }
    };

    let futs = engines.into_iter().map(|id| {
        let client = client.clone();
        let q = q.clone();
        let opts = options.clone();
        async move { search_one(&client, &id, &q, &opts).await }
    });

    let parts = join_all(futs).await;
    let mut results = Vec::new();
    let mut statuses = Vec::new();
    for (mut items, status) in parts {
        results.append(&mut items);
        statuses.push(status);
    }

    AggregateResponse {
        query: q,
        results,
        statuses,
    }
}

fn build_client() -> Result<reqwest::Client, reqwest::Error> {
    reqwest::Client::builder()
        .user_agent(
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 \
             (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        )
        .timeout(std::time::Duration::from_secs(12))
        .redirect(reqwest::redirect::Policy::limited(8))
        .gzip(true)
        .build()
}
