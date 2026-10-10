-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─────────────────────────────────────────
-- PROFILES (extends auth.users)
-- ─────────────────────────────────────────
create table if not exists public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  email        text,
  full_name    text,
  avatar_url   text,
  plan         text not null default 'free',   -- free | starter | pro
  chars_used   integer not null default 0,
  chars_limit  integer not null default 5000,  -- free: 5k, starter: 100k, pro: 500k
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- RLS
alter table public.profiles enable row level security;
create policy "Users can view own profile"  on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─────────────────────────────────────────
-- PROJECTS
-- ─────────────────────────────────────────
create table if not exists public.projects (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  title        text not null default 'Untitled Project',
  script_text  text not null,
  language     text not null default 'ur-IN',
  voice_name   text not null,
  speed        numeric not null default 1.0,
  pitch        numeric not null default 0,
  audio_url    text,
  file_size    integer,
  char_count   integer not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- RLS
alter table public.projects enable row level security;
create policy "Users can CRUD own projects" on public.projects for all using (auth.uid() = user_id);

-- ─────────────────────────────────────────
-- STORAGE BUCKET
-- ─────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('voiceovers', 'voiceovers', true)
on conflict (id) do update set public = true;

create policy "Users can upload own audio"
  on storage.objects for insert
  with check (bucket_id = 'voiceovers' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Anyone can read audio"
  on storage.objects for select
  using (bucket_id = 'voiceovers');

create policy "Users can delete own audio"
  on storage.objects for delete
  using (bucket_id = 'voiceovers' and auth.uid()::text = (storage.foldername(name))[1]);
