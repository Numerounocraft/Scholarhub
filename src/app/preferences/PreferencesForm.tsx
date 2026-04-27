"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { UserPreferences, DegreeLevel } from "@/lib/types";

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

function ToggleChip({
  label,
  selected,
  onToggle,
}: {
  label: string;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
        selected
          ? "border-primary bg-primary text-primary-foreground"
          : "border-input bg-background text-muted-foreground hover:border-foreground/30 hover:text-foreground"
      )}
    >
      {label}
    </button>
  );
}

function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div>
        <h2 className="text-sm font-medium">{title}</h2>
        {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
      </div>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

export default function PreferencesForm({
  preferences,
}: {
  preferences: UserPreferences | null;
}) {
  const [countries, setCountries] = useState<string[]>(
    preferences?.countries ?? []
  );
  const [fields, setFields] = useState<string[]>(preferences?.fields ?? []);
  const [degreeLevels, setDegreeLevels] = useState<DegreeLevel[]>(
    preferences?.degree_levels ?? []
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  function toggle<T extends string>(
    list: T[],
    setList: (v: T[]) => void,
    value: T
  ) {
    setList(
      list.includes(value) ? list.filter((v) => v !== value) : [...list, value]
    );
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    setError("");
    setSaved(false);

    const res = await fetch("/api/preferences", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ countries, fields, degree_levels: degreeLevels }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Failed to save preferences.");
    } else {
      setSaved(true);
    }

    setSaving(false);
  }

  return (
    <div className="flex flex-col gap-8">
      <Section
        title="Countries"
        hint="Leave empty to receive scholarships from all countries."
      >
        {ALL_COUNTRIES.map((c) => (
          <ToggleChip
            key={c}
            label={c}
            selected={countries.includes(c)}
            onToggle={() => toggle(countries, setCountries, c)}
          />
        ))}
      </Section>

      <div className="h-px bg-border" />

      <Section
        title="Fields of Study"
        hint="Leave empty to match any field."
      >
        {ALL_FIELDS.map((f) => (
          <ToggleChip
            key={f}
            label={f}
            selected={fields.includes(f)}
            onToggle={() => toggle(fields, setFields, f)}
          />
        ))}
      </Section>

      <div className="h-px bg-border" />

      <Section title="Degree Level">
        {DEGREE_LEVELS.map(({ value, label }) => (
          <ToggleChip
            key={value}
            label={label}
            selected={degreeLevels.includes(value)}
            onToggle={() => toggle(degreeLevels, setDegreeLevels, value)}
          />
        ))}
      </Section>

      <div className="h-px bg-border" />

      <div className="flex items-center justify-between">
        <div>
          {saved && (
            <p className="text-xs text-muted-foreground">
              Preferences saved.
            </p>
          )}
          {error && (
            <p className="text-xs text-destructive">{error}</p>
          )}
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="h-9 rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save preferences"}
        </button>
      </div>
    </div>
  );
}
