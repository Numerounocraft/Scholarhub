import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export type SiteSettings = {
  brand_name: string;
  logo_url: string;
};

const DEFAULTS: SiteSettings = {
  brand_name: "ScholarHub",
  logo_url: "/logo.svg",
};

// Cached per-request so multiple server components don't hit the DB twice.
export const getSiteSettings = cache(async (): Promise<SiteSettings> => {
  try {
    const supabase = await createClient();
    const { data } = await supabase.from("site_settings").select("key, value");
    if (!data) return DEFAULTS;
    const map = Object.fromEntries(
      (data as { key: string; value: string }[]).map(({ key, value }) => [key, value])
    );
    return {
      brand_name: map.brand_name ?? DEFAULTS.brand_name,
      logo_url: map.logo_url ?? DEFAULTS.logo_url,
    };
  } catch {
    return DEFAULTS;
  }
});
