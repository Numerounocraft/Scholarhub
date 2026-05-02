import { ExternalLink, Calendar, MapPin, BookOpen, GraduationCap } from "lucide-react";
import { formatDistanceToNow, parseISO, differenceInDays } from "date-fns";
import type { Scholarship } from "@/lib/types";
import { cn } from "@/lib/utils";

const degreeLabels: Record<string, string> = {
  undergraduate: "Undergraduate",
  masters: "Master's",
  phd: "PhD",
  any: "Any level",
};

function Badge({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium",
        className
      )}
    >
      {children}
    </span>
  );
}

function DeadlineChip({ deadline }: { deadline: string }) {
  const date = parseISO(deadline);
  const daysLeft = differenceInDays(date, new Date());
  const label = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const urgency =
    daysLeft < 0
      ? "text-muted-foreground line-through"
      : daysLeft <= 14
      ? "text-destructive"
      : "text-muted-foreground";

  return (
    <span className={cn("inline-flex items-center gap-1 text-xs", urgency)}>
      <Calendar className="h-3 w-3" />
      {daysLeft < 0
        ? "Expired"
        : daysLeft === 0
        ? "Due today"
        : daysLeft <= 14
        ? `${daysLeft}d left`
        : label}
    </span>
  );
}

export default function ScholarshipCard({
  scholarship,
  onDetails,
}: {
  scholarship: Scholarship;
  onDetails?: (s: Scholarship) => void;
}) {
  const { title, country, field, degree_level, deadline, link, description } =
    scholarship;

  return (
    <div className="group flex h-full flex-col rounded-lg border bg-card p-5 transition-all hover:shadow-sm">
      {/* Title row */}
      <div className="flex items-start justify-between gap-3">
        <h3 className="line-clamp-2 min-h-[2.4rem] text-sm font-semibold leading-snug text-card-foreground transition-colors group-hover:text-primary">
          {title}
        </h3>
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Open link"
          className="mt-0.5 shrink-0 text-muted-foreground/50 transition-colors hover:text-foreground"
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>

      {/* Description — always reserves 2-line height */}
      <p className="mt-2 line-clamp-2 min-h-[2.5rem] text-xs leading-relaxed text-description">
        {description ?? ""}
      </p>

      {/* Badges */}
      <div className="mt-3 flex flex-wrap gap-1.5">
        <Badge className="border-blue-200 bg-blue-50 text-blue-700">
          <MapPin className="h-2.5 w-2.5" />
          {country}
        </Badge>
        <Badge className="border-violet-200 bg-violet-50 text-violet-700">
          <BookOpen className="h-2.5 w-2.5" />
          {field}
        </Badge>
        <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700">
          <GraduationCap className="h-2.5 w-2.5" />
          {degreeLabels[degree_level] ?? degree_level}
        </Badge>
      </div>

      {/* Footer — pinned to bottom */}
      <div className="mt-auto pt-4 flex items-center justify-between">
        <DeadlineChip deadline={deadline} />
        <div className="flex items-center gap-2">
          {onDetails && (
            <button
              onClick={() => onDetails(scholarship)}
              className="inline-flex h-7 items-center rounded-full border border-input px-3 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              Details
            </button>
          )}
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-7 items-center rounded-full bg-primary px-3 text-xs font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
          >
            Apply
          </a>
        </div>
      </div>
    </div>
  );
}
