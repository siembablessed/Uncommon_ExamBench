-- Create a table for public profiles
create table public.profiles (
  id uuid references auth.users not null primary key,
  full_name text,
  role text check (role in ('instructor', 'student')) default 'student',
  updated_at timestamp with time zone,
  
  constraint username_length check (char_length(full_name) >= 3)
);

-- Set up Row Level Security (RLS)
alter table public.profiles enable row level security;

create policy "Public profiles are viewable by everyone."
  on profiles for select
  using ( true );

create policy "Users can insert their own profile."
  on profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile."
  on profiles for update
  using ( auth.uid() = id );

-- Handle new user signup
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'role');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Classes table
create table public.classes (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  instructor_id uuid references public.profiles(id) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.classes enable row level security;

create policy "Classes are viewable by everyone."
  on classes for select
  using ( true );

create policy "Instructors can create classes."
  on classes for insert
  with check ( auth.uid() = instructor_id );

-- Enrollments table
create table public.enrollments (
  user_id uuid references public.profiles(id) not null,
  class_id uuid references public.classes(id) not null,
  enrolled_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (user_id, class_id)
);

alter table public.enrollments enable row level security;

create policy "Enrollments viewable by members."
  on enrollments for select
  using ( auth.uid() = user_id );

create policy "Students can enroll in classes."
  on enrollments for insert
  with check ( auth.uid() = user_id );

-- Exams table
create table public.exams (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  class_id uuid references public.classes(id) not null,
  file_url text, -- URL to the PDF in storage
  due_date timestamp with time zone,
  created_by uuid references public.profiles(id) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.exams enable row level security;

create policy "Exams viewable by enrolled students and instructor."
  on exams for select
  using ( 
    exists (
      select 1 from enrollments 
      where enrollments.class_id = exams.class_id 
      and enrollments.user_id = auth.uid()
    ) 
    or created_by = auth.uid()
  );

create policy "Instructors can create exams."
  on exams for insert
  with check ( auth.uid() = created_by );

-- Submissions table
create table public.submissions (
  id uuid default gen_random_uuid() primary key,
  exam_id uuid references public.exams(id) not null,
  student_id uuid references public.profiles(id) not null,
  content text, -- Text answer or file URL
  submitted_at timestamp with time zone default timezone('utc'::text, now()) not null,
  status text check (status in ('submitted', 'graded', 'late')) default 'submitted',
  grade numeric,
  feedback text
);

alter table public.submissions enable row level security;

create policy "Students can view their own submissions."
  on submissions for select
  using ( auth.uid() = student_id );

create policy "Instructors can view submissions for their exams."
  on submissions for select
  using ( 
    exists (
      select 1 from exams 
      where exams.id = submissions.exam_id 
      and exams.created_by = auth.uid()
    )
  );

create policy "Students can create submissions."
  on submissions for insert
  with check ( auth.uid() = student_id );

create policy "Instructors can update submissions (grade)."
  on submissions for update
  using ( 
    exists (
      select 1 from exams 
      where exams.id = submissions.exam_id 
      and exams.created_by = auth.uid()
    )
  );
