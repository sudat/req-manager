-- Add bottom_up_result to investigation_results for bottom-up dependency analysis
begin;

alter table public.investigation_results
  add column if not exists bottom_up_result jsonb;

commit;

