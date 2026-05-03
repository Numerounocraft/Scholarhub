import { createClient, createServiceClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const settingsSchema = z.object({
  brand_name: z.string().min(1).max(60),
  logo_url: z.string().min(1).max(500),
});

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, status: 401, error: "Unauthorized" };
  if (user.user_metadata?.role !== "admin") return { ok: false as const, status: 403, error: "Forbidden" };
  return { ok: true as const };
}

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return Response.json({ error: auth.error }, { status: auth.status });

  const service = createServiceClient();
  const { data, error } = await service.from("site_settings").select("key, value");
  if (error) return Response.json({ error: error.message }, { status: 500 });

  const map = Object.fromEntries((data ?? []).map(({ key, value }: { key: string; value: string }) => [key, value]));
  return Response.json(map);
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return Response.json({ error: auth.error }, { status: auth.status });

  const body = await request.json();
  const parsed = settingsSchema.safeParse(body);
  if (!parsed.success) return Response.json({ error: parsed.error.flatten() }, { status: 400 });

  const service = createServiceClient();
  const upserts = Object.entries(parsed.data).map(([key, value]) => ({
    key,
    value,
    updated_at: new Date().toISOString(),
  }));

  const { error } = await service
    .from("site_settings")
    .upsert(upserts, { onConflict: "key" });

  if (error) return Response.json({ error: error.message }, { status: 500 });

  revalidatePath("/", "layout");
  return Response.json({ ok: true });
}
