use serde::Serialize;

#[derive(Debug, Clone, Serialize)]
pub struct EngineEntry {
    pub id: String,
    pub name: String,
    pub url: String,
}

/// 根据关键词与启用的引擎 ID，生成各引擎搜索入口 URL。
#[tauri::command]
fn build_search_entries(query: String, engines: Vec<String>) -> Vec<EngineEntry> {
    let q = urlencoding_encode(&query.trim());
    if q.is_empty() {
        return Vec::new();
    }

    let catalog: &[(&str, &str, fn(&str) -> String)] = &[
        ("baidu", "百度", |q| {
            format!("https://www.baidu.com/s?wd={}", q)
        }),
        ("bing", "必应", |q| {
            format!("https://www.bing.com/search?q={}", q)
        }),
        ("google", "Google", |q| {
            format!("https://www.google.com/search?q={}", q)
        }),
        ("duckduckgo", "DuckDuckGo", |q| {
            format!("https://duckduckgo.com/?q={}", q)
        }),
        ("github", "GitHub", |q| {
            format!("https://github.com/search?q={}&type=repositories", q)
        }),
    ];

    catalog
        .iter()
        .filter(|(id, _, _)| engines.iter().any(|e| e == *id))
        .map(|(id, name, build)| EngineEntry {
            id: id.to_string(),
            name: name.to_string(),
            url: build(&q),
        })
        .collect()
}

fn urlencoding_encode(s: &str) -> String {
    let mut out = String::with_capacity(s.len() * 3);
    for b in s.as_bytes() {
        match *b {
            b'A'..=b'Z' | b'a'..=b'z' | b'0'..=b'9' | b'-' | b'_' | b'.' | b'~' => {
                out.push(*b as char);
            }
            b' ' => out.push_str("%20"),
            _ => {
                out.push('%');
                out.push_str(&format!("{:02X}", b));
            }
        }
    }
    out
}

#[tauri::command]
fn greet() -> String {
    "MultiSearch / 聚合搜索".into()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![build_search_entries, greet])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
