// Backfill script: re-fetches every RSS feed article and updates
// descriptions with full article body text.
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

readFileSync(".env.local", "utf8").split("\n").forEach((line) => {
  const eq = line.indexOf("=");
  if (eq > 0 && !line.startsWith("#"))
    process.env[line.slice(0, eq).trim()] = line.slice(eq + 1).trim();
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

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

const APPLY_TEXT_RE =
  /apply\s*(now|here|online|today)?|official\s*(website|link|page|portal|application)|register\s*(now|here)?|click\s*here\s*to\s*apply|scholarship\s*(link|portal)|application\s*(form|portal|page)/i;
const SOCIAL_RE =
  /facebook|twitter|x\.com|whatsapp|telegram|linkedin|pinterest|instagram|youtube/i;

function extractArticleBody(html) {
  const articleTag = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
  if (articleTag) {
    const text = articleTag[1]
      .replace(/<(script|style|nav|header|footer|aside)[^>]*>[\s\S]*?<\/\1>/gi, " ")
      .replace(/<[^>]*>/g, " ")
      .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
      .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)))
      .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
      .replace(/&nbsp;/g, " ").replace(/&[a-z]+;/gi, " ")
      .replace(/\s+/g, " ").trim();
    if (text.length > 200) return text.slice(0, 6000);
  }

  const contentDiv = html.match(
    /<div[^>]*class="[^"]*(?:entry-content|post-content|article-content|article-body|the-content|post-body|td-post-content)[^"]*"[^>]*>([\s\S]*?)<\/div>/i
  );
  if (contentDiv) {
    const text = contentDiv[1]
      .replace(/<(script|style|nav|aside)[^>]*>[\s\S]*?<\/\1>/gi, " ")
      .replace(/<[^>]*>/g, " ")
      .replace(/&[#a-z0-9]+;/gi, " ")
      .replace(/\s+/g, " ").trim();
    if (text.length > 200) return text.slice(0, 6000);
  }

  const paragraphs = [];
  const pRe = /<p[^>]*>([\s\S]*?)<\/p>/gi;
  let m;
  while ((m = pRe.exec(html)) !== null) {
    const t = m[1].replace(/<[^>]*>/g, "").replace(/&[#a-z0-9]+;/gi, " ").replace(/\s+/g, " ").trim();
    if (t.length > 60) paragraphs.push(t);
  }
  if (paragraphs.length > 0) return paragraphs.join(" ").slice(0, 6000);

  return null;
}

async function processArticle(articleUrl) {
  try {
    const res = await fetch(articleUrl, {
      headers: { "User-Agent": "ScholarHub/1.0 (+https://scholarhub.app)" },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return { applyLink: null, description: null };

    const html = await res.text();
    const articleHost = new URL(articleUrl).hostname;

    let applyLink = null;
    const linkRe = /<a\s[^>]*href="([^"#][^"]*)"[^>]*>([\s\S]*?)<\/a>/gi;
    let match;
    while ((match = linkRe.exec(html)) !== null) {
      const href = match[1];
      const text = match[2].replace(/<[^>]*>/g, "").trim();
      if (!href.startsWith("http")) continue;
      try { if (new URL(href).hostname === articleHost) continue; } catch { continue; }
      if (SOCIAL_RE.test(href)) continue;
      if (APPLY_TEXT_RE.test(text)) { applyLink = href; break; }
    }

    return { applyLink, description: extractArticleBody(html) };
  } catch {
    return { applyLink: null, description: null };
  }
}

async function fetchFeedArticleUrls(feedUrl) {
  try {
    const res = await fetch(feedUrl, {
      headers: { "User-Agent": "ScholarHub/1.0 (+https://scholarhub.app)" },
      signal: AbortSignal.timeout(12000),
    });
    if (!res.ok) return [];
    const xml = await res.text();

    const items = [];
    const itemRe = /<item>([\s\S]*?)<\/item>/gi;
    let m;
    while ((m = itemRe.exec(xml)) !== null) {
      const block = m[1];
      const titleM = block.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i);
      const linkM = block.match(/<link>([\s\S]*?)<\/link>/i) ||
                    block.match(/<link\s[^>]*href="([^"]+)"/i);
      const title = titleM?.[1]?.trim() ?? "";
      const articleUrl = linkM?.[1]?.trim() ?? "";
      if (title && articleUrl) items.push({ title, articleUrl });
    }
    return items;
  } catch {
    return [];
  }
}

async function main() {
  console.log("Fetching all scholarships from DB...");
  const { data: scholarships, error } = await supabase
    .from("scholarships")
    .select("id, title, link, description");

  if (error) { console.error(error); process.exit(1); }
  console.log(`Found ${scholarships.length} scholarships.\n`);

  // Build a title → DB record map for matching
  const byTitle = new Map(scholarships.map((s) => [s.title.toLowerCase().slice(0, 60), s]));

  console.log("Fetching RSS feeds...");
  const feedItems = (await Promise.all(RSS_FEEDS.map(fetchFeedArticleUrls))).flat();
  console.log(`Found ${feedItems.length} feed items across all feeds.\n`);

  // Match feed items to DB records by title prefix
  const toEnrich = [];
  for (const item of feedItems) {
    const key = item.title.toLowerCase().slice(0, 60);
    const dbRecord = byTitle.get(key);
    if (dbRecord) toEnrich.push({ ...item, id: dbRecord.id, currentDesc: dbRecord.description });
  }
  console.log(`Matched ${toEnrich.length} feed items to DB records.\n`);

  const BATCH = 6;
  let updated = 0;
  let skipped = 0;
  let errors = 0;

  for (let i = 0; i < toEnrich.length; i += BATCH) {
    const batch = toEnrich.slice(i, i + BATCH);
    const results = await Promise.all(batch.map((item) => processArticle(item.articleUrl)));

    for (let j = 0; j < batch.length; j++) {
      const { id, currentDesc } = batch[j];
      const { description, applyLink } = results[j];

      if (!description || description.length <= (currentDesc?.length ?? 0)) {
        skipped++;
        continue;
      }

      const updates = { description };
      // Only update link if we found a better apply link
      if (applyLink) updates.link = applyLink;

      const { error: updateError } = await supabase
        .from("scholarships")
        .update(updates)
        .eq("id", id);

      if (updateError) {
        if (updateError.message.includes("unique constraint")) {
          // Another entry already has this apply link — just update description
          const { error: descError } = await supabase
            .from("scholarships")
            .update({ description })
            .eq("id", id);
          if (descError) { errors++; continue; }
        } else {
          errors++;
          continue;
        }
      }
      updated++;
    }

    process.stdout.write(`\rProgress: ${Math.min(i + BATCH, toEnrich.length)}/${toEnrich.length}`);
  }

  console.log(`\n\nDone.\n  Updated: ${updated}\n  Skipped (already rich): ${skipped}\n  Errors: ${errors}`);
}

main();
