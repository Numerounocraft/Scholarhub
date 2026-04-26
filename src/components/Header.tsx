import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function Header() {
  let user = null;
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch {
    // Supabase not configured — render unauthenticated
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary">
            <span className="text-[11px] font-bold text-primary-foreground">S</span>
          </div>
          <span className="text-sm font-semibold tracking-tight">ScholarHub</span>
        </Link>

        <nav className="flex items-center gap-1">
          {user ? (
            <>
              <Link
                href="/preferences"
                className="inline-flex h-8 items-center rounded-md px-3 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                Preferences
              </Link>
              <div className="ml-2 h-4 w-px bg-border" />
              <form action="/api/auth/signout" method="POST" className="ml-2">
                <button
                  type="submit"
                  className="inline-flex h-8 items-center rounded-full border border-input px-3 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                >
                  Sign out
                </button>
              </form>
              <div className="ml-2 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
                {user.email?.[0].toUpperCase()}
              </div>
            </>
          ) : (
            <Link
              href="/login"
              className="inline-flex h-8 items-center rounded-full bg-primary px-3 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
            >
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
