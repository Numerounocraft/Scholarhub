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

const { data, error } = await supabase
  .from("scholarships")
  .select("id, title, field, country, deadline")
  .order("created_at", { ascending: false });

if (error) { console.error(error); process.exit(1); }

const SCHOLARSHIP_RE = /scholarship|grant|fellowship|award|bursary|funding|study abroad|exchange program/i;

const suspicious = data.filter(s => !SCHOLARSHIP_RE.test(s.title));

console.log(`Total entries: ${data.length}`);
console.log(`Suspicious (no scholarship keyword in title): ${suspicious.length}\n`);

for (const s of suspicious) {
  console.log(`[${s.id}] ${s.title}`);
  console.log(`       field=${s.field} | country=${s.country} | deadline=${s.deadline ?? "none"}\n`);
}
