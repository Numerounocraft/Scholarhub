"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, BookOpen, GraduationCap,
  ExternalLink, Clock, Globe,
} from "lucide-react";
import { differenceInDays, parseISO, format } from "date-fns";
import type { Scholarship } from "@/lib/types";
import { cn } from "@/lib/utils";

const degreeLabels: Record<string, string> = {
  undergraduate: "Undergraduate",
  masters: "Master's",
  phd: "PhD",
  any: "Any level",
};

function toEligibilityBullets(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 10);
}

interface Props {
  scholarship: Scholarship | null;
  onClose: () => void;
}

export default function ScholarshipDrawer({ scholarship, onClose }: Props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    if (scholarship) {
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = "hidden";
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    } else {
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    }
    return () => {
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    };
  }, [scholarship]);

  const daysLeft = scholarship
    ? differenceInDays(parseISO(scholarship.deadline), new Date())
    : 0;

  const urgencyColor =
    daysLeft < 0
      ? "bg-gray-100 text-gray-500"
      : daysLeft <= 14
      ? "bg-red-50 text-red-600"
      : daysLeft <= 30
      ? "bg-amber-50 text-amber-600"
      : "bg-emerald-50 text-emerald-600";

  const urgencyIconColor =
    daysLeft < 0
      ? "bg-gray-200 text-gray-500"
      : daysLeft <= 14
      ? "bg-red-500 text-white"
      : daysLeft <= 30
      ? "bg-amber-500 text-white"
      : "bg-emerald-500 text-white";

  const urgencyLabel =
    daysLeft < 0
      ? "Expired"
      : daysLeft === 0
      ? "Due today"
      : daysLeft === 1
      ? "1 day left"
      : `${daysLeft} days left`;

  const formattedDeadline = scholarship
    ? format(parseISO(scholarship.deadline), "MMMM d, yyyy")
    : "";

  const eligibilityBullets = scholarship?.eligibility
    ? toEligibilityBullets(scholarship.eligibility)
    : [];

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {scholarship && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.aside
            key="drawer"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed right-0 top-0 z-50 flex h-full w-full max-w-lg flex-col bg-background shadow-2xl"
          >
            {/* Header bar */}
            <div className="flex items-center justify-between border-b px-6 py-4">
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-100 px-3 py-1 text-xs font-medium text-violet-700">
                  <BookOpen className="h-3 w-3" />
                  {scholarship.field}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
                  <GraduationCap className="h-3 w-3" />
                  {degreeLabels[scholarship.degree_level] ?? scholarship.degree_level}
                </span>
              </div>
              <button
                onClick={onClose}
                className="ml-3 shrink-0 rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Scrollable body */}
            <div className="flex flex-1 flex-col overflow-y-auto">

              {/* Title + description */}
              <div className="px-6 pt-5 pb-5">
                <h2 className="text-2xl font-bold leading-snug text-foreground">
                  {scholarship.title}
                </h2>

                {scholarship.description && (
                  <p className="mt-3 text-sm leading-relaxed text-description">
                    {scholarship.description}
                  </p>
                )}
              </div>

              {/* Deadline row */}
              <div className="border-t px-6 py-5">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                    urgencyIconColor
                  )}>
                    <Clock className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Application Deadline</p>
                    <p className="text-sm text-muted-foreground">
                      {formattedDeadline}
                      <span className={cn(
                        "ml-2 rounded-full px-2 py-0.5 text-xs font-medium",
                        urgencyColor
                      )}>
                        {urgencyLabel}
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Eligibility Requirements */}
              {eligibilityBullets.length > 0 && (
                <div className="border-t px-6 py-5">
                  <h3 className="mb-4 text-lg font-bold text-foreground">
                    Eligibility Requirements
                  </h3>
                  <ul className="space-y-2.5">
                    {eligibilityBullets.map((point, i) => (
                      <li key={i} className="flex items-start gap-2.5">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground/40" />
                        <span className="text-sm leading-relaxed text-description">
                          {point}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Key details grid */}
              <div className="border-t px-6 py-5">
                <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Key Details
                </h3>
                <div className="grid grid-cols-1 gap-4">

                  <div className="flex items-start gap-4 rounded-xl border bg-muted/20 px-4 py-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                      <Globe className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Country / Location</p>
                      <p className="mt-0.5 text-sm font-medium">{scholarship.country}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 rounded-xl border bg-muted/20 px-4 py-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-600">
                      <BookOpen className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Field of Study</p>
                      <p className="mt-0.5 text-sm font-medium">{scholarship.field}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 rounded-xl border bg-muted/20 px-4 py-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                      <GraduationCap className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Degree Level</p>
                      <p className="mt-0.5 text-sm font-medium">
                        {degreeLabels[scholarship.degree_level] ?? scholarship.degree_level}
                      </p>
                    </div>
                  </div>

                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t bg-background px-6 py-4">
              <a
                href={scholarship.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Apply Now
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
              <p className="mt-2 text-center text-xs text-muted-foreground">
                You will be redirected to the official scholarship page
              </p>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
