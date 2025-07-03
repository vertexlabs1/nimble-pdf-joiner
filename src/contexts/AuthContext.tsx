
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  adminLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [adminLoading, setAdminLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminChecked, setAdminChecked] = useState(false);

  const checkAdminStatus = async (userId: string) => {
    if (adminChecked) return;
    
    setAdminLoading(true);
    
    // Add timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      console.warn('Admin check timeout - assuming non-admin');
      setIsAdmin(false);
      setAdminChecked(true);
      setAdminLoading(false);
    }, 5000);
    
    try {
      const { data, error } = await supabase
        .from('users')
        .select('is_super_admin')
        .eq('auth_user_id', userId)
        .maybeSingle();
      
      clearTimeout(timeoutId);
      
      if (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
      } else {
        setIsAdmin(data?.is_super_admin || false);
      }
      setAdminChecked(true);
    } catch (error) {
      clearTimeout(timeoutId);
      console.error('Error checking admin status:', error);
      setIsAdmin(false);
      setAdminChecked(true);
    } finally {
      setAdminLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    // Set up auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return;

        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user?.id) {
          // Reset admin check for new user
          setAdminChecked(false);
          checkAdminStatus(session.user.id);
        } else {
          // Clear admin state for logged out users
          setIsAdmin(false);
          setAdminChecked(true);
          setAdminLoading(false);
        }
        
        // Always set loading to false after auth state change
        setLoading(false);
      }
    );

    // Then check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user?.id) {
        checkAdminStatus(session.user.id);
      } else {
        // No session, stop loading immediately
        setAdminChecked(true);
      }
      
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      setLoading(false);
    }
    
    return { error };
  };

  const signUp = async (email: string, password: string) => {
    setLoading(true);
    const redirectUrl = `${window.location.origin}/dashboard`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl
      }
    });
    
    // Always reset loading state after signup attempt
    setLoading(false);
    
    return { error };
  };

  const signOut = async () => {
    setAdminChecked(false);
    await supabase.auth.signOut();
  };

  const value = {
    user,
    session,
    loading,
    adminLoading,
    signIn,
    signUp,
    signOut,
    isAdmin,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
