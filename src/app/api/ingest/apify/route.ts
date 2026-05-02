import { createServiceClient } from "@/lib/supabase/server";
import {
  COUNTRY_KEYWORDS,
  FIELD_KEYWORDS,
  stripHtml,
  extractEligibility,
  classify,
  detectDegree,
  detectDeadline,
} from "@/lib/scholarships/classify";

// Shape of each item returned by the Apify dataset API.
// Your Actor should output at minimum: { title, url } plus as much text as possible.
interface ApifyItem {
  title?: string;
  url?: string;
  link?: string;       // fallback if Actor uses "link" instead of "url"
  description?: string;
  body?: string;       // full scraped page text — used for classification
  // Pre-classified fields (optional — Actor can supply these to skip auto-detection)
  country?: string;
  field?: string;
  degree_level?: string;
  deadline?: string;
}

// Apify sends this payload when an Actor run finishes.
interface ApifyWebhookPayload {
  eventType: string;
  eventData: {
    actorRunId: string;
    defaultDatasetId: string;
  };
}

async function fetchDatasetItems(datasetId: string): Promise<ApifyItem[]> {
  const token = process.env.APIFY_API_TOKEN;
  const res = await fetch(
    `https://api.apify.com/v2/datasets/${datasetId}/items?token=${token}&clean=true`,
    { signal: AbortSignal.timeout(30000) }
  );
  if (!res.ok) {
    throw new Error(`Apify dataset fetch failed: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

export async function POST(request: Request) {
  // Authenticate via query-param secret set when you configure the webhook in Apify.
  const { searchParams } = new URL(request.url);
  if (searchParams.get("secret") !== process.env.APIFY_WEBHOOK_SECRET) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: ApifyWebhookPayload;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Only process successful runs.
  if (payload.eventType !== "ACTOR.RUN.SUCCEEDED") {
    return Response.json({ skipped: true, reason: payload.eventType });
  }

  const datasetId = payload.eventData?.defaultDatasetId;
  if (!datasetId) {
    return Response.json({ error: "Missing defaultDatasetId" }, { status: 400 });
  }

  let items: ApifyItem[];
  try {
    items = await fetchDatasetItems(datasetId);
  } catch (err) {
    console.error("Apify dataset fetch error:", err);
    return Response.json({ error: "Failed to fetch dataset" }, { status: 502 });
  }

  const supabase = createServiceClient();
  let inserted = 0;
  let skipped = 0;
  let errors = 0;

  for (const item of items) {
    const link = item.url ?? item.link ?? "";
    const title = item.title?.trim() ?? "";

    if (!link || !title) {
      skipped++;
      continue;
    }

    // Use the richest text available for classification.
    const rawText = stripHtml(`${title} ${item.description ?? ""} ${item.body ?? ""}`);

    if (!/scholarship|grant|fellowship|award|bursary|funding/i.test(rawText)) {
      skipped++;
      continue;
    }

    const country =
      item.country ?? classify(rawText, COUNTRY_KEYWORDS, "International" as string);
    const field =
      item.field ?? classify(rawText, FIELD_KEYWORDS, "Arts & Humanities" as string);
    const degree_level = item.degree_level ?? detectDegree(rawText);
    const deadline = item.deadline ?? detectDeadline(rawText);
    const description = (item.description ?? rawText).slice(0, 1000) || null;
    const eligibility = extractEligibility(rawText);

    const { error } = await supabase.from("scholarships").upsert(
      { title: title.slice(0, 200), country, field, degree_level, deadline, link, description, eligibility },
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
