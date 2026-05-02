// One-time script to fix existing scholarship records:
// 1. Decode HTML entities in title and description
// 2. Re-extract real apply links for entries pointing to blog articles
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

// Load .env.local
readFileSync(".env.local", "utf8")
  .split("\n")
  .forEach((line) => {
    const eq = line.indexOf("=");
    if (eq > 0 && !line.startsWith("#")) {
      process.env[line.slice(0, eq).trim()] = line.slice(eq + 1).trim();
    }
  });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Blog domains — links from these are article URLs, not apply links
const BLOG_DOMAINS = [
  "opportunitydesk.org",
  "scholars4dev.com",
  "scholarship-positions.com",
  "afterschoolafrica.com",
  "worldscholarshipforum.com",
  "opportunitiesforafricans.com",
  "scholarships360.org",
  "scholarshipregion.com",
];

const APPLY_TEXT_RE =
  /apply\s*(now|here|online|today)?|official\s*(website|link|page|portal|application)|register\s*(now|here)?|click\s*here\s*to\s*apply|scholarship\s*(link|portal)|application\s*(form|portal|page)/i;
const SOCIAL_RE =
  /facebook|twitter|x\.com|whatsapp|telegram|linkedin|pinterest|instagram|youtube/i;

function stripHtml(html) {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isBlogLink(url) {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    return BLOG_DOMAINS.some((d) => host === d || host.endsWith("." + d));
  } catch {
    return false;
  }
}

async function extractApplyLink(articleUrl) {
  try {
    const res = await fetch(articleUrl, {
      headers: { "User-Agent": "ScholarHub/1.0 (+https://scholarhub.app)" },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;

    const html = await res.text();
    const articleHost = new URL(articleUrl).hostname;
    const linkRe = /<a\s[^>]*href="([^"#][^"]*)"[^>]*>([\s\S]*?)<\/a>/gi;
    let match;

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
  } catch (e) {
    // timeout or fetch error — fall through
  }
  return null;
}

async function processBatch(batch) {
  return Promise.all(
    batch.map(async (s) => {
      const updates = {};

      // Fix HTML entities in title
      const cleanTitle = stripHtml(s.title);
      if (cleanTitle !== s.title) updates.title = cleanTitle.slice(0, 200);

      // Fix HTML entities in description
      if (s.description) {
        const cleanDesc = stripHtml(s.description);
        if (cleanDesc !== s.description) updates.description = cleanDesc.slice(0, 1000);
      }

      // Re-extract apply link if currently pointing to a blog article
      if (isBlogLink(s.link)) {
        const applyLink = await extractApplyLink(s.link);
        if (applyLink && applyLink !== s.link) {
          updates.link = applyLink;
        }
      }

      return { id: s.id, updates, originalLink: s.link };
    })
  );
}

async function main() {
  console.log("Fetching all scholarships...");
  const { data: scholarships, error } = await supabase
    .from("scholarships")
    .select("id, title, description, link");

  if (error) { console.error("Fetch error:", error); process.exit(1); }
  console.log(`Found ${scholarships.length} scholarships.\n`);

  const blogItems = scholarships.filter((s) => isBlogLink(s.link));
  const directItems = scholarships.filter((s) => !isBlogLink(s.link));
  console.log(`  Blog article links (need re-extraction): ${blogItems.length}`);
  console.log(`  Already direct links (entity fix only):  ${directItems.length}\n`);

  const BATCH = 8;
  let updated = 0;
  let unchanged = 0;
  let errors = 0;

  const all = [...blogItems, ...directItems];

  for (let i = 0; i < all.length; i += BATCH) {
    const batch = all.slice(i, i + BATCH);
    const results = await processBatch(batch);

    for (const { id, updates, originalLink } of results) {
      if (Object.keys(updates).length === 0) {
        unchanged++;
        continue;
      }

      const { error: updateError } = await supabase
        .from("scholarships")
        .update(updates)
        .eq("id", id);

      if (updateError) {
        if (updateError.message.includes("unique constraint") && updates.link) {
          // A clean entry with this apply link already exists — delete the stale blog-article entry
          const { error: delError } = await supabase.from("scholarships").delete().eq("id", id);
          if (delError) {
            console.error(`  ✗ Could not delete stale entry ${id}: ${delError.message}`);
            errors++;
          } else {
            console.log(`  🗑  Deleted stale duplicate: ${originalLink.slice(0, 70)}`);
            updated++;
          }
        } else {
          console.error(`  ✗ ${id}: ${updateError.message}`);
          errors++;
        }
      } else {
        if (updates.link) {
          console.log(`  ✓ link updated: ${originalLink.slice(0, 60)}`);
          console.log(`              → ${updates.link.slice(0, 60)}`);
        }
        updated++;
      }
    }

    process.stdout.write(`\rProgress: ${Math.min(i + BATCH, all.length)}/${all.length}`);
  }

  console.log(`\n\nDone.\n  Updated: ${updated}\n  Unchanged: ${unchanged}\n  Errors: ${errors}`);
}

main();
