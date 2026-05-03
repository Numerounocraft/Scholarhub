import { createClient, createServiceClient } from "@/lib/supabase/server";
import { z } from "zod";

const scholarshipSchema = z.object({
  title: z.string().min(1),
  country: z.string().min(1),
  field: z.string().min(1),
  degree_level: z.enum(["undergraduate", "masters", "phd", "any"]),
  deadline: z.string().min(1),
  link: z.url(),
  description: z.string().optional(),
  eligibility: z.string().optional(),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const country = searchParams.get("country");
  const field = searchParams.get("field");
  const degree_level = searchParams.get("degree_level");
  const before = searchParams.get("before"); // ISO date — filter deadlines on or before

  const supabase = await createClient();

  let query = supabase
    .from("scholarships")
    .select("*")
    .gte("deadline", new Date().toISOString().split("T")[0]) // only future deadlines
    .order("deadline", { ascending: true });

  if (country) query = query.eq("country", country);
  if (field) query = query.eq("field", field);
  if (degree_level) query = query.eq("degree_level", degree_level);
  if (before) query = query.lte("deadline", before);

  const { data, error } = await query;

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json(data);
}

export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Only admins can create scholarships — check user metadata
  if (user.user_metadata?.role !== "admin") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = scholarshipSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const service = createServiceClient();
  const { data, error } = await service
    .from("scholarships")
    .insert(parsed.data)
    .select()
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json(data, { status: 201 });
}
