revoke all on public.api_rate_limits from anon, authenticated;
revoke all on function public.consume_api_rate_limit(text, integer, integer) from anon;
revoke all on function public.create_search_with_quota(uuid, text, jsonb, jsonb, integer) from anon;
grant execute on function public.consume_api_rate_limit(text, integer, integer) to authenticated;
grant execute on function public.create_search_with_quota(uuid, text, jsonb, jsonb, integer) to authenticated;
