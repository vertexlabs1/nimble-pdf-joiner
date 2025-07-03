-- Add your email to the admins table for dashboard access
-- Replace 'your-email@example.com' with your actual email address
INSERT INTO public.admins (email) VALUES ('your-email@example.com')
ON CONFLICT (email) DO NOTHING;