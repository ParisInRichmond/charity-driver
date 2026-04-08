-- Add admin flag to profiles
alter table profiles add column if not exists is_admin boolean default false;

-- Mia conversation logs
create table if not exists mia_logs (
  id uuid default gen_random_uuid() primary key,
  question text,
  led_to_signup boolean default false,
  user_id uuid references auth.users on delete set null,
  created_at timestamp default now()
);
alter table mia_logs enable row level security;
create policy "Anyone can insert mia logs" on mia_logs for insert with check (true);
create policy "Admins can read mia logs" on mia_logs for select using (
  exists (select 1 from profiles where profiles.id = auth.uid() and profiles.is_admin = true)
);

-- Mia knowledge base
create table if not exists mia_knowledge (
  id uuid default gen_random_uuid() primary key,
  question text not null,
  answer text not null,
  link text,
  created_at timestamp default now()
);
alter table mia_knowledge enable row level security;
create policy "Anyone can read knowledge base" on mia_knowledge for select using (true);
create policy "Admins can manage knowledge base" on mia_knowledge for all using (
  exists (select 1 from profiles where profiles.id = auth.uid() and profiles.is_admin = true)
);

-- Contact form submissions
create table if not exists contact_submissions (
  id uuid default gen_random_uuid() primary key,
  first_name text,
  last_name text,
  email text,
  type text,
  organization text,
  message text,
  created_at timestamp default now()
);
alter table contact_submissions enable row level security;
create policy "Anyone can submit contact form" on contact_submissions for insert with check (true);
create policy "Admins can read submissions" on contact_submissions for select using (
  exists (select 1 from profiles where profiles.id = auth.uid() and profiles.is_admin = true)
);

-- Page views tracking
create table if not exists page_views (
  id uuid default gen_random_uuid() primary key,
  page text,
  user_id uuid,
  created_at timestamp default now()
);
alter table page_views enable row level security;
create policy "Anyone can log page views" on page_views for insert with check (true);
create policy "Admins can read page views" on page_views for select using (
  exists (select 1 from profiles where profiles.id = auth.uid() and profiles.is_admin = true)
);

-- Make yourself admin (run after inserting your user ID)
-- Replace 'YOUR-USER-ID-HERE' with your actual Supabase user ID
-- update profiles set is_admin = true where email = 'your@email.com';

-- Seed Mia knowledge base with starter entries
insert into mia_knowledge (question, answer, link) values
('How do I sign up?', 'Signing up is free! Choose your role, fill in your info, and you''re in.', '/signup.html'),
('What is Charity Driver?', 'Charity Driver connects free-roam donors with unhoused individuals in Oakland. We help because we want to — not because we have to.', '/about.html'),
('How do I log a delivery?', 'Go to the Deliver page, select your location and resources, add how many people you served, and submit. The live feed updates instantly.', '/deliver.html'),
('What do the colors mean?', 'Red = high need, Orange = moderate, Yellow = some need, Green = recently served. The live feed updates in real time.', '/map.html'),
('Can I browse without an account?', 'Yes! Visit the guest map view to explore hotspots without signing up. Create a free account to log deliveries.', '/guest.html'),
('How does the subscription work?', 'The Supporter plan is $7/month. It unlocks access to individual support profiles — a private directory of people donors have met in the field.', '/profiles-directory.html'),
('How do I contact support?', 'Use our contact page — we respond within 24 hours.', '/contact.html'),
('How can nonprofits partner with you?', 'We''d love to connect! Fill out the contact form and select "Nonprofit Organization" — we''ll be in touch.', '/contact.html');
