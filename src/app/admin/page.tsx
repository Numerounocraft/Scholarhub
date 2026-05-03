import { createServiceClient } from "@/lib/supabase/server";
import Link from "next/link";
import DeleteButton from "@/components/admin/DeleteButton";
import type { Scholarship } from "@/lib/types";

const NEW_COUNT = 20;
const PAGE_SIZE = 25;

const DEGREE_LABEL: Record<string, string> = {
  undergraduate: "UG",
  masters: "MSc",
  phd: "PhD",
  any: "Any",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function StatusBadge({ deadline }: { deadline: string }) {
  const isExpired = new Date(deadline) < new Date();
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
        isExpired
          ? "bg-destructive/10 text-destructive"
          : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
      }`}
    >
      {isExpired ? "Expired" : "Active"}
    </span>
  );
}

function ScholarshipRow({ s }: { s: Scholarship }) {
  return (
    <tr className="border-b last:border-0 hover:bg-muted/30 transition-colors">
      <td className="px-4 py-3">
        <div className="flex flex-col gap-0.5 max-w-[280px]">
          <a
            href={s.link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium leading-snug hover:underline line-clamp-2"
          >
            {s.title}
          </a>
          <span className="text-xs text-muted-foreground">{s.country} · {s.field}</span>
        </div>
      </td>
      <td className="px-4 py-3 hidden sm:table-cell">
        <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
          {DEGREE_LABEL[s.degree_level] ?? s.degree_level}
        </span>
      </td>
      <td className="px-4 py-3 hidden md:table-cell">
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">{formatDate(s.deadline)}</span>
          <StatusBadge deadline={s.deadline} />
        </div>
      </td>
      <td className="px-4 py-3 whitespace-nowrap">
        <div className="flex items-center gap-3">
          <Link
            href={`/admin/scholarships/${s.id}/edit`}
            className="rounded-md border border-input px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:bg-accent"
          >
            Edit
          </Link>
          <DeleteButton id={s.id} />
        </div>
      </td>
    </tr>
  );
}

function TableHead() {
  return (
    <thead className="border-b bg-muted/40">
      <tr>
        <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Scholarship</th>
        <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground hidden sm:table-cell">Degree</th>
        <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground hidden md:table-cell">Deadline</th>
        <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Actions</th>
      </tr>
    </thead>
  );
}

function SectionHeader({
  title,
  meta,
  action,
}: {
  title: string;
  meta: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <div>
        <h2 className="text-base font-semibold">{title}</h2>
        <p className="text-xs text-muted-foreground">{meta}</p>
      </div>
      {action}
    </div>
  );
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageStr } = await searchParams;
  const page = Math.max(1, parseInt(pageStr ?? "1"));

  const supabase = createServiceClient();

  const [{ data: newEntries }, { count: totalCount }] = await Promise.all([
    supabase
      .from("scholarships")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(NEW_COUNT),
    supabase
      .from("scholarships")
      .select("*", { count: "exact", head: true }),
  ]);

  const totalOld = Math.max(0, (totalCount ?? 0) - NEW_COUNT);
  const totalPages = Math.max(1, Math.ceil(totalOld / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const from = NEW_COUNT + (safePage - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const { data: oldEntries } = totalOld > 0
    ? await supabase
        .from("scholarships")
        .select("*")
        .order("created_at", { ascending: false })
        .range(from, to)
    : { data: [] as Scholarship[] };

  return (
    <div className="flex flex-col gap-10">

      {/* ── Page header ── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Scholarships</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {totalCount ?? 0} total entries in the database
          </p>
        </div>
        <Link
          href="/admin/scholarships/new"
          className="flex items-center gap-1.5 h-9 rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
        >
          <span className="text-base leading-none">+</span> Add scholarship
        </Link>
      </div>

      {/* ── Stats row ── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {[
          { label: "Total", value: totalCount ?? 0 },
          { label: "New Entries", value: Math.min(NEW_COUNT, newEntries?.length ?? 0) },
          { label: "Older Entries", value: totalOld },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-xl border bg-muted/20 px-5 py-4">
            <p className="text-2xl font-bold">{value}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      {/* ── New Entries ── */}
      <section>
        <SectionHeader
          title="New Entries"
          meta={`The last ${Math.min(NEW_COUNT, newEntries?.length ?? 0)} scholarships added`}
        />
        <div className="rounded-xl border overflow-hidden">
          {newEntries && newEntries.length > 0 ? (
            <table className="w-full">
              <TableHead />
              <tbody>
                {newEntries.map((s) => (
                  <ScholarshipRow key={s.id} s={s as Scholarship} />
                ))}
              </tbody>
            </table>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-sm font-medium">No scholarships yet</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Add your first scholarship to get started.
              </p>
              <Link
                href="/admin/scholarships/new"
                className="mt-4 h-8 rounded-full bg-primary px-4 text-xs font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 flex items-center"
              >
                + Add scholarship
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ── Older Entries ── */}
      {totalOld > 0 && (
        <section>
          <SectionHeader
            title="Older Entries"
            meta={`${totalOld} entries · page ${safePage} of ${totalPages}`}
            action={
              totalPages > 1 ? (
                <div className="flex items-center gap-3 text-sm">
                  {safePage > 1 ? (
                    <Link href={`/admin?page=${safePage - 1}`} className="text-primary hover:underline">
                      ← Prev
                    </Link>
                  ) : <span />}
                  <span className="text-xs text-muted-foreground">{safePage}/{totalPages}</span>
                  {safePage < totalPages ? (
                    <Link href={`/admin?page=${safePage + 1}`} className="text-primary hover:underline">
                      Next →
                    </Link>
                  ) : <span />}
                </div>
              ) : undefined
            }
          />
          <div className="rounded-xl border overflow-hidden">
            <table className="w-full">
              <TableHead />
              <tbody>
                {(oldEntries ?? []).map((s) => (
                  <ScholarshipRow key={s.id} s={s as Scholarship} />
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
