import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import PreferencesForm from "./PreferencesForm";
import type { UserPreferences } from "@/lib/types";

export const metadata = { title: "My Alerts — ScholarHub" };

export default async function PreferencesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/preferences");

  const { data } = await supabase
    .from("preferences")
    .select("*")
    .eq("user_id", user.id)
    .single();

  const preferences: UserPreferences | null = data ?? null;

  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-10">
      <div className="mb-8">
        <p className="mb-1 text-xs font-medium uppercase tracking-widest text-muted-foreground">
          Account
        </p>
        <h1 className="text-3xl font-semibold tracking-tighter">My Alerts</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Choose what you care about and we'll email you when new<br />
          scholarships match your profile.
        </p>
      </div>

      <PreferencesForm preferences={preferences} />
    </main>
  );
}
