-- Fix Function Search Path Mutable security issues
-- Update all functions to use SECURITY DEFINER SET search_path = ''

-- 1. Fix update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- 2. Fix handle_new_user function  
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (auth_user_id, email, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- 3. Fix is_super_admin function
CREATE OR REPLACE FUNCTION public.is_super_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE auth_user_id = user_id 
    AND is_super_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = '';

-- 4. Fix has_active_subscription function
CREATE OR REPLACE FUNCTION public.has_active_subscription(user_id UUID, required_tier TEXT DEFAULT 'pro')
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE auth_user_id = user_id 
    AND (
      subscription_status = required_tier 
      OR (required_tier = 'pro' AND subscription_status = 'enterprise')
      OR subscription_status = 'enterprise'
    )
    AND (subscription_expires_at IS NULL OR subscription_expires_at > now())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = '';