"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Scholarship, DegreeLevel } from "@/lib/types";

const ALL_COUNTRIES = [
  "Australia", "Austria", "Belgium", "Brazil", "Canada",
  "China", "Czech Republic", "Denmark", "Finland", "France",
  "Germany", "India", "Ireland", "Italy", "Japan",
  "Netherlands", "New Zealand", "Norway", "Singapore", "South Korea",
  "Spain", "Sweden", "Switzerland", "Turkey", "United Kingdom",
  "United States",
];

const ALL_FIELDS = [
  "Agriculture", "Architecture", "Arts & Humanities", "Business",
  "Computer Science", "Education", "Engineering", "Environmental Science",
  "Law", "Mathematics", "Medicine & Health", "Natural Sciences",
  "Public Policy", "Social Sciences",
];

const DEGREE_LEVELS: { value: DegreeLevel; label: string }[] = [
  { value: "undergraduate", label: "Undergraduate" },
  { value: "masters", label: "Master's" },
  { value: "phd", label: "PhD" },
  { value: "any", label: "Any level" },
];

const inputClass =
  "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40";
const labelClass = "block text-sm font-medium mb-1";

export default function ScholarshipForm({
  scholarship,
}: {
  scholarship?: Scholarship;
}) {
  const router = useRouter();
  const isEdit = !!scholarship;

  const [form, setForm] = useState({
    title: scholarship?.title ?? "",
    country: scholarship?.country ?? "",
    field: scholarship?.field ?? "",
    degree_level: (scholarship?.degree_level ?? "any") as DegreeLevel,
    deadline: scholarship?.deadline ?? "",
    link: scholarship?.link ?? "",
    description: scholarship?.description ?? "",
    eligibility: scholarship?.eligibility ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function set(key: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const body = {
      title: form.title,
      country: form.country,
      field: form.field,
      degree_level: form.degree_level,
      deadline: form.deadline,
      link: form.link,
      description: form.description || undefined,
      eligibility: form.eligibility || undefined,
    };

    const res = await fetch(
      isEdit ? `/api/scholarships/${scholarship!.id}` : "/api/scholarships",
      {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    );

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(typeof data.error === "string" ? data.error : "Something went wrong.");
      setSaving(false);
      return;
    }

    router.push("/admin");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {/* Row 1: Title (full width) */}
      <div>
        <label className={labelClass}>Title <span className="text-destructive">*</span></label>
        <input
          required
          type="text"
          value={form.title}
          onChange={(e) => set("title", e.target.value)}
          placeholder="e.g. Fulbright Foreign Student Program"
          className={inputClass}
        />
      </div>

      {/* Row 2: Country + Field */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Country <span className="text-destructive">*</span></label>
          <select
            required
            value={form.country}
            onChange={(e) => set("country", e.target.value)}
            className={inputClass}
          >
            <option value="">Select country…</option>
            {ALL_COUNTRIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Field <span className="text-destructive">*</span></label>
          <select
            required
            value={form.field}
            onChange={(e) => set("field", e.target.value)}
            className={inputClass}
          >
            <option value="">Select field…</option>
            {ALL_FIELDS.map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Row 3: Degree + Deadline */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Degree Level <span className="text-destructive">*</span></label>
          <select
            required
            value={form.degree_level}
            onChange={(e) => set("degree_level", e.target.value)}
            className={inputClass}
          >
            {DEGREE_LEVELS.map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Deadline <span className="text-destructive">*</span></label>
          <input
            required
            type="date"
            value={form.deadline}
            onChange={(e) => set("deadline", e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      {/* Row 4: Apply link (full width) */}
      <div>
        <label className={labelClass}>Apply link <span className="text-destructive">*</span></label>
        <input
          required
          type="url"
          value={form.link}
          onChange={(e) => set("link", e.target.value)}
          placeholder="https://…"
          className={inputClass}
        />
      </div>

      <div className="h-px bg-border" />

      {/* Row 5: Description */}
      <div>
        <label className={labelClass}>Description <span className="text-muted-foreground font-normal">(optional)</span></label>
        <textarea
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          rows={5}
          placeholder="Overview of the scholarship, benefits, coverage…"
          className={inputClass}
        />
      </div>

      {/* Row 6: Eligibility */}
      <div>
        <label className={labelClass}>Eligibility <span className="text-muted-foreground font-normal">(optional)</span></label>
        <textarea
          value={form.eligibility}
          onChange={(e) => set("eligibility", e.target.value)}
          rows={4}
          placeholder="Who can apply, requirements, restrictions…"
          className={inputClass}
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={() => router.push("/admin")}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="h-9 rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:opacity-50"
        >
          {saving ? "Saving…" : isEdit ? "Save changes" : "Add scholarship"}
        </button>
      </div>
    </form>
  );
}
