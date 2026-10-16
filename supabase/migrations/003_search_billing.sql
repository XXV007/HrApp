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
