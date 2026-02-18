-- Function to allow instructors to delete students
-- This is a powerful function, so we must be careful.
create or replace function public.delete_user_by_instructor(target_user_id uuid)
returns void as $$
declare
  requester_id uuid;
  requester_role text;
  target_role text;
begin
  requester_id := auth.uid();
  
  -- Get requester role
  select role into requester_role from public.profiles where id = requester_id;
  
  if requester_role != 'instructor' then
    raise exception 'Only instructors can delete users.';
  end if;

  -- Get target user role
  select role into target_role from public.profiles where id = target_user_id;
  
  if target_role != 'student' then
    raise exception 'Instructors can only delete students.';
  end if;

  -- Delete the user from auth.users (cascades to profiles etc)
  delete from auth.users where id = target_user_id;
end;
$$ language plpgsql security definer;
