import { createServiceClient } from "@/lib/supabase/server";
import ScholarshipForm from "@/components/admin/ScholarshipForm";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Scholarship } from "@/lib/types";

export const metadata = { title: "Edit Scholarship — Admin" };

export default async function EditScholarshipPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("scholarships")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) notFound();

  return (
    <div className="max-w-2xl">
      <div className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/admin" className="hover:text-foreground">Admin</Link>
        <span>/</span>
        <span className="text-foreground line-clamp-1">{data.title}</span>
      </div>
      <h1 className="mb-8 text-xl font-semibold">Edit scholarship</h1>
      <ScholarshipForm scholarship={data as Scholarship} />
    </div>
  );
}
