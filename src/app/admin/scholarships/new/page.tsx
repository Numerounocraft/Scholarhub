import ScholarshipForm from "@/components/admin/ScholarshipForm";
import Link from "next/link";

export const metadata = { title: "Add Scholarship — Admin" };

export default function NewScholarshipPage() {
  return (
    <div className="max-w-2xl">
      <div className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/admin" className="hover:text-foreground">Admin</Link>
        <span>/</span>
        <span className="text-foreground">New scholarship</span>
      </div>
      <h1 className="mb-8 text-xl font-semibold">Add scholarship</h1>
      <ScholarshipForm />
    </div>
  );
}
