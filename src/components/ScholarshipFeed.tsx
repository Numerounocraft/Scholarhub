"use client";

import { useState, useEffect, useMemo } from "react";
import FilterBar, { type Filters } from "@/components/FilterBar";
import ScholarshipCard from "@/components/ScholarshipCard";
import type { Scholarship } from "@/lib/types";

const EMPTY_FILTERS: Filters = {
  search: "",
  country: "",
  field: "",
  degree_level: "",
};

function SkeletonCard() {
  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-card p-5">
      <div className="h-4 w-3/4 animate-pulse rounded-md bg-muted" />
      <div className="h-3 w-full animate-pulse rounded-md bg-muted" />
      <div className="h-3 w-2/3 animate-pulse rounded-md bg-muted" />
      <div className="mt-1 flex gap-2">
        <div className="h-5 w-16 animate-pulse rounded-md bg-muted" />
        <div className="h-5 w-20 animate-pulse rounded-md bg-muted" />
        <div className="h-5 w-14 animate-pulse rounded-md bg-muted" />
      </div>
      <div className="mt-2 flex items-center justify-between">
        <div className="h-3 w-20 animate-pulse rounded-md bg-muted" />
        <div className="h-7 w-16 animate-pulse rounded-md bg-muted" />
      </div>
    </div>
  );
}

export default function ScholarshipFeed() {
  const [scholarships, setScholarships] = useState<Scholarship[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (filters.country) params.set("country", filters.country);
        if (filters.field) params.set("field", filters.field);
        if (filters.degree_level) params.set("degree_level", filters.degree_level);

        const res = await fetch(`/api/scholarships?${params}`);
        if (!res.ok) throw new Error("Failed to load scholarships");
        setScholarships(await res.json());
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [filters.country, filters.field, filters.degree_level]);

  const displayed = useMemo(() => {
    if (!filters.search.trim()) return scholarships;
    const q = filters.search.toLowerCase();
    return scholarships.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.country.toLowerCase().includes(q) ||
        s.field.toLowerCase().includes(q) ||
        s.description?.toLowerCase().includes(q)
    );
  }, [scholarships, filters.search]);

  const countries = useMemo(
    () => [...new Set(scholarships.map((s) => s.country))].sort(),
    [scholarships]
  );
  const fields = useMemo(
    () => [...new Set(scholarships.map((s) => s.field))].sort(),
    [scholarships]
  );

  return (
    <div className="flex flex-col gap-4">
      <FilterBar
        filters={filters}
        onChange={setFilters}
        countries={countries}
        fields={fields}
        total={displayed.length}
      />

      {loading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {!loading && error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {!loading && !error && displayed.length === 0 && (
        <div className="py-16 text-center">
          <p className="text-sm font-medium">No scholarships found</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Try adjusting your filters or check back later.
          </p>
        </div>
      )}

      {!loading && !error && displayed.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {displayed.map((s) => (
            <ScholarshipCard key={s.id} scholarship={s} />
          ))}
        </div>
      )}
    </div>
  );
}
