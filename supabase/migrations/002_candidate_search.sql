-- Candidate records are kept in a JSONB column so the local fixture can be
-- loaded without losing fields as the candidate schema evolves.
create table if not exists public.candidates (
  id text primary key,
  document jsonb not null,
  search_text text generated always as (lower(coalesce(document->>'full_name','') || ' ' ||
    coalesce(document->>'headline','') || ' ' || coalesce(document->>'current_title','') || ' ' ||
    coalesce(document->>'role','') || ' ' || coalesce(document->>'current_company','') || ' ' ||
    coalesce(document->>'skills',''))) stored
);

create index if not exists candidates_search_text_idx
  on public.candidates using gin (to_tsvector('simple', search_text));
create index if not exists candidates_document_idx
  on public.candidates using gin (document);
alter table public.candidates enable row level security;
create policy "authenticated recruiters can search candidates"
  on public.candidates for select to authenticated using (true);

create or replace function public.search_candidates(
  query_text text default '',
  city_filter text default null,
  page_number integer default 1,
  page_size integer default 24
) returns table(candidate jsonb, total_count bigint, rank real)
language sql stable security invoker set search_path = public as $$
  with filtered as (
    select c.document,
      ts_rank(to_tsvector('simple', c.search_text), plainto_tsquery('simple', query_text)) as rank
    from public.candidates c
    where (query_text = '' or to_tsvector('simple', c.search_text) @@ plainto_tsquery('simple', query_text))
      and (city_filter is null or lower(c.document #>> '{location,city}') = lower(city_filter))
  ), counted as (
    select document, rank, count(*) over () as total_count
    from filtered
  )
  select document, total_count, rank
  from counted
  order by rank desc, document->>'id'
  offset greatest(page_number - 1, 0) * least(greatest(page_size, 1), 100)
  limit least(greatest(page_size, 1), 100);
$$;
