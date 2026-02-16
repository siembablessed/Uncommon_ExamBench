-- Create 'avatars' bucket if it doesn't exist
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Ensure policies are applied (re-run just in case, though 0005 should have handled it if bucket existed)
-- (No need to repeat policies if 0005 was run, but good to ensure accessibility)
