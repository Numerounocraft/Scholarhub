"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, MapPin, BookOpen, GraduationCap, Calendar,
  ExternalLink, Clock, Globe, Tag,
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

interface Props {
  scholarship: Scholarship | null;
  onClose: () => void;
}

export default function ScholarshipDrawer({ scholarship, onClose }: Props) {
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
            {/* Header */}
            <div className="flex items-center justify-between border-b px-6 py-4">
              <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                Scholarship Details
              </p>
              <button
                onClick={onClose}
                className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Scrollable body */}
            <div className="flex flex-1 flex-col overflow-y-auto">

              {/* Hero section */}
              <div className="border-b bg-muted/30 px-6 py-6">
                <div className="mb-3 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-100 px-3 py-1 text-xs font-medium text-violet-700">
                    <BookOpen className="h-3 w-3" />
                    {scholarship.field}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
                    <GraduationCap className="h-3 w-3" />
                    {degreeLabels[scholarship.degree_level] ?? scholarship.degree_level}
                  </span>
                </div>
                <h2 className="text-xl font-bold leading-snug text-foreground">
                  {scholarship.title}
                </h2>
                <div className="mt-3 flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{scholarship.country}</span>
                </div>
              </div>

              {/* Deadline banner */}
              <div className={cn("flex items-center justify-between px-6 py-4 border-b", urgencyColor)}>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm font-semibold">{urgencyLabel}</span>
                </div>
                <span className="text-sm font-medium">{formattedDeadline}</span>
              </div>

              {/* Description */}
              {scholarship.description && (
                <div className="border-b px-6 py-6">
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    About this Scholarship
                  </h3>
                  <p className="text-sm leading-relaxed text-foreground">
                    {scholarship.description}
                  </p>
                </div>
              )}

              {/* Eligibility */}
              {scholarship.eligibility && (
                <div className="border-b px-6 py-6">
                  <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    Eligibility Requirements
                  </h3>
                  <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-4">
                    <p className="text-sm leading-relaxed text-amber-900">
                      {scholarship.eligibility}
                    </p>
                  </div>
                </div>
              )}

              {/* Key details grid */}
              <div className="px-6 py-6">
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

                  <div className="flex items-start gap-4 rounded-xl border bg-muted/20 px-4 py-3">
                    <div className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                      daysLeft <= 14 && daysLeft >= 0 ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-600"
                    )}>
                      <Calendar className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Application Deadline</p>
                      <p className="mt-0.5 text-sm font-medium">{formattedDeadline}</p>
                      <p className={cn("text-xs mt-0.5", urgencyColor.split(" ")[1])}>
                        {urgencyLabel}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 rounded-xl border bg-muted/20 px-4 py-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-600">
                      <Tag className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">Official Link</p>
                      <a
                        href={scholarship.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-0.5 block truncate text-sm font-medium text-primary underline-offset-4 hover:underline"
                      >
                        {scholarship.link}
                      </a>
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
