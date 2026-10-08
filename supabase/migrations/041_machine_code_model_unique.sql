begin;

-- Create the replacement first: conflicting existing records abort the transaction.
create unique index machines_code_model_unique_not_blank
on public.machines (upper(btrim(code)), upper(btrim(coalesce(model, ''))))
where code is not null and btrim(code) <> '';

alter table public.machines drop constraint if exists machines_code_key;
drop index if exists public.machines_code_unique_not_blank;

commit;
