begin;

alter table public.requirement_links
  add column if not exists metadata jsonb;

comment on column public.requirement_links.metadata is
  'リンク付帯メタデータ（DD依存のメッセージ/戻り値/非同期完了情報など）';

commit;

