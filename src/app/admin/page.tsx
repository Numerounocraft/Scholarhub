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

function ScholarshipRow({ s }: { s: Scholarship }) {
  return (
    <tr className="border-b last:border-0 hover:bg-muted/40 transition-colors">
      <td className="px-4 py-3 text-sm max-w-[260px]">
        <a
          href={s.link}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium hover:underline line-clamp-2"
        >
          {s.title}
        </a>
      </td>
      <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">{s.country}</td>
      <td className="px-4 py-3 text-sm text-muted-foreground hidden md:table-cell">{s.field}</td>
      <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap hidden sm:table-cell">
        {DEGREE_LABEL[s.degree_level] ?? s.degree_level}
      </td>
      <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">
        {formatDate(s.deadline)}
      </td>
      <td className="px-4 py-3 whitespace-nowrap">
        <div className="flex items-center gap-3">
          <Link
            href={`/admin/scholarships/${s.id}/edit`}
            className="text-xs text-primary hover:underline"
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
    <thead className="bg-muted/50">
      <tr>
        <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground">Title</th>
        <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground">Country</th>
        <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground hidden md:table-cell">Field</th>
        <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground hidden sm:table-cell">Degree</th>
        <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground">Deadline</th>
        <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground">Actions</th>
      </tr>
    </thead>
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
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Scholarships</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {totalCount ?? 0} total entries
          </p>
        </div>
        <Link
          href="/admin/scholarships/new"
          className="h-9 rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 flex items-center gap-1.5"
        >
          <span className="text-base leading-none">+</span> Add scholarship
        </Link>
      </div>

      {/* New Entries */}
      <section>
        <h2 className="mb-3 text-sm font-semibold">
          New Entries
          <span className="ml-2 text-xs font-normal text-muted-foreground">
            last {Math.min(NEW_COUNT, newEntries?.length ?? 0)} added
          </span>
        </h2>
        <div className="rounded-lg border overflow-hidden">
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
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">
              No scholarships yet.{" "}
              <Link href="/admin/scholarships/new" className="text-primary hover:underline">
                Add the first one.
              </Link>
            </p>
          )}
        </div>
      </section>

      {/* Old Entries */}
      {totalOld > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold">
            All Entries
            <span className="ml-2 text-xs font-normal text-muted-foreground">
              page {safePage} of {totalPages}
            </span>
          </h2>
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full">
              <TableHead />
              <tbody>
                {(oldEntries ?? []).map((s) => (
                  <ScholarshipRow key={s.id} s={s as Scholarship} />
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between text-sm">
              {safePage > 1 ? (
                <Link
                  href={`/admin?page=${safePage - 1}`}
                  className="text-primary hover:underline"
                >
                  ← Previous
                </Link>
              ) : (
                <span />
              )}
              <span className="text-muted-foreground text-xs">
                {safePage} / {totalPages}
              </span>
              {safePage < totalPages ? (
                <Link
                  href={`/admin?page=${safePage + 1}`}
                  className="text-primary hover:underline"
                >
                  Next →
                </Link>
              ) : (
                <span />
              )}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
