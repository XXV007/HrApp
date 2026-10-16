create table if not exists public.searches (
  id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id) on delete cascade,
  brief text not null, filters jsonb not null, results jsonb not null, created_at timestamptz not null default now()
);
create table if not exists public.search_usage (
  company_id uuid not null references public.companies(id) on delete cascade,
  month date not null, used_count integer not null default 0,
  primary key(company_id, month)
);
alter table public.companies add column if not exists last_billing_event_at timestamptz;
alter table public.searches enable row level security;
create policy "company search isolation" on public.searches using (company_id = public.my_company_id()) with check (company_id = public.my_company_id());

-- Increment and enforce the free allowance under a row lock, so concurrent requests
-- cannot spend the same remaining search.
create or replace function public.consume_search_credit(p_company_id uuid, p_limit integer default 1)
returns integer language plpgsql security definer set search_path=public as $$
declare used_count integer;
begin
  insert into public.search_usage(company_id, month, used_count) values (p_company_id, current_date, 0)
    on conflict (company_id, month) do nothing;
  update public.search_usage set used_count=used_count+1
    where company_id=p_company_id and month=current_date and used_count < p_limit
    returning used_count into used_count;
  if not found then return -1; end if;
  return p_limit - used_count;
end $$;

create table if not exists public.api_rate_limits (
  key text primary key,
  window_started_at timestamptz not null,
  request_count integer not null default 0
);

create or replace function public.consume_api_rate_limit(
  p_key text,
  p_limit integer default 30,
  p_window_seconds integer default 60
) returns table(allowed boolean, retry_after integer)
language plpgsql security definer set search_path=public as $$
declare
  current_time timestamptz := now();
  row_value public.api_rate_limits%rowtype;
  elapsed integer;
begin
  insert into public.api_rate_limits(key, window_started_at, request_count)
    values (p_key, current_time, 0)
    on conflict (key) do nothing;
  select * into row_value from public.api_rate_limits where key = p_key for update;
  elapsed := floor(extract(epoch from (current_time - row_value.window_started_at)));
  if elapsed >= p_window_seconds then
    update public.api_rate_limits set window_started_at = current_time, request_count = 1 where key = p_key;
    return query select true, 0;
  end if;
  update public.api_rate_limits set request_count = request_count + 1 where key = p_key;
  return query select row_value.request_count < p_limit,
    greatest(1, p_window_seconds - elapsed);
end $$;

create or replace function public.create_search_with_quota(
  p_company_id uuid,
  p_brief text,
  p_filters jsonb,
  p_results jsonb,
  p_limit integer default 5
) returns table(search_id uuid, searches_remaining integer)
language plpgsql security definer set search_path=public as $$
declare
  plan_name text;
  remaining integer;
  new_id uuid;
begin
  if public.my_company_id() is distinct from p_company_id then
    raise exception 'company access denied';
  end if;
  select plan into plan_name from public.companies where id = p_company_id for update;
  if plan_name is null then raise exception 'company not found'; end if;
  if plan_name <> 'paid' then
    select public.consume_search_credit(p_company_id, p_limit) into remaining;
    if remaining < 0 then raise exception 'search limit reached'; end if;
  else
    remaining := null;
  end if;
  insert into public.searches(company_id, brief, filters, results)
    values (p_company_id, p_brief, p_filters, p_results)
    returning id into new_id;
  return query select new_id, remaining;
exception when others then
  raise;
end $$;
