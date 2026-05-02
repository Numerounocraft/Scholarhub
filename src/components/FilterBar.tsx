"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Filters {
  search: string;
  country: string;
  field: string;
  degree_level: string;
}

interface FilterBarProps {
  filters: Filters;
  onChange: (filters: Filters) => void;
  countries: string[];
  fields: string[];
  total: number;
}

const degreeLevels = [
  { value: "undergraduate", label: "Undergraduate" },
  { value: "masters", label: "Master's" },
  { value: "phd", label: "PhD" },
];

export default function FilterBar({
  filters,
  onChange,
  countries,
  fields,
  total,
}: FilterBarProps) {
  const hasActive =
    filters.country || filters.field || filters.degree_level || filters.search;

  function set(key: keyof Filters, value: string) {
    onChange({ ...filters, [key]: value });
  }

  function reset() {
    onChange({ search: "", country: "", field: "", degree_level: "" });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        {/* Search */}
        <div className="relative min-w-56 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            placeholder="Search scholarships…"
            value={filters.search}
            onChange={(e) => set("search", e.target.value)}
            className="h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        <Select
          value={filters.country}
          onChange={(v) => set("country", v)}
          placeholder="Country"
        >
          {countries.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </Select>

        <Select
          value={filters.field}
          onChange={(v) => set("field", v)}
          placeholder="Field"
        >
          {fields.map((f) => (
            <option key={f} value={f}>{f}</option>
          ))}
        </Select>

        <Select
          value={filters.degree_level}
          onChange={(v) => set("degree_level", v)}
          placeholder="Degree"
        >
          {degreeLevels.map((d) => (
            <option key={d.value} value={d.value}>{d.label}</option>
          ))}
        </Select>

        {hasActive && (
          <button
            onClick={reset}
            className="inline-flex h-9 items-center gap-1.5 rounded-md px-3 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="h-3 w-3" />
            Clear
          </button>
        )}
      </div>

    </div>
  );
}

function Select({
  value,
  onChange,
  placeholder,
  children,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Parse options from children
  const options = Array.isArray(children)
    ? (children as React.ReactElement<{ value: string; children: string }>[]).map((child) => ({
        value: child.props.value as string,
        label: child.props.children as string,
      }))
    : [];

  const selectedLabel = options.find((o) => o.value === value)?.label;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <motion.button
        type="button"
        whileTap={{ scale: 0.98 }}
        onClick={() => setIsOpen((o) => !o)}
        className={cn(
          "inline-flex h-9 items-center justify-between gap-2 rounded-xl border border-input bg-background pl-3 pr-2.5 text-xs transition-colors hover:bg-accent",
          value ? "text-foreground" : "text-muted-foreground"
        )}
      >
        <span>{selectedLabel ?? placeholder}</span>
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        </motion.span>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 top-full z-50 mt-1.5 min-w-[10rem] max-h-60 overflow-y-auto rounded-xl border border-input bg-background shadow-md"
          >
            <motion.button
              type="button"
              onClick={() => { onChange(""); setIsOpen(false); }}
              className={cn(
                "flex w-full items-center justify-between px-3 py-2 text-left text-xs transition-colors hover:bg-accent",
                !value ? "text-foreground font-medium" : "text-muted-foreground"
              )}
            >
              {placeholder}
              {!value && <Check className="h-3 w-3" />}
            </motion.button>

            {options.map((option, index) => (
              <motion.button
                key={option.value}
                type="button"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.12, delay: index * 0.03 }}
                onClick={() => { onChange(option.value); setIsOpen(false); }}
                className={cn(
                  "flex w-full items-center justify-between px-3 py-2 text-left text-xs transition-colors hover:bg-accent",
                  value === option.value ? "text-foreground font-medium" : "text-muted-foreground"
                )}
              >
                {option.label}
                {value === option.value && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  >
                    <Check className="h-3 w-3" />
                  </motion.span>
                )}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
