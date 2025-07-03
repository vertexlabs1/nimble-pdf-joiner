-- Delete all existing users to start fresh
DELETE FROM auth.users;

-- Create the missing trigger to automatically create user profiles
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();