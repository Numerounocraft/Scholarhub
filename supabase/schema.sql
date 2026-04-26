-- Run this in the Supabase SQL editor to set up the database

create table if not exists public.scholarships (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  country     text not null,
  field       text not null,
  degree_level text not null check (degree_level in ('undergraduate', 'masters', 'phd', 'any')),
  deadline    date not null,
  link        text not null,
  description text,
  eligibility text,
  created_at  timestamptz not null default now()
);

-- Add eligibility column if upgrading from an older schema
alter table public.scholarships add column if not exists eligibility text;

create table if not exists public.preferences (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  countries     text[] not null default '{}',
  fields        text[] not null default '{}',
  degree_levels text[] not null default '{}',
  updated_at    timestamptz not null default now(),
  unique (user_id)
);

-- Allow anyone to read scholarships
alter table public.scholarships enable row level security;
do $$ begin
  create policy "Anyone can read scholarships"
    on public.scholarships for select using (true);
exception when duplicate_object then null;
end $$;

-- Only admins can insert/update (enforced in API via user_metadata.role)
do $$ begin
  create policy "Admins can insert scholarships"
    on public.scholarships for insert
    with check (auth.jwt() ->> 'role' = 'admin');
exception when duplicate_object then null;
end $$;

-- Users can only read/write their own preferences
alter table public.preferences enable row level security;
do $$ begin
  create policy "Users manage own preferences"
    on public.preferences for all
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);
exception when duplicate_object then null;
end $$;

-- Unique constraint on link so the scraper can upsert without duplicates
do $$ begin
  alter table public.scholarships add constraint scholarships_link_unique unique (link);
exception when duplicate_table then null;
end $$;

-- Service role bypasses RLS for cron notifications
-- (service client automatically bypasses RLS)
