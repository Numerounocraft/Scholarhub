import Link from "next/link";

export const metadata = { title: "Admin — ScholarHub" };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="border-t">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-2.5 sm:px-6">
        <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
          Admin
        </span>
        <Link href="/" className="text-xs text-muted-foreground hover:text-foreground">
          ← Back to site
        </Link>
      </div>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</div>
    </div>
  );
}
