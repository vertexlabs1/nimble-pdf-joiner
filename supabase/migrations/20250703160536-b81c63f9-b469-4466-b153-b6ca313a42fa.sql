-- Force delete all existing users and reset everything
TRUNCATE auth.users CASCADE;

-- Ensure the trigger exists (in case it was missing)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();