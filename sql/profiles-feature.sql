-- Add subscription flag to profiles table
alter table profiles add column if not exists is_subscriber boolean default false;

-- Individual support profiles table
create table if not exists individual_profiles (
  id uuid default gen_random_uuid() primary key,
  created_by uuid references auth.users on delete set null,
  avatar_emoji text default '👤',
  display_name text not null,
  zone text,
  description text,
  needs text[],
  notes text,
  last_helped_at timestamp,
  created_at timestamp default now(),
  updated_at timestamp default now()
);

-- RLS policies
alter table individual_profiles enable row level security;

-- Only subscribers can read profiles
create policy "Subscribers can view profiles"
  on individual_profiles for select
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.is_subscriber = true
    )
  );

-- Subscribers can create profiles
create policy "Subscribers can create profiles"
  on individual_profiles for insert
  with check (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.is_subscriber = true
    )
  );

-- Subscribers can update profiles
create policy "Subscribers can update profiles"
  on individual_profiles for update
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.is_subscriber = true
    )
  );

-- Enable realtime
alter publication supabase_realtime add table individual_profiles;
