"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import FilterBar, { type Filters } from "@/components/FilterBar";
import ScholarshipCard from "@/components/ScholarshipCard";
import ScholarshipDrawer from "@/components/ScholarshipDrawer";
import type { Scholarship } from "@/lib/types";

type Category = "Scholarships" | "Grants" | "Fellowships" | "Other";

const CATEGORY_ORDER: Category[] = ["Scholarships", "Grants", "Fellowships", "Other"];

function detectCategory(title: string): Category {
  const t = title.toLowerCase();
  if (t.includes("fellowship")) return "Fellowships";
  if (t.includes("grant")) return "Grants";
  if (t.includes("scholarship")) return "Scholarships";
  return "Other";
}

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: "easeOut" as const, delay: i * 0.06 },
  }),
};

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
  const [allScholarships, setAllScholarships] = useState<Scholarship[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [activeScholarship, setActiveScholarship] = useState<Scholarship | null>(null);
  const [activeTab, setActiveTab] = useState<Category>("Scholarships");

  // Load all scholarships once to populate filter options
  useEffect(() => {
    fetch("/api/scholarships")
      .then((r) => r.json())
      .then((data) => setAllScholarships(data))
      .catch(() => {});
  }, []);

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

  // Derive filter options from the full unfiltered list so selecting one filter
  // doesn't collapse the options in the other dropdowns.
  const countries = useMemo(
    () => [...new Set(allScholarships.map((s) => s.country))].sort(),
    [allScholarships]
  );
  const fields = useMemo(
    () => [...new Set(allScholarships.map((s) => s.field))].sort(),
    [allScholarships]
  );

  const grouped = useMemo(() => {
    const map = new Map<Category, Scholarship[]>();
    for (const cat of CATEGORY_ORDER) map.set(cat, []);
    for (const s of displayed) map.get(detectCategory(s.title))!.push(s);
    return map;
  }, [displayed]);

  const visibleTabs = CATEGORY_ORDER.filter((cat) => (grouped.get(cat)?.length ?? 0) > 0);

  const tabItems = grouped.get(activeTab) ?? [];

  return (
    <div className="flex flex-col gap-4">
      <ScholarshipDrawer
        scholarship={activeScholarship}
        onClose={() => setActiveScholarship(null)}
      />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut", delay: 0.3 }}
      >
        <FilterBar
          filters={filters}
          onChange={setFilters}
          countries={countries}
          fields={fields}
          total={displayed.length}
        />
      </motion.div>

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
        <div className="flex flex-col gap-4">
          {/* Tab bar */}
          <div className="flex items-center gap-1">
            {visibleTabs.map((cat) => {
              const count = grouped.get(cat)?.length ?? 0;
              const isActive = activeTab === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveTab(cat)}
                  className={`relative flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {cat}
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-xs font-medium ${
                      isActive
                        ? "bg-foreground text-background"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {count}
                  </span>
                  {isActive && (
                    <motion.div
                      layoutId="tab-underline"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground"
                    />
                  )}
                </button>
              );
            })}
            <span className="ml-auto rounded border border-input bg-background p-1 text-xs text-muted-foreground">
              {displayed.length} scholarship{displayed.length === 1 ? "" : "s"}
            </span>
          </div>

          {/* Tab content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
            >
              {tabItems.map((s, i) => (
                <motion.div
                  key={s.id}
                  custom={i}
                  variants={cardVariants}
                  initial="hidden"
                  animate="show"
                >
                  <ScholarshipCard scholarship={s} onDetails={setActiveScholarship} />
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
