import type { DegreeLevel } from "@/lib/types";

export const COUNTRY_KEYWORDS: [string, string][] = [
  ["united states", "United States"], ["u.s.a", "United States"], [" usa ", "United States"],
  ["united kingdom", "United Kingdom"], [" uk ", "United Kingdom"], ["britain", "United Kingdom"],
  ["germany", "Germany"], ["australia", "Australia"], ["canada", "Canada"],
  ["france", "France"], ["netherlands", "Netherlands"], ["japan", "Japan"],
  ["china", "China"], ["sweden", "Sweden"], ["norway", "Norway"],
  ["denmark", "Denmark"], ["switzerland", "Switzerland"], ["singapore", "Singapore"],
  ["south korea", "South Korea"], ["new zealand", "New Zealand"], ["finland", "Finland"],
];

export const FIELD_KEYWORDS: [string, string][] = [
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

export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/&[a-z]+;/gi, " ").replace(/\s+/g, " ").trim();
}

export function extractEligibility(text: string): string | null {
  const sectionPatterns = [
    /eligibility[:\s–-]+([^.]*(?:\.[^.]*){0,5})/i,
    /who can apply[:\s–-]+([^.]*(?:\.[^.]*){0,5})/i,
    /requirements[:\s–-]+([^.]*(?:\.[^.]*){0,5})/i,
    /criteria[:\s–-]+([^.]*(?:\.[^.]*){0,5})/i,
  ];

  for (const pattern of sectionPatterns) {
    const match = text.match(pattern);
    const captured = match?.[1]?.trim() ?? "";
    if (captured.length > 20) return captured.slice(0, 800);
  }

  const sentences = text.split(/(?<=[.!?])\s+/);
  const eligibilitySentences = sentences.filter((s) =>
    /must (be|have)|eligible|citizen|national|applicant|open to|requirement|qualif|enroll|degree|gpa|age limit/i.test(s)
  );

  if (eligibilitySentences.length > 0) {
    return eligibilitySentences.slice(0, 4).join(" ").slice(0, 800);
  }

  return null;
}

export function classify<T extends string>(
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

export function detectDegree(text: string): DegreeLevel {
  const lower = text.toLowerCase();
  if (/phd|doctoral|doctorate/.test(lower)) return "phd";
  if (/master|msc|mba|postgraduate|post-graduate/.test(lower)) return "masters";
  if (/undergraduate|bachelor|bsc|first degree/.test(lower)) return "undergraduate";
  return "any";
}

export function detectDeadline(text: string): string {
  const lower = text.toLowerCase();

  const m1 = lower.match(
    /\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2})[,\s]+(\d{4})\b/
  );
  if (m1) {
    const d = new Date(parseInt(m1[3]), MONTHS[m1[1]] - 1, parseInt(m1[2]));
    if (d > new Date()) return d.toISOString().split("T")[0];
  }

  const m2 = lower.match(
    /\b(\d{1,2})\s+(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{4})\b/
  );
  if (m2) {
    const d = new Date(parseInt(m2[3]), MONTHS[m2[2]] - 1, parseInt(m2[1]));
    if (d > new Date()) return d.toISOString().split("T")[0];
  }

  const m3 = text.match(/\b(202[6-9]|203\d)-(\d{2})-(\d{2})\b/);
  if (m3) {
    const d = new Date(m3[0]);
    if (d > new Date()) return m3[0];
  }

  const fallback = new Date();
  fallback.setDate(fallback.getDate() + 90);
  return fallback.toISOString().split("T")[0];
}
