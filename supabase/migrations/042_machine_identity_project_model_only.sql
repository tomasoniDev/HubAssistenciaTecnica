begin;

-- Keep project + model unique; other machine attributes may be shared.
create unique index if not exists machines_code_model_unique_not_blank
on public.machines (upper(btrim(code)), upper(btrim(coalesce(model, ''))))
where code is not null and btrim(code) <> '';

alter table public.machines drop constraint if exists machines_code_key;
drop index if exists public.machines_code_unique_not_blank;
drop index if exists public.machines_serial_unique_not_blank;
drop index if exists public.machines_mechanical_list_unique_not_blank;
drop index if exists public.machines_software_code_unique_not_blank;

commit;
