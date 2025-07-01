
-- Create waitlist_signups table
CREATE TABLE public.waitlist_signups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  feature_request TEXT CHECK (char_length(feature_request) <= 300),
  joined_from TEXT CHECK (joined_from IN ('home', 'pro_btn')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.waitlist_signups ENABLE ROW LEVEL SECURITY;

-- Create policy for anonymous inserts only
CREATE POLICY "Allow anonymous inserts" ON public.waitlist_signups
  FOR INSERT TO anon
  WITH CHECK (true);

-- Create policy to prevent selects (no one can read the data via API)
CREATE POLICY "No select access" ON public.waitlist_signups
  FOR SELECT USING (false);
