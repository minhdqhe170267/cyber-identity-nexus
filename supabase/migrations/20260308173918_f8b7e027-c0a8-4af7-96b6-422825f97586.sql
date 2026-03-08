
-- Create projects table
CREATE TABLE public.projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  tech_tags text[],
  status text check (status in ('DEPLOYED','IN_PROGRESS','CLASSIFIED')),
  github_url text,
  demo_url text,
  image_url text,
  featured boolean default false,
  created_at timestamp with time zone default now()
);

-- Create posts table
CREATE TABLE public.posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique not null,
  content text,
  excerpt text,
  published boolean default false,
  created_at timestamp with time zone default now()
);

-- Create guestbook table
CREATE TABLE public.guestbook (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  message text not null,
  approved boolean default false,
  created_at timestamp with time zone default now()
);

-- Create leaderboard table
CREATE TABLE public.leaderboard (
  id uuid primary key default gen_random_uuid(),
  player_name text not null,
  score integer not null,
  created_at timestamp with time zone default now()
);

-- Create page_views table
CREATE TABLE public.page_views (
  id uuid primary key default gen_random_uuid(),
  page text,
  created_at timestamp with time zone default now()
);

-- RLS for projects
CREATE POLICY "Anyone can view projects" ON public.projects FOR SELECT USING (true);
CREATE POLICY "Auth can insert projects" ON public.projects FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth can update projects" ON public.projects FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth can delete projects" ON public.projects FOR DELETE TO authenticated USING (true);

-- RLS for posts
CREATE POLICY "Public can view published posts" ON public.posts FOR SELECT TO anon USING (published = true);
CREATE POLICY "Auth can view all posts" ON public.posts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth can insert posts" ON public.posts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth can update posts" ON public.posts FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth can delete posts" ON public.posts FOR DELETE TO authenticated USING (true);

-- RLS for guestbook
CREATE POLICY "Anyone can insert guestbook" ON public.guestbook FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Public can view approved guestbook" ON public.guestbook FOR SELECT TO anon USING (approved = true);
CREATE POLICY "Auth can view all guestbook" ON public.guestbook FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth can update guestbook" ON public.guestbook FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth can delete guestbook" ON public.guestbook FOR DELETE TO authenticated USING (true);

-- RLS for leaderboard
CREATE POLICY "Anyone can view leaderboard" ON public.leaderboard FOR SELECT USING (true);
CREATE POLICY "Anyone can insert leaderboard" ON public.leaderboard FOR INSERT TO anon, authenticated WITH CHECK (true);

-- RLS for page_views
CREATE POLICY "Anyone can insert page_views" ON public.page_views FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Auth can view page_views" ON public.page_views FOR SELECT TO authenticated USING (true);
