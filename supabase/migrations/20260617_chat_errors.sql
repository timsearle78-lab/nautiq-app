-- Table to log chat assistant errors for debugging
create table if not exists chat_errors (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  user_id       uuid references auth.users(id) on delete set null,
  boat_id       uuid references boats(id) on delete set null,
  error_message text not null,
  error_stack   text
);

alter table chat_errors enable row level security;

-- Authenticated users can insert their own error records
create policy "Users can insert own chat errors"
  on chat_errors for insert
  with check (auth.uid() = user_id);

-- Users can read their own error records (useful for support)
create policy "Users can read own chat errors"
  on chat_errors for select
  using (auth.uid() = user_id);
