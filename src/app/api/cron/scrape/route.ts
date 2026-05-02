import { createServiceClient } from "@/lib/supabase/server";
import { XMLParser } from "fast-xml-parser";
import {
  COUNTRY_KEYWORDS,
  FIELD_KEYWORDS,
  stripHtml,
  extractEligibility,
  classify,
  detectDegree,
  detectDeadline,
} from "@/lib/scholarships/classify";

const RSS_FEEDS = [
  "https://opportunitydesk.org/feed/",
  "https://www.scholars4dev.com/feed/",
  "https://scholarship-positions.com/feed/",
  "https://www.afterschoolafrica.com/feed/",
  "https://worldscholarshipforum.com/feed/",
  "https://www.opportunitiesforafricans.com/feed/",
  "https://scholarships360.org/feed/",
  "https://www.scholarshipregion.com/feed/",
];

// ── article enrichment ───────────────────────────────────────────────────────

const APPLY_TEXT_RE =
  /apply\s*(now|here|online|today)?|official\s*(website|link|page|portal|application)|register\s*(now|here)?|click\s*here\s*to\s*apply|scholarship\s*(link|portal)|application\s*(form|portal|page)/i;

const SOCIAL_RE = /facebook|twitter|x\.com|whatsapp|telegram|linkedin|pinterest|instagram|youtube/i;

// Strip blog chrome (nav, social, author, comments) then decode entities
function cleanHtml(raw: string): string {
  return raw
    // Remove entire noisy elements
    .replace(/<(script|style|nav|header|footer|aside|noscript)[^>]*>[\s\S]*?<\/\1>/gi, " ")
    .replace(/<div[^>]*class="[^"]*(?:share|social|author|byline|meta|comment|sidebar|related|breadcrumb|tag|widget|ad-|advertisement)[^"]*"[^>]*>[\s\S]*?<\/div>/gi, " ")
    // Strip remaining tags
    .replace(/<[^>]*>/g, " ")
    // Decode entities
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ").replace(/&[a-z]+;/gi, " ")
    .replace(/\s+/g, " ").trim();
}

// Remove blog metadata lines that appear at the start of article text
function stripBlogMetadata(text: string): string {
  return text
    // "by Author May 1, 2026" / "written by Author"
    .replace(/\b(by|posted by|written by)\s+[\w\s]{2,30}\s+\w+\s+\d{1,2},?\s+\d{4}\b/gi, " ")
    // "0 comments", "3 shares", "0 Facebook Twitter..."
    .replace(/\b\d+\s*(comments?|shares?|likes?|views?)\b/gi, " ")
    // Social platform names in a row (share buttons rendered as text)
    .replace(/\b(Facebook|Twitter|LinkedIn|WhatsApp|Email|Pinterest|Telegram|Instagram)\b(\s+(Facebook|Twitter|LinkedIn|WhatsApp|Email|Pinterest|Telegram|Instagram)\b)*/gi, " ")
    // Breadcrumb prefix like "Scholarships Title" at the very start
    .replace(/^(Scholarships|Grants|Fellowships|Awards|Home)\s+/i, "")
    // Leftover digit-only tokens from share counts ("0 1 2")
    .replace(/(?<!\w)\d{1,3}(?!\w|\.\d)/g, " ")
    .replace(/\s+/g, " ").trim();
}

function extractArticleBody(html: string): string | null {
  // 1. Prefer <article> tag
  const articleTag = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
  if (articleTag) {
    const text = stripBlogMetadata(cleanHtml(articleTag[1]));
    if (text.length > 200) return text.slice(0, 6000);
  }

  // 2. Common CMS content div classes
  const contentDiv = html.match(
    /<div[^>]*class="[^"]*(?:entry-content|post-content|article-content|article-body|the-content|post-body|td-post-content)[^"]*"[^>]*>([\s\S]*?)<\/div>/i
  );
  if (contentDiv) {
    const text = stripBlogMetadata(cleanHtml(contentDiv[1]));
    if (text.length > 200) return text.slice(0, 6000);
  }

  // 3. Collect all substantial <p> tags
  const paragraphs: string[] = [];
  const pRe = /<p[^>]*>([\s\S]*?)<\/p>/gi;
  let m: RegExpExecArray | null;
  while ((m = pRe.exec(html)) !== null) {
    const t = stripBlogMetadata(cleanHtml(m[1]));
    if (t.length > 60) paragraphs.push(t);
  }
  if (paragraphs.length > 0) return paragraphs.join(" ").slice(0, 6000);

  return null;
}

// Fetch the article page; return the best outbound apply link and
// the full article body text (both fall back gracefully).
async function processArticle(
  articleUrl: string
): Promise<{ link: string; description: string | null }> {
  try {
    const res = await fetch(articleUrl, {
      headers: { "User-Agent": "ScholarHub/1.0 (+https://scholarhub.app)" },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return { link: articleUrl, description: null };

    const html = await res.text();
    const articleHost = new URL(articleUrl).hostname;

    // Extract apply link
    let applyLink = articleUrl;
    const linkRe = /<a\s[^>]*href="([^"#][^"]*)"[^>]*>([\s\S]*?)<\/a>/gi;
    let match: RegExpExecArray | null;
    while ((match = linkRe.exec(html)) !== null) {
      const href = match[1];
      const text = match[2].replace(/<[^>]*>/g, "").trim();
      if (!href.startsWith("http")) continue;
      try { if (new URL(href).hostname === articleHost) continue; } catch { continue; }
      if (SOCIAL_RE.test(href)) continue;
      if (APPLY_TEXT_RE.test(text)) { applyLink = href; break; }
    }

    // Extract full article body
    const description = extractArticleBody(html);

    return { link: applyLink, description };
  } catch {
    return { link: articleUrl, description: null };
  }
}

// ── RSS parsing ───────────────────────────────────────────────────────────────

interface ParsedItem {
  title: string;
  articleUrl: string;
  description: string;
  eligibility: string | null;
}

async function fetchFeed(feedUrl: string): Promise<ParsedItem[]> {
  const res = await fetch(feedUrl, {
    headers: { "User-Agent": "ScholarHub/1.0 (+https://scholarhub.app)" },
    signal: AbortSignal.timeout(12000),
  });
  if (!res.ok) return [];

  const xml = await res.text();
  const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_" });
  const doc = parser.parse(xml);

  const rawItems: unknown[] = doc?.rss?.channel?.item ?? doc?.feed?.entry ?? [];
  const items = Array.isArray(rawItems) ? rawItems : [rawItems];

  return items
    .map((item: unknown) => {
      const i = item as Record<string, unknown>;

      // Decode title — run through stripHtml to resolve any HTML entities
      const title = stripHtml(
        String(
          typeof i.title === "object" && i.title !== null
            ? (i.title as Record<string, unknown>)["#text"] ?? ""
            : i.title ?? ""
        ).trim()
      );

      const articleUrl = String(
        typeof i.link === "string"
          ? i.link
          : typeof i.link === "object" && i.link !== null
          ? (i.link as Record<string, unknown>)["@_href"] ?? ""
          : ""
      ).trim();

      const rawText = stripHtml(
        String(
          typeof i.description === "object" && i.description !== null
            ? (i.description as Record<string, unknown>)["#text"] ?? ""
            : i.description ?? i.summary ?? i.content ?? ""
        )
      );

      return {
        title,
        articleUrl,
        description: rawText.slice(0, 1000),
        eligibility: extractEligibility(rawText),
      };
    })
    .filter((i) => i.title && i.articleUrl);
}

// ── route handler ─────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  const secret = request.headers.get("x-cron-secret");
  if (secret !== process.env.CRON_SECRET) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch all RSS feeds in parallel
  const feedResults = await Promise.allSettled(RSS_FEEDS.map(fetchFeed));

  const candidates: (ParsedItem & { fullText: string })[] = [];
  let errors = 0;
  let skipped = 0;

  for (const result of feedResults) {
    if (result.status === "rejected") { errors++; continue; }
    for (const item of result.value) {
      const fullText = `${item.title} ${item.description}`;
      if (!/scholarship|grant|fellowship|award|bursary|funding/i.test(fullText)) {
        skipped++;
        continue;
      }

      // Skip list/roundup/guide/advice articles — not individual scholarship listings
      if (/^(top \d+|best \d+|\d+ (scholarships|grants|fellowships)|comprehensive guide|how to|how (moms?|students?|nurses?)|essay typer|dress as|tech skills|visa regulations)/i.test(item.title)) {
        skipped++;
        continue;
      }
      if (/\b(business ideas?|side hustles?|ways to make money|career tips|job search|resume tips|cover letter|interview tips|study tips|productivity tips)\b/i.test(item.title)) {
        skipped++;
        continue;
      }
      if (/^what (business|job|career|course|skill)/i.test(item.title)) {
        skipped++;
        continue;
      }
      candidates.push({ ...item, fullText });
    }
  }

  // Process articles in batches of 8 — extract apply link + full body
  const BATCH = 8;
  const enriched: { link: string; description: string | null }[] = [];
  for (let i = 0; i < candidates.length; i += BATCH) {
    const batch = candidates.slice(i, i + BATCH);
    const results = await Promise.all(batch.map((c) => processArticle(c.articleUrl)));
    enriched.push(...results);
  }

  // Upsert into Supabase
  const supabase = createServiceClient();
  let inserted = 0;

  for (let idx = 0; idx < candidates.length; idx++) {
    const item = candidates[idx];
    const { link, description: articleDescription } = enriched[idx];

    // Prefer the full article body; fall back to the RSS snippet
    const description = (articleDescription ?? item.description) || null;
    const fullText = `${item.title} ${description ?? item.description}`;

    const country = classify(fullText, COUNTRY_KEYWORDS, "International" as string);
    const field = classify(fullText, FIELD_KEYWORDS, "Arts & Humanities" as string);
    const degree_level = detectDegree(fullText);
    const deadline = detectDeadline(fullText);

    const { error } = await supabase.from("scholarships").upsert(
      {
        title: item.title.slice(0, 200),
        country,
        field,
        degree_level,
        deadline,
        link,
        description,
        eligibility: item.eligibility || null,
      },
      { onConflict: "link", ignoreDuplicates: true }
    );

    if (error) {
      console.error("Upsert error:", error.message);
      errors++;
    } else {
      inserted++;
    }
  }

  return Response.json({ inserted, skipped, errors });
}
