-- Add hub column to profiles
alter table public.profiles 
add column hub text check (hub in ('Dzivarasekwa', 'Mufakose', 'Warren Park', 'Kambuzuma', 'Mbare', 'Victoria Falls', 'Bulawayo'));

-- Update handle_new_user function to include hub
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, role, hub)
  values (
    new.id, 
    new.raw_user_meta_data->>'full_name', 
    new.raw_user_meta_data->>'role',
    new.raw_user_meta_data->>'hub'
  );
  return new;
end;
$$ language plpgsql security definer;
