use super::html;
use super::types::{EngineStatus, SearchOptions, SearchResult};
use super::{engine_name, portal_url};
use regex::Regex;
use serde_json::Value;

type EngineOut = (Vec<SearchResult>, EngineStatus);

pub async fn search_one(
    client: &reqwest::Client,
    engine_id: &str,
    query: &str,
    options: &SearchOptions,
) -> EngineOut {
    let result = match engine_id {
        "bing" => search_bing(client, query, options).await,
        "duckduckgo" => search_duckduckgo(client, query).await,
        "baidu" => search_baidu(client, query).await,
        "google" => search_google(client, query).await,
        "sogou" => search_sogou(client, query).await,
        "so360" => search_so360(client, query).await,
        _ => Err(format!("未知引擎: {}", engine_id)),
    };

    match result {
        Ok(items) if !items.is_empty() => {
            let count = items.len();
            (
                items,
                EngineStatus {
                    engine_id: engine_id.into(),
                    name: engine_name(engine_id).into(),
                    ok: true,
                    message: format!("解析到 {} 条结果", count),
                    count,
                },
            )
        }
        Ok(_) => {
            let portal = SearchResult::portal(
                engine_id,
                query,
                "未能从该引擎解析到结果（可能触发反爬或页面结构变化）。点击打开官方搜索页。",
            );
            (
                vec![portal],
                EngineStatus {
                    engine_id: engine_id.into(),
                    name: engine_name(engine_id).into(),
                    ok: false,
                    message: "无解析结果，已降级为官方入口".into(),
                    count: 0,
                },
            )
        }
        Err(msg) => {
            let portal = SearchResult::portal(
                engine_id,
                query,
                &format!("请求失败：{}。点击打开官方搜索页。", msg),
            );
            (
                vec![portal],
                EngineStatus {
                    engine_id: engine_id.into(),
                    name: engine_name(engine_id).into(),
                    ok: false,
                    message: msg,
                    count: 0,
                },
            )
        }
    }
}

async fn fetch_text(client: &reqwest::Client, url: &str) -> Result<String, String> {
    let resp = client
        .get(url)
        .header(
            "Accept",
            "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        )
        .header("Accept-Language", "zh-CN,zh;q=0.9,en;q=0.8")
        .send()
        .await
        .map_err(|e| e.to_string())?;
    let status = resp.status();
    if !status.is_success() {
        return Err(format!("HTTP {}", status.as_u16()));
    }
    resp.text().await.map_err(|e| e.to_string())
}

async fn search_bing(
    client: &reqwest::Client,
    query: &str,
    options: &SearchOptions,
) -> Result<Vec<SearchResult>, String> {
    if let Some(key) = options
        .bing_api_key
        .as_ref()
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty())
    {
        if let Ok(items) = search_bing_api(client, query, &key).await {
            if !items.is_empty() {
                return Ok(items);
            }
        }
    }

    let rss_url = format!(
        "https://www.bing.com/search?q={}&format=rss&setlang=zh-Hans",
        urlencoding::encode(query)
    );
    if let Ok(xml) = fetch_text(client, &rss_url).await {
        let items = parse_bing_rss(&xml);
        if !items.is_empty() {
            return Ok(items
                .into_iter()
                .enumerate()
                .map(|(i, (t, u, s))| SearchResult::result("bing", i, t, u, s))
                .collect());
        }
    }

    let html_url = format!(
        "https://www.bing.com/search?q={}&setlang=zh-Hans",
        urlencoding::encode(query)
    );
    let html_body = fetch_text(client, &html_url).await?;
    let items = html::parse_bing_html(&html_body);
    Ok(items
        .into_iter()
        .enumerate()
        .map(|(i, (t, u, s))| SearchResult::result("bing", i, t, u, s))
        .collect())
}

async fn search_bing_api(
    client: &reqwest::Client,
    query: &str,
    key: &str,
) -> Result<Vec<SearchResult>, String> {
    let url = format!(
        "https://api.bing.microsoft.com/v7.0/search?q={}&mkt=zh-CN&count=10",
        urlencoding::encode(query)
    );
    let resp = client
        .get(&url)
        .header("Ocp-Apim-Subscription-Key", key)
        .send()
        .await
        .map_err(|e| e.to_string())?;
    if !resp.status().is_success() {
        return Err(format!("Bing API HTTP {}", resp.status().as_u16()));
    }
    let v: Value = resp.json().await.map_err(|e| e.to_string())?;
    let mut out = Vec::new();
    if let Some(arr) = v.pointer("/webPages/value").and_then(|x| x.as_array()) {
        for (i, item) in arr.iter().enumerate() {
            let title = item
                .get("name")
                .and_then(|x| x.as_str())
                .unwrap_or("")
                .to_string();
            let url = item
                .get("url")
                .and_then(|x| x.as_str())
                .unwrap_or("")
                .to_string();
            let snip = item
                .get("snippet")
                .and_then(|x| x.as_str())
                .unwrap_or("")
                .to_string();
            if !title.is_empty() && !url.is_empty() {
                out.push(SearchResult::result("bing", i, title, url, snip));
            }
        }
    }
    Ok(out)
}

fn parse_bing_rss(xml: &str) -> Vec<(String, String, String)> {
    let mut out = Vec::new();
    let item_re = Regex::new(r"(?s)<item>(.*?)</item>").unwrap();
    let title_re = Regex::new(r"(?s)<title>(.*?)</title>").unwrap();
    let link_re = Regex::new(r"(?s)<link>(.*?)</link>").unwrap();
    let desc_re = Regex::new(r"(?s)<description>(.*?)</description>").unwrap();
    for caps in item_re.captures_iter(xml) {
        if out.len() >= 10 {
            break;
        }
        let block = caps.get(1).map(|m| m.as_str()).unwrap_or("");
        let title = title_re
            .captures(block)
            .map(|c| html::strip_tags(c.get(1).map(|m| m.as_str()).unwrap_or("")))
            .unwrap_or_default();
        let link = link_re
            .captures(block)
            .map(|c| html::decode_entities(c.get(1).map(|m| m.as_str()).unwrap_or("")))
            .unwrap_or_default();
        let snip = desc_re
            .captures(block)
            .map(|c| html::strip_tags(c.get(1).map(|m| m.as_str()).unwrap_or("")))
            .unwrap_or_default();
        if !title.is_empty() && link.starts_with("http") {
            out.push((title, link, snip));
        }
    }
    out
}

async fn search_duckduckgo(
    client: &reqwest::Client,
    query: &str,
) -> Result<Vec<SearchResult>, String> {
    let mut out = Vec::new();

    let ia_url = format!(
        "https://api.duckduckgo.com/?q={}&format=json&no_redirect=1&no_html=1&skip_disambig=1",
        urlencoding::encode(query)
    );
    if let Ok(resp) = client.get(&ia_url).send().await {
        if resp.status().is_success() {
            if let Ok(v) = resp.json::<Value>().await {
                if let Some(abs) = v.get("AbstractText").and_then(|x| x.as_str()) {
                    if !abs.is_empty() {
                        let url = v
                            .get("AbstractURL")
                            .and_then(|x| x.as_str())
                            .filter(|s| !s.is_empty())
                            .map(|s| s.to_string())
                            .unwrap_or_else(|| portal_url("duckduckgo", query));
                        let heading = v
                            .get("Heading")
                            .and_then(|x| x.as_str())
                            .filter(|s| !s.is_empty())
                            .unwrap_or(query);
                        out.push(SearchResult::result(
                            "duckduckgo",
                            out.len(),
                            heading.to_string(),
                            url,
                            abs.to_string(),
                        ));
                    }
                }
                collect_ddg_topics(v.get("RelatedTopics").and_then(|x| x.as_array()), &mut out);
                if let Some(arr) = v.get("Results").and_then(|x| x.as_array()) {
                    for item in arr {
                        push_ddg_topic_item(item, &mut out);
                    }
                }
            }
        }
    }

    if out.len() >= 5 {
        return Ok(out);
    }

    let html_url = format!(
        "https://html.duckduckgo.com/html/?q={}",
        urlencoding::encode(query)
    );
    if let Ok(html_body) = fetch_text(client, &html_url).await {
        for (t, u, s) in html::parse_ddg_html(&html_body) {
            if out.len() >= 10 {
                break;
            }
            if out.iter().any(|r| r.url == u) {
                continue;
            }
            out.push(SearchResult::result("duckduckgo", out.len(), t, u, s));
        }
    }

    Ok(out)
}

fn collect_ddg_topics(arr: Option<&Vec<Value>>, out: &mut Vec<SearchResult>) {
    let Some(arr) = arr else { return };
    for item in arr {
        if out.len() >= 10 {
            return;
        }
        if item.get("Topics").is_some() {
            collect_ddg_topics(item.get("Topics").and_then(|x| x.as_array()), out);
        } else {
            push_ddg_topic_item(item, out);
        }
    }
}

fn push_ddg_topic_item(item: &Value, out: &mut Vec<SearchResult>) {
    if out.len() >= 10 {
        return;
    }
    let text = item.get("Text").and_then(|x| x.as_str()).unwrap_or("");
    let url = item
        .get("FirstURL")
        .and_then(|x| x.as_str())
        .unwrap_or("");
    if text.is_empty() || url.is_empty() {
        return;
    }
    let (title, snip) = match text.split_once(" - ") {
        Some((a, b)) => (a.to_string(), b.to_string()),
        None => (text.to_string(), String::new()),
    };
    if out.iter().any(|r| r.url == url) {
        return;
    }
    out.push(SearchResult::result(
        "duckduckgo",
        out.len(),
        title,
        url.to_string(),
        snip,
    ));
}

async fn search_baidu(client: &reqwest::Client, query: &str) -> Result<Vec<SearchResult>, String> {
    let url = format!(
        "https://www.baidu.com/s?wd={}&ie=utf-8",
        urlencoding::encode(query)
    );
    let html_body = fetch_text(client, &url).await?;
    if html::looks_like_challenge(&html_body) {
        return Err("触发百度安全验证".into());
    }
    let items = html::parse_baidu_html(&html_body);
    Ok(items
        .into_iter()
        .enumerate()
        .map(|(i, (t, u, s))| SearchResult::result("baidu", i, t, u, s))
        .collect())
}

async fn search_google(client: &reqwest::Client, query: &str) -> Result<Vec<SearchResult>, String> {
    let url = format!(
        "https://www.google.com/search?q={}&hl=zh-CN&num=10&gbv=1",
        urlencoding::encode(query)
    );
    let html_body = fetch_text(client, &url).await?;
    if html::looks_like_challenge(&html_body) {
        return Err("触发 Google 反爬验证".into());
    }
    let items = html::parse_google_html(&html_body);
    Ok(items
        .into_iter()
        .enumerate()
        .map(|(i, (t, u, s))| SearchResult::result("google", i, t, u, s))
        .collect())
}

async fn search_sogou(client: &reqwest::Client, query: &str) -> Result<Vec<SearchResult>, String> {
    let url = format!(
        "https://www.sogou.com/web?query={}",
        urlencoding::encode(query)
    );
    let html_body = fetch_text(client, &url).await?;
    if html_body.trim().is_empty() {
        return Err("搜狗返回空响应".into());
    }
    if html::looks_like_challenge(&html_body) {
        return Err("触发搜狗验证".into());
    }
    let items = html::parse_sogou_html(&html_body);
    Ok(items
        .into_iter()
        .enumerate()
        .map(|(i, (t, u, s))| SearchResult::result("sogou", i, t, u, s))
        .collect())
}

async fn search_so360(client: &reqwest::Client, query: &str) -> Result<Vec<SearchResult>, String> {
    let url = format!("https://www.so.com/s?q={}", urlencoding::encode(query));
    let html_body = fetch_text(client, &url).await?;
    if html_body.trim().is_empty() {
        return Err("360 搜索返回空响应".into());
    }
    if html::looks_like_challenge(&html_body) {
        return Err("触发 360 验证".into());
    }
    let items = html::parse_so360_html(&html_body);
    Ok(items
        .into_iter()
        .enumerate()
        .map(|(i, (t, u, s))| SearchResult::result("so360", i, t, u, s))
        .collect())
}
