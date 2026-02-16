-- Add email column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;

-- Update the handle_new_user function to include email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role, email)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'role', new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
