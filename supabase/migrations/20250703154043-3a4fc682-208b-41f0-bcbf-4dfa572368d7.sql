-- Create security definer function to check super admin status
CREATE OR REPLACE FUNCTION public.is_super_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE auth_user_id = user_id 
    AND is_super_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Super admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Super admins can update any user" ON public.users;

-- Create new policies using the security definer function
CREATE POLICY "Super admins can view all users" 
ON public.users 
FOR SELECT 
USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admins can update any user" 
ON public.users 
FOR UPDATE 
USING (public.is_super_admin(auth.uid()));