-- Run in the Hub SQL Editor. Only empty, unlinked machines are removed.
-- Existing partial records and any nonempty credentials are preserved.
begin;

lock table public.machines in share row exclusive mode;
lock table public.machine_credentials in share row exclusive mode;

create temporary table empty_machine_candidates on commit drop as
select m.id
from public.machines m
where not exists (
  select 1 from jsonb_each_text(to_jsonb(m) - array['id', 'created_at', 'updated_at']) f
  where coalesce(f.value, '') ~ '[^[:space:]]'
    and not (f.key = 'remote_access' and f.value = 'Sem acesso remoto')
    and not (f.key = 'support_contract_active' and f.value = 'false')
)
and not exists (
  select 1 from public.machine_credentials c,
    lateral jsonb_each_text(to_jsonb(c) - array['machine_id', 'created_at', 'updated_at']) f
  where c.machine_id = m.id and coalesce(f.value, '') ~ '[^[:space:]]'
);

-- Check every foreign key, including relationships added after this script.
do $$
declare
  ref record;
begin
  for ref in
    select c.conrelid::regclass as relation, a.attname as column_name,
      cardinality(c.conkey) as key_count,
      target.attname as target_column
    from pg_constraint c
    join pg_attribute a on a.attrelid = c.conrelid and a.attnum = c.conkey[1]
    join pg_attribute target on target.attrelid = c.confrelid and target.attnum = c.confkey[1]
    where c.contype = 'f' and c.confrelid = 'public.machines'::regclass
  loop
    if ref.key_count <> 1 or ref.target_column <> 'id' then
      raise exception 'Unexpected machine relationship: %. Review before cleanup.', ref.relation;
    end if;
    if ref.relation = 'public.machine_credentials'::regclass then
      continue;
    end if;
    execute format('lock table %s in share row exclusive mode', ref.relation);
    execute format(
      'delete from empty_machine_candidates e where exists (select 1 from %s r where r.%I = e.id)',
      ref.relation, ref.column_name
    );
  end loop;
end $$;

-- Empty credentials can be removed by the existing ON DELETE CASCADE.
delete from public.machines m
using empty_machine_candidates e
where m.id = e.id
returning m.id as deleted_empty_machine_id;

commit;
