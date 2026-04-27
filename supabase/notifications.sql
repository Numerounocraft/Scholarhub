-- Run this in the Supabase SQL editor after schema.sql

create table if not exists public.notifications (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  scholarship_id uuid not null references public.scholarships(id) on delete cascade,
  read           boolean not null default false,
  created_at     timestamptz not null default now(),
  unique (user_id, scholarship_id)
);

alter table public.notifications enable row level security;

do $$ begin
  create policy "Users can read own notifications"
    on public.notifications for select
    using (auth.uid() = user_id);
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Users can update own notifications"
    on public.notifications for update
    using (auth.uid() = user_id);
exception when duplicate_object then null;
end $$;

-- Service role inserts notifications on behalf of users (cron job)
do $$ begin
  create policy "Service role can insert notifications"
    on public.notifications for insert
    with check (true);
exception when duplicate_object then null;
end $$;
