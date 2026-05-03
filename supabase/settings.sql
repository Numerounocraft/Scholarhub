-- Site-wide settings table for brand name, logo URL, etc.
-- Run this once in the Supabase SQL editor.

create table if not exists public.site_settings (
  key   text primary key,
  value text not null,
  updated_at timestamptz default now()
);

alter table public.site_settings enable row level security;

do $$ begin
  create policy "Public can read site_settings"
    on public.site_settings for select using (true);
exception when duplicate_object then null;
end $$;

-- Default values
insert into public.site_settings (key, value) values
  ('brand_name', 'ScholarHub'),
  ('logo_url',   '/logo.svg')
on conflict (key) do nothing;
