import { createServiceClient } from "@/lib/supabase/server";
import type { Scholarship, UserPreferences } from "@/lib/types";

// Called by GitHub Actions daily via a POST with the CRON_SECRET header
export async function POST(request: Request) {
  const secret = request.headers.get("x-cron-secret");
  if (secret !== process.env.CRON_SECRET) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();

  // Scholarships added in the last 24 hours
  const since = new Date(Date.now() - 86_400_000).toISOString();

  const { data: newScholarships, error: scholarshipError } = await supabase
    .from("scholarships")
    .select("*")
    .gte("created_at", since)
    .gte("deadline", new Date().toISOString().split("T")[0]);

  if (scholarshipError) {
    console.error("Failed to fetch scholarships:", scholarshipError.message);
    return Response.json({ error: scholarshipError.message }, { status: 500 });
  }

  if (!newScholarships || newScholarships.length === 0) {
    return Response.json({ sent: 0, message: "No new scholarships today" });
  }

  const { data: allPreferences, error: prefError } = await supabase
    .from("preferences")
    .select("*");

  if (prefError) {
    console.error("Failed to fetch preferences:", prefError.message);
    return Response.json({ error: prefError.message }, { status: 500 });
  }

  let sent = 0;

  for (const pref of allPreferences ?? []) {
    const matched = matchScholarships(newScholarships as Scholarship[], pref as UserPreferences);
    if (matched.length === 0) continue;

    const rows = matched.map((s) => ({
      user_id: pref.user_id,
      scholarship_id: s.id,
    }));

    // ON CONFLICT DO NOTHING — avoids duplicates if cron runs twice
    const { error } = await supabase
      .from("notifications")
      .upsert(rows, { onConflict: "user_id,scholarship_id", ignoreDuplicates: true });

    if (error) {
      console.error(`Failed to insert notifications for ${pref.user_id}:`, error.message);
    } else {
      sent += matched.length;
    }
  }

  return Response.json({ sent, total: newScholarships.length });
}

function matchScholarships(
  scholarships: Scholarship[],
  pref: UserPreferences
): Scholarship[] {
  return scholarships.filter((s) => {
    const countryMatch =
      pref.countries.length === 0 || pref.countries.includes(s.country);
    const fieldMatch =
      pref.fields.length === 0 || pref.fields.includes(s.field);
    const degreeMatch =
      pref.degree_levels.length === 0 ||
      pref.degree_levels.includes(s.degree_level) ||
      s.degree_level === "any";
    return countryMatch && fieldMatch && degreeMatch;
  });
}
