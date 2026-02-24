begin;

-- Rename table
alter table if exists public.impl_unit_sds rename to design_documents;

-- Rename indexes (if they exist)
alter index if exists idx_impl_unit_sds_project_id rename to idx_design_documents_project_id;
alter index if exists idx_impl_unit_sds_srf_id rename to idx_design_documents_srf_id;

-- Update existing IDs from IU-* to DD-*
update public.design_documents
  set id = regexp_replace(id, '^IU-', 'DD-')
  where id like 'IU-%';

-- Update requirement_links to use dd type and DD-* IDs
update public.requirement_links
  set source_type = 'dd'
  where source_type = 'impl_unit';
update public.requirement_links
  set target_type = 'dd'
  where target_type = 'impl_unit';
update public.requirement_links
  set source_id = regexp_replace(source_id, '^IU-', 'DD-')
  where source_id like 'IU-%';
update public.requirement_links
  set target_id = regexp_replace(target_id, '^IU-', 'DD-')
  where target_id like 'IU-%';

commit;
