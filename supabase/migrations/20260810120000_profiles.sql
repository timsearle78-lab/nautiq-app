-- Public profiles table — mirrors auth.users for DB webhooks and admin queries
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  email      text,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

-- Admins (service role) can read all; users can read their own
create policy "Service role full access" on public.profiles
  using (true) with check (true);

create policy "Users read own profile" on public.profiles
  for select using (auth.uid() = id);

-- Trigger: populate profiles on new auth.users insert
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, created_at)
  values (new.id, new.email, new.created_at)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Backfill existing users
insert into public.profiles (id, email, created_at)
select id, email, created_at from auth.users
on conflict (id) do nothing;
