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
];

// ── RSS parsing ───────────────────────────────────────────────────────────────

interface ParsedItem {
  title: string;
  link: string;
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

  // Support RSS 2.0 and Atom
  const rawItems: unknown[] =
    doc?.rss?.channel?.item ??
    doc?.feed?.entry ??
    [];

  const items = Array.isArray(rawItems) ? rawItems : [rawItems];

  return items
    .map((item: unknown) => {
      const i = item as Record<string, unknown>;
      const title = String(
        typeof i.title === "object" && i.title !== null
          ? (i.title as Record<string, unknown>)["#text"] ?? ""
          : i.title ?? ""
      ).trim();

      const link = String(
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
      const description = rawText.slice(0, 1000);
      const eligibility = extractEligibility(rawText);

      return { title, link, description, eligibility };
    })
    .filter((i) => i.title && i.link);
}

// ── route handler ─────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  const secret = request.headers.get("x-cron-secret");
  if (secret !== process.env.CRON_SECRET) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();
  let inserted = 0;
  let skipped = 0;
  let errors = 0;

  for (const feedUrl of RSS_FEEDS) {
    let items: ParsedItem[];
    try {
      items = await fetchFeed(feedUrl);
    } catch (err) {
      console.error(`Feed fetch failed (${feedUrl}):`, err);
      errors++;
      continue;
    }

    for (const item of items) {
      const fullText = `${item.title} ${item.description}`;

      // Skip non-scholarship content
      if (!/scholarship|grant|fellowship|award|bursary|funding/i.test(fullText)) {
        skipped++;
        continue;
      }

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
          link: item.link,
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
  }

  return Response.json({ inserted, skipped, errors });
}
