-- Create notifications table
create table public.notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) not null,
  title text not null,
  message text not null,
  type text check (type in ('info', 'success', 'warning', 'error')) default 'info',
  is_read boolean default false,
  link text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.notifications enable row level security;

-- Policy: Users can view their own notifications
create policy "Users can view their own notifications."
  on notifications for select
  using ( auth.uid() = user_id );

-- Policy: Users can update (mark as read) their own notifications
create policy "Users can update their own notifications."
  on notifications for update
  using ( auth.uid() = user_id );

-- Function to handle submission grading notification
create or replace function public.notify_on_grade()
returns trigger as $$
begin
  if (old.status != 'graded' and new.status = 'graded') then
    insert into public.notifications (user_id, title, message, type, link)
    values (
      new.student_id,
      'Exam Graded',
      'Your submission for an exam has been graded.',
      'success',
      '/student/dashboard' -- Link to dashboard or specific result page
    );
  end if;
  return new;
end;
$$ language plpgsql security definer;

-- Trigger: Notify student when submission is graded
create trigger on_submission_graded
  after update on public.submissions
  for each row execute procedure public.notify_on_grade();

-- Function to handle submission confirmation notification
create or replace function public.notify_on_submit()
returns trigger as $$
begin
  insert into public.notifications (user_id, title, message, type, link)
  values (
    new.student_id,
    'Submission Received',
    'Your exam submission has been received successfully.',
    'info',
    '/student/dashboard'
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger: Notify student when they submit
create trigger on_submission_created
  after insert on public.submissions
  for each row execute procedure public.notify_on_submit();
