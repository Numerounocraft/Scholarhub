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

// ── apply-link keywords ───────────────────────────────────────────────────────

const APPLY_TEXT_RE =
  /apply\s*(now|here|online|today)?|official\s*(website|link|page|portal|application)|register\s*(now|here)?|click\s*here\s*to\s*apply|scholarship\s*(link|portal)|application\s*(form|portal|page)/i;

const SOCIAL_RE = /facebook|twitter|x\.com|whatsapp|telegram|linkedin|pinterest|instagram|youtube/i;

// Fetch the article page and return the first outbound "apply" link found,
// falling back to the article URL itself.
async function extractApplyLink(articleUrl: string): Promise<string> {
  try {
    const res = await fetch(articleUrl, {
      headers: { "User-Agent": "ScholarHub/1.0 (+https://scholarhub.app)" },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return articleUrl;

    const html = await res.text();
    const articleHost = new URL(articleUrl).hostname;
    const linkRe = /<a\s[^>]*href="([^"#][^"]*)"[^>]*>([\s\S]*?)<\/a>/gi;
    let match: RegExpExecArray | null;

    while ((match = linkRe.exec(html)) !== null) {
      const href = match[1];
      const text = match[2].replace(/<[^>]*>/g, "").trim();

      if (!href.startsWith("http")) continue;
      try {
        if (new URL(href).hostname === articleHost) continue;
      } catch {
        continue;
      }
      if (SOCIAL_RE.test(href)) continue;
      if (APPLY_TEXT_RE.test(text)) return href;
    }
  } catch {
    // fall through
  }
  return articleUrl;
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

      // Skip list/roundup/guide articles — not individual scholarship listings
      if (/^(top \d+|best \d+|\d+ (scholarships|grants|fellowships)|comprehensive guide|how to|how (moms?|students?|nurses?)|essay typer|dress as|tech skills|visa regulations)/i.test(item.title)) {
        skipped++;
        continue;
      }
      candidates.push({ ...item, fullText });
    }
  }

  // Extract real apply links in batches of 8 concurrent requests
  const BATCH = 8;
  const applyLinks: string[] = [];
  for (let i = 0; i < candidates.length; i += BATCH) {
    const batch = candidates.slice(i, i + BATCH);
    const links = await Promise.all(batch.map((c) => extractApplyLink(c.articleUrl)));
    applyLinks.push(...links);
  }

  // Upsert into Supabase
  const supabase = createServiceClient();
  let inserted = 0;

  for (let idx = 0; idx < candidates.length; idx++) {
    const item = candidates[idx];
    const link = applyLinks[idx];

    const country = classify(item.fullText, COUNTRY_KEYWORDS, "International" as string);
    const field = classify(item.fullText, FIELD_KEYWORDS, "Arts & Humanities" as string);
    const degree_level = detectDegree(item.fullText);
    const deadline = detectDeadline(item.fullText);

    const { error } = await supabase.from("scholarships").upsert(
      {
        title: item.title.slice(0, 200),
        country,
        field,
        degree_level,
        deadline,
        link,
        description: item.description || null,
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
