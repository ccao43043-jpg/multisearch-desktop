use regex::Regex;
use scraper::{Html, Selector};

/// Decode a handful of common HTML entities.
pub fn decode_entities(s: &str) -> String {
    s.replace("&amp;", "&")
        .replace("&lt;", "<")
        .replace("&gt;", ">")
        .replace("&quot;", "\"")
        .replace("&#39;", "'")
        .replace("&apos;", "'")
        .replace("&nbsp;", " ")
        .replace("<b>", "")
        .replace("</b>", "")
        .replace("<strong>", "")
        .replace("</strong>", "")
}

pub fn strip_tags(s: &str) -> String {
    let re = Regex::new(r"<[^>]+>").unwrap();
    let t = re.replace_all(s, "");
    decode_entities(&t)
        .split_whitespace()
        .collect::<Vec<_>>()
        .join(" ")
}

pub fn looks_like_challenge(html: &str) -> bool {
    let lower = html.to_lowercase();
    lower.contains("安全验证")
        || lower.contains("captcha")
        || lower.contains("unusual traffic")
        || lower.contains("anomaly-modal")
        || lower.contains("challenge-form")
        || lower.contains("请输入验证码")
        || lower.contains("访问受限")
        || lower.contains("sg_ss=")
}

/// Bing HTML（RSS 失败时的备选）。
pub fn parse_bing_html(html: &str) -> Vec<(String, String, String)> {
    let mut out = Vec::new();
    let parts: Vec<&str> = html.split("class=\"b_algo\"").skip(1).collect();
    let title_re =
        Regex::new(r#"(?s)<h2[^>]*>\s*<a[^>]*href="([^"]+)"[^>]*>(.*?)</a>"#).unwrap();
    let snip_re = Regex::new(r#"(?s)class="b_lineclamp\d+"[^>]*>(.*?)</p>"#).unwrap();
    for (i, p) in parts.iter().enumerate() {
        if i >= 10 {
            break;
        }
        if let Some(caps) = title_re.captures(p) {
            let url = decode_entities(caps.get(1).map(|m| m.as_str()).unwrap_or(""));
            let title = strip_tags(caps.get(2).map(|m| m.as_str()).unwrap_or(""));
            let snip = snip_re
                .captures(p)
                .map(|c| strip_tags(c.get(1).map(|m| m.as_str()).unwrap_or("")))
                .unwrap_or_default();
            if !title.is_empty() && !url.is_empty() {
                out.push((title, url, snip));
            }
        }
    }
    out
}

pub fn parse_baidu_html(html: &str) -> Vec<(String, String, String)> {
    let mut out = Vec::new();
    if looks_like_challenge(html) {
        return out;
    }
    let doc = Html::parse_document(html);
    let item_sel = Selector::parse("div.result, div.c-container, div[tpl]").unwrap();
    let a_sel = Selector::parse("h3 a").unwrap();
    let abs_sel =
        Selector::parse(".c-abstract, span.content-right_8Zs40, .c-span-last").unwrap();

    for (i, el) in doc.select(&item_sel).enumerate() {
        if i >= 12 {
            break;
        }
        let a = match el.select(&a_sel).next() {
            Some(a) => a,
            None => continue,
        };
        let href = a.value().attr("href").unwrap_or("").to_string();
        let title = strip_tags(&a.inner_html());
        if title.is_empty() || href.is_empty() {
            continue;
        }
        let snip = el
            .select(&abs_sel)
            .next()
            .map(|n| strip_tags(&n.inner_html()))
            .unwrap_or_default();
        let url = if href.starts_with("http") {
            href
        } else if href.starts_with("/") {
            format!("https://www.baidu.com{}", href)
        } else {
            continue;
        };
        out.push((title, url, snip));
    }
    out
}

pub fn parse_google_html(html: &str) -> Vec<(String, String, String)> {
    let mut out = Vec::new();
    if looks_like_challenge(html) {
        return out;
    }
    let re = Regex::new(
        r#"(?s)<a[^>]+href="/url\?q=([^&"]+)[^"]*"[^>]*>.*?<h3[^>]*>(.*?)</h3>"#,
    )
    .unwrap();
    for caps in re.captures_iter(html) {
        if out.len() >= 10 {
            break;
        }
        let url = decode_entities(caps.get(1).map(|m| m.as_str()).unwrap_or(""));
        let title = strip_tags(caps.get(2).map(|m| m.as_str()).unwrap_or(""));
        if !title.is_empty() && url.starts_with("http") {
            out.push((title, url, String::new()));
        }
    }
    if !out.is_empty() {
        return out;
    }
    let re2 = Regex::new(r#"(?s)<a href="/url\?q=([^&"]+)[^"]*"[^>]*>(.*?)</a>"#).unwrap();
    for caps in re2.captures_iter(html) {
        if out.len() >= 10 {
            break;
        }
        let url = decode_entities(caps.get(1).map(|m| m.as_str()).unwrap_or(""));
        let title = strip_tags(caps.get(2).map(|m| m.as_str()).unwrap_or(""));
        if title.len() < 2 || !url.starts_with("http") || url.contains("google.") {
            continue;
        }
        out.push((title, url, String::new()));
    }
    out
}

pub fn parse_sogou_html(html: &str) -> Vec<(String, String, String)> {
    let mut out = Vec::new();
    if looks_like_challenge(html) || html.trim().is_empty() {
        return out;
    }
    let doc = Html::parse_document(html);
    let item_sel = Selector::parse(".vrwrap, .results .rb, .result").unwrap();
    let a_sel = Selector::parse("h3 a, .vr-title a").unwrap();
    let abs_sel = Selector::parse(".space-txt, .str-text, .ft, p.str_info").unwrap();

    for (i, el) in doc.select(&item_sel).enumerate() {
        if i >= 10 {
            break;
        }
        let a = match el.select(&a_sel).next() {
            Some(a) => a,
            None => continue,
        };
        let mut href = a.value().attr("href").unwrap_or("").to_string();
        let title = strip_tags(&a.inner_html());
        if title.is_empty() || href.is_empty() {
            continue;
        }
        if href.starts_with("/") {
            href = format!("https://www.sogou.com{}", href);
        }
        let snip = el
            .select(&abs_sel)
            .next()
            .map(|n| strip_tags(&n.inner_html()))
            .unwrap_or_default();
        out.push((title, href, snip));
    }
    out
}

pub fn parse_so360_html(html: &str) -> Vec<(String, String, String)> {
    let mut out = Vec::new();
    if looks_like_challenge(html) || html.trim().is_empty() {
        return out;
    }
    let doc = Html::parse_document(html);
    let item_sel = Selector::parse("li.res-list, .res-list").unwrap();
    let a_sel = Selector::parse("h3 a").unwrap();
    let abs_sel = Selector::parse(".res-desc, .res-rich").unwrap();

    for (i, el) in doc.select(&item_sel).enumerate() {
        if i >= 10 {
            break;
        }
        let a = match el.select(&a_sel).next() {
            Some(a) => a,
            None => continue,
        };
        let href = a
            .value()
            .attr("data-mdurl")
            .or_else(|| a.value().attr("href"))
            .unwrap_or("")
            .to_string();
        let title = strip_tags(&a.inner_html());
        if title.is_empty() || !href.starts_with("http") {
            continue;
        }
        let snip = el
            .select(&abs_sel)
            .next()
            .map(|n| strip_tags(&n.inner_html()))
            .unwrap_or_default();
        out.push((title, href, snip));
    }
    out
}

pub fn parse_ddg_html(html: &str) -> Vec<(String, String, String)> {
    let mut out = Vec::new();
    if looks_like_challenge(html) {
        return out;
    }
    let doc = Html::parse_document(html);
    let result_sel = Selector::parse(".result, .results_links, .web-result").unwrap();
    let a_sel = Selector::parse("a.result__a, a.result-link, h2 a").unwrap();
    let snip_sel = Selector::parse(".result__snippet, .result-snippet").unwrap();

    for (i, el) in doc.select(&result_sel).enumerate() {
        if i >= 10 {
            break;
        }
        let a = match el.select(&a_sel).next() {
            Some(a) => a,
            None => continue,
        };
        let mut href = a.value().attr("href").unwrap_or("").to_string();
        if let Some(idx) = href.find("uddg=") {
            let enc = &href[idx + 5..];
            let enc = enc.split('&').next().unwrap_or(enc);
            if let Ok(decoded) = urlencoding::decode(enc) {
                href = decoded.into_owned();
            }
        }
        let title = strip_tags(&a.inner_html());
        if title.is_empty() || !href.starts_with("http") {
            continue;
        }
        let snip = el
            .select(&snip_sel)
            .next()
            .map(|n| strip_tags(&n.inner_html()))
            .unwrap_or_default();
        out.push((title, href, snip));
    }
    out
}
