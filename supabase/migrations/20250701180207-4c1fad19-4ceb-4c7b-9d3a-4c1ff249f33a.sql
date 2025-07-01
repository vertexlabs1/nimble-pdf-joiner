
-- Create admins table for admin verification
CREATE TABLE public.admins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users to read admin table
CREATE POLICY "Authenticated users can read admins" ON public.admins
  FOR SELECT TO authenticated
  USING (true);

-- Insert the hardcoded admin user
INSERT INTO public.admins (email) VALUES ('tyler@vxlabs.co');
