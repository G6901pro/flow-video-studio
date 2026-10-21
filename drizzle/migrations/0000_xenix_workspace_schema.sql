create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  primary_goal text check (primary_goal in ('coding','writing','research','creative')),
  onboarded boolean not null default false,
  created_at timestamptz not null default now()
);
grant select on public.profiles to authenticated;
grant update (display_name, primary_goal, onboarded) on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
drop policy if exists "own profile read" on public.profiles;
drop policy if exists "own profile update" on public.profiles;
create policy "own profile read" on public.profiles for select to authenticated using (auth.uid() = id);
create policy "own profile update" on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

create table if not exists public.subscriptions (
  user_id uuid primary key,
  plan text not null default 'free' check (plan in ('free','pro','enterprise')),
  status text not null default 'active',
  stripe_customer_id text,
  current_period_end timestamptz,
  updated_at timestamptz not null default now()
);
grant select on public.subscriptions to authenticated;
grant all on public.subscriptions to service_role;
alter table public.subscriptions enable row level security;
drop policy if exists "own subscription read" on public.subscriptions;
create policy "own subscription read" on public.subscriptions for select to authenticated using (auth.uid() = user_id);

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  title text not null default 'New chat',
  mode text not null default 'chat' check (mode in ('chat','code','research')),
  model text not null default 'auto',
  pinned boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists conversations_user_updated_idx on public.conversations(user_id, updated_at desc);
grant select, insert, update, delete on public.conversations to authenticated;
grant all on public.conversations to service_role;
alter table public.conversations enable row level security;
drop policy if exists "own conv all" on public.conversations;
create policy "own conv all" on public.conversations for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null default auth.uid(),
  role text not null check (role in ('user','assistant')),
  content text not null,
  model text,
  provider text,
  created_at timestamptz not null default now()
);
create index if not exists messages_conv_created_idx on public.messages(conversation_id, created_at);
grant select, insert, delete on public.messages to authenticated;
grant all on public.messages to service_role;
alter table public.messages enable row level security;
drop policy if exists "own msg read" on public.messages;
drop policy if exists "own msg insert" on public.messages;
drop policy if exists "own msg delete" on public.messages;
create policy "own msg read" on public.messages for select to authenticated using (auth.uid() = user_id);
create policy "own msg insert" on public.messages for insert to authenticated with check (auth.uid() = user_id and exists (select 1 from public.conversations c where c.id = conversation_id and c.user_id = auth.uid()));
create policy "own msg delete" on public.messages for delete to authenticated using (auth.uid() = user_id);

create table if not exists public.usage_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  kind text not null,
  model text not null,
  credits integer not null check (credits >= 0),
  created_at timestamptz not null default now()
);
create index if not exists usage_events_user_created_idx on public.usage_events(user_id, created_at desc);
grant select on public.usage_events to authenticated;
grant all on public.usage_events to service_role;
alter table public.usage_events enable row level security;
drop policy if exists "own usage read" on public.usage_events;
create policy "own usage read" on public.usage_events for select to authenticated using (auth.uid() = user_id);

create table if not exists public.generations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  prompt text not null,
  style text,
  aspect text,
  model text not null,
  image_url text not null,
  kind text not null default 'image',
  duration integer,
  resolution text not null default '720p',
  created_at timestamptz not null default now()
);
create index if not exists generations_user_created_idx on public.generations(user_id, created_at desc);
grant select, delete on public.generations to authenticated;
grant all on public.generations to service_role;
alter table public.generations enable row level security;
drop policy if exists "own gen read" on public.generations;
drop policy if exists "own gen delete" on public.generations;
create policy "own gen read" on public.generations for select to authenticated using (auth.uid() = user_id);
create policy "own gen delete" on public.generations for delete to authenticated using (auth.uid() = user_id);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email,'@',1)))
  on conflict (id) do nothing;
  insert into public.subscriptions (user_id) values (new.id) on conflict do nothing;
  return new;
end; $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create table if not exists public.video_jobs (
  id text primary key,
  user_id uuid not null,
  prompt text not null,
  aspect text not null,
  duration integer not null check (duration between 3 and 10),
  resolution text not null default '720p',
  status text not null default 'queued',
  generation_id uuid,
  error text,
  created_at timestamptz not null default now()
);
create index if not exists video_jobs_user_created_idx on public.video_jobs(user_id, created_at desc);
grant select on public.video_jobs to authenticated;
grant all on public.video_jobs to service_role;
alter table public.video_jobs enable row level security;
drop policy if exists "own video jobs read" on public.video_jobs;
create policy "own video jobs read" on public.video_jobs for select to authenticated using (auth.uid() = user_id);

create table if not exists public.chat_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  words integer not null check (words >= 0),
  created_at timestamptz not null default now()
);
create index if not exists chat_usage_user_created_idx on public.chat_usage(user_id, created_at desc);
grant select on public.chat_usage to authenticated;
grant all on public.chat_usage to service_role;
alter table public.chat_usage enable row level security;
drop policy if exists "own chat usage read" on public.chat_usage;
create policy "own chat usage read" on public.chat_usage for select to authenticated using (auth.uid() = user_id);

drop policy if exists "own generation files read" on storage.objects;
create policy "own generation files read" on storage.objects for select to authenticated using (bucket_id = 'generations' and (storage.foldername(name))[1] = auth.uid()::text);