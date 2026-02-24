-- Remove design_doc_no column from system_functions table
begin;

alter table public.system_functions
  drop column if exists design_doc_no;

commit;
