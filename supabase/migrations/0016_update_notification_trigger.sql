-- Update the notification trigger to link to the specific results page
create or replace function public.notify_on_grade()
returns trigger as $$
begin
  if (old.status != 'graded' and new.status = 'graded') then
    insert into public.notifications (user_id, title, message, type, link)
    values (
      new.student_id,
      'Exam Graded',
      'Your submission for an exam has been graded. Click to view results.',
      'success',
      '/student/results/' || new.id -- Link to specific result page
    );
  end if;
  return new;
end;
$$ language plpgsql security definer;
