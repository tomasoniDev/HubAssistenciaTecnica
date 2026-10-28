-- NOT VALID preserves legacy records but enforces the rule on inserts/updates.
alter table public.machines
add constraint machines_code_required
check (code is not null and code ~ '[^[:space:]]') not valid;
