import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface UserProfile {
  id: string;
  user_id: string;
  avatar_url?: string;
  phone?: string;
  bio?: string;
  timezone: string;
}

interface UserData {
  first_name?: string;
  last_name?: string;
  email: string;
  subscription_status: string;
}

export const useUserProfile = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      fetchUserProfile();
      fetchUserData();
    }
  }, [user?.id]);

  const fetchUserProfile = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error);
        toast({
          title: "Error",
          description: "Failed to load profile data",
          variant: "destructive",
        });
      } else {
        setProfile(data);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchUserData = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('users')
        .select('first_name, last_name, email, subscription_status')
        .eq('auth_user_id', user.id)
        .single();

      if (error) {
        console.error('Error fetching user data:', error);
      } else {
        setUserData(data);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user?.id) return { error: 'No user found' };

    try {
      const { error } = await supabase
        .from('user_profiles')
        .upsert({
          user_id: user.id,
          ...updates,
        });

      if (error) {
        console.error('Error updating profile:', error);
        toast({
          title: "Error",
          description: "Failed to update profile",
          variant: "destructive",
        });
        return { error };
      }

      await fetchUserProfile();
      toast({
        title: "Success",
        description: "Profile updated successfully",
        variant: "default",
      });

      return { error: null };
    } catch (error) {
      console.error('Error updating profile:', error);
      return { error };
    }
  };

  const updateUserData = async (updates: Partial<UserData>) => {
    if (!user?.id) return { error: 'No user found' };

    try {
      const { error } = await supabase
        .from('users')
        .update(updates)
        .eq('auth_user_id', user.id);

      if (error) {
        console.error('Error updating user data:', error);
        toast({
          title: "Error",
          description: "Failed to update user information",
          variant: "destructive",
        });
        return { error };
      }

      await fetchUserData();
      toast({
        title: "Success",
        description: "User information updated successfully",
        variant: "default",
      });

      return { error: null };
    } catch (error) {
      console.error('Error updating user data:', error);
      return { error };
    }
  };

  return {
    profile,
    userData,
    loading,
    updateProfile,
    updateUserData,
    refetch: () => {
      fetchUserProfile();
      fetchUserData();
    }
  };
};