-- VitalCircle — Phase 1 Schema
-- Run this in your Supabase SQL editor

-- Users (extends Supabase auth.users)
create table public.users (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null,
  name        text not null,
  role        text not null check (role in ('senior', 'family')),
  created_at  timestamptz default now()
);

-- Family groups
create table public.family_groups (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  created_at  timestamptz default now()
);

-- Family group memberships
create table public.family_members (
  user_id     uuid references public.users(id) on delete cascade,
  group_id    uuid references public.family_groups(id) on delete cascade,
  role        text not null check (role in ('senior', 'family')),
  primary key (user_id, group_id)
);

-- Daily check-ins
create table public.checkins (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid references public.users(id) on delete cascade,
  feeling_score     int not null check (feeling_score between 1 and 5),
  medications_taken boolean not null default false,
  needs_help        boolean not null default false,
  notes             text,
  created_at        timestamptz default now()
);

-- Medications
create table public.medications (
  id              uuid primary key default gen_random_uuid(),
  group_id        uuid references public.family_groups(id) on delete cascade,
  name            text not null,
  dosage          text,
  reminder_times  text[],
  created_at      timestamptz default now()
);

-- Messages
create table public.messages (
  id          uuid primary key default gen_random_uuid(),
  group_id    uuid references public.family_groups(id) on delete cascade,
  sender_id   uuid references public.users(id) on delete cascade,
  content     text not null,
  created_at  timestamptz default now()
);

-- Row-level security
alter table public.users         enable row level security;
alter table public.family_groups enable row level security;
alter table public.family_members enable row level security;
alter table public.checkins      enable row level security;
alter table public.medications   enable row level security;
alter table public.messages      enable row level security;

-- Allow users to read/write their own profile
create policy "Users can manage own profile"
  on public.users for all
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Allow insert for new sign-ups (called from client before RLS session is fully established)
create policy "Allow insert on sign up"
  on public.users for insert
  with check (auth.uid() = id);
