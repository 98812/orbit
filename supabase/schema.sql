-- Orbit database schema
-- Run this in Supabase SQL editor after creating your project.

create table profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  avatar_url text,
  goal text,
  mission text,
  qualification text,
  talent text,
  bio text,
  phone_number text,
  contact_note text,
  created_at timestamptz default now()
);

alter table profiles enable row level security;

create policy "Profiles are viewable by any signed-in member"
  on profiles for select using (auth.role() = 'authenticated');

create policy "Users can update their own profile"
  on profiles for update using (auth.uid() = id);

create policy "Users can insert their own profile"
  on profiles for insert with check (auth.uid() = id);

-- auto-create a blank profile row when someone signs up
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- group chat messages
create table messages (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade,
  content text not null,
  created_at timestamptz default now()
);

alter table messages enable row level security;

create policy "Members can read all messages"
  on messages for select using (auth.role() = 'authenticated');

create policy "Members can send messages"
  on messages for insert with check (auth.uid() = user_id);

-- snaps (photo moments)
create table snaps (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade,
  image_url text not null,
  caption text,
  created_at timestamptz default now()
);

alter table snaps enable row level security;

create policy "Members can view all snaps"
  on snaps for select using (auth.role() = 'authenticated');

create policy "Members can post their own snaps"
  on snaps for insert with check (auth.uid() = user_id);

-- reactions on snaps
create table reactions (
  id uuid default gen_random_uuid() primary key,
  snap_id uuid references snaps(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  emoji text not null,
  created_at timestamptz default now(),
  unique (snap_id, user_id, emoji)
);

alter table reactions enable row level security;

create policy "Members can view all reactions"
  on reactions for select using (auth.role() = 'authenticated');

create policy "Members can add their own reactions"
  on reactions for insert with check (auth.uid() = user_id);

create policy "Members can remove their own reactions"
  on reactions for delete using (auth.uid() = user_id);

-- storage bucket for snap photos: create manually in Supabase dashboard
-- Storage > New bucket > name it "snaps" > public
