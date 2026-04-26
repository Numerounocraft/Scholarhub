import { createServiceClient } from "@/lib/supabase/server";
import { XMLParser } from "fast-xml-parser";
import type { DegreeLevel } from "@/lib/types";

const RSS_FEEDS = [
  "https://opportunitydesk.org/feed/",
  "https://www.scholars4dev.com/feed/",
  "https://scholarship-positions.com/feed/",
  "https://www.afterschoolafrica.com/feed/",
];

// ── classifiers ──────────────────────────────────────────────────────────────

const COUNTRY_KEYWORDS: [string, string][] = [
  ["united states", "United States"], ["u.s.a", "United States"], [" usa ", "United States"],
  ["united kingdom", "United Kingdom"], [" uk ", "United Kingdom"], ["britain", "United Kingdom"],
  ["germany", "Germany"], ["australia", "Australia"], ["canada", "Canada"],
  ["france", "France"], ["netherlands", "Netherlands"], ["japan", "Japan"],
  ["china", "China"], ["sweden", "Sweden"], ["norway", "Norway"],
  ["denmark", "Denmark"], ["switzerland", "Switzerland"], ["singapore", "Singapore"],
  ["south korea", "South Korea"], ["new zealand", "New Zealand"], ["finland", "Finland"],
];

const FIELD_KEYWORDS: [string, string][] = [
  ["computer science", "Computer Science"], ["information technology", "Computer Science"],
  ["software", "Computer Science"], ["engineering", "Engineering"],
  ["medicine", "Medicine & Health"], ["medical", "Medicine & Health"],
  ["public health", "Medicine & Health"], ["health science", "Medicine & Health"],
  ["business", "Business"], ["management", "Business"], ["mba", "Business"],
  ["law", "Law"], ["legal", "Law"],
  ["mathematics", "Mathematics"], ["statistics", "Mathematics"],
  ["physics", "Natural Sciences"], ["chemistry", "Natural Sciences"],
  ["biology", "Natural Sciences"], ["natural science", "Natural Sciences"],
  ["environment", "Environmental Science"], ["climate", "Environmental Science"],
  ["agriculture", "Agriculture"], ["agric", "Agriculture"],
  ["architecture", "Architecture"],
  ["public policy", "Public Policy"], ["political science", "Public Policy"],
  ["social science", "Social Sciences"], ["sociology", "Social Sciences"],
  ["psychology", "Social Sciences"],
  ["education", "Education"], ["teaching", "Education"],
  ["arts", "Arts & Humanities"], ["humanities", "Arts & Humanities"],
  ["literature", "Arts & Humanities"],
];

const MONTHS: Record<string, number> = {
  january: 1, february: 2, march: 3, april: 4, may: 5, june: 6,
  july: 7, august: 8, september: 9, october: 10, november: 11, december: 12,
};

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/&[a-z]+;/gi, " ").replace(/\s+/g, " ").trim();
}

function extractEligibility(text: string): string | null {
  const lower = text.toLowerCase();

  // Try to find an explicit eligibility section
  const sectionPatterns = [
    /eligibility[:\s–-]+([^.]*(?:\.[^.]*){0,5})/i,
    /who can apply[:\s–-]+([^.]*(?:\.[^.]*){0,5})/i,
    /requirements[:\s–-]+([^.]*(?:\.[^.]*){0,5})/i,
    /criteria[:\s–-]+([^.]*(?:\.[^.]*){0,5})/i,
  ];

  for (const pattern of sectionPatterns) {
    const match = text.match(pattern);
    const captured = match?.[1]?.trim() ?? "";
    if (captured.length > 20) {
      return captured.slice(0, 800);
    }
  }

  // Fall back: collect sentences mentioning eligibility keywords
  const sentences = text.split(/(?<=[.!?])\s+/);
  const eligibilitySentences = sentences.filter((s) =>
    /must (be|have)|eligible|citizen|national|applicant|open to|requirement|qualif|enroll|degree|gpa|age limit/i.test(s)
  );

  if (eligibilitySentences.length > 0) {
    return eligibilitySentences.slice(0, 4).join(" ").slice(0, 800);
  }

  return null;
}

function classify<T extends string>(
  text: string,
  keywords: [string, T][],
  fallback: T
): T {
  const lower = ` ${text.toLowerCase()} `;
  for (const [kw, value] of keywords) {
    if (lower.includes(kw)) return value;
  }
  return fallback;
}

function detectDegree(text: string): DegreeLevel {
  const lower = text.toLowerCase();
  if (/phd|doctoral|doctorate/.test(lower)) return "phd";
  if (/master|msc|mba|postgraduate|post-graduate/.test(lower)) return "masters";
  if (/undergraduate|bachelor|bsc|first degree/.test(lower)) return "undergraduate";
  return "any";
}

function detectDeadline(text: string): string {
  const lower = text.toLowerCase();

  // "January 15, 2026" or "January 15 2026"
  const m1 = lower.match(
    /\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2})[,\s]+(\d{4})\b/
  );
  if (m1) {
    const d = new Date(parseInt(m1[3]), MONTHS[m1[1]] - 1, parseInt(m1[2]));
    if (d > new Date()) return d.toISOString().split("T")[0];
  }

  // "15 January 2026"
  const m2 = lower.match(
    /\b(\d{1,2})\s+(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{4})\b/
  );
  if (m2) {
    const d = new Date(parseInt(m2[3]), MONTHS[m2[2]] - 1, parseInt(m2[1]));
    if (d > new Date()) return d.toISOString().split("T")[0];
  }

  // ISO "2026-12-15"
  const m3 = text.match(/\b(202[6-9]|203\d)-(\d{2})-(\d{2})\b/);
  if (m3) {
    const d = new Date(m3[0]);
    if (d > new Date()) return m3[0];
  }

  // Default: 90 days from now
  const fallback = new Date();
  fallback.setDate(fallback.getDate() + 90);
  return fallback.toISOString().split("T")[0];
}

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
