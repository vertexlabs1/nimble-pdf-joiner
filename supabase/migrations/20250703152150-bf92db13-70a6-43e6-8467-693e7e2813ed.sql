-- Add admin email to the admins table for dashboard access
INSERT INTO public.admins (email) VALUES ('tyler@vxlabs.co')
ON CONFLICT (email) DO NOTHING;