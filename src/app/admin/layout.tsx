import AdminNav from "@/components/admin/AdminNav";
import Link from "next/link";

export const metadata = { title: "Admin — ScholarHub" };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex">
      {/* ── Sidebar (desktop) ── */}
      <aside className="hidden md:flex w-56 shrink-0 flex-col border-r bg-muted/20">
        <div className="sticky top-14 flex h-[calc(100vh-3.5rem)] flex-col px-3 py-6">
          {/* Brand */}
          <div className="mb-6 px-3">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Admin Panel
            </p>
          </div>

          <AdminNav />

          {/* Footer */}
          <div className="mt-auto flex flex-col gap-1 border-t pt-4">
            <Link
              href="/"
              className="flex items-center rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              ← View site
            </Link>
          </div>
        </div>
      </aside>

      {/* ── Mobile top bar ── */}
      <div className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t bg-background px-4 py-2 md:hidden">
        <Link href="/admin" className="text-xs font-medium text-muted-foreground hover:text-foreground">
          Scholarships
        </Link>
        <Link href="/admin/brand" className="text-xs font-medium text-muted-foreground hover:text-foreground">
          Branding
        </Link>
        <Link href="/" className="text-xs font-medium text-muted-foreground hover:text-foreground">
          ← Site
        </Link>
      </div>

      {/* ── Main content ── */}
      <main className="min-h-[calc(100vh-3.5rem)] flex-1 overflow-x-auto px-6 py-8 pb-20 md:px-10 md:pb-8">
        {children}
      </main>
    </div>
  );
}
