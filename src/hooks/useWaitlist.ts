
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface WaitlistData {
  email: string;
  feature_request?: string;
  joined_from: 'home' | 'pro_btn';
}

export const useWaitlist = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitToWaitlist = async (data: WaitlistData) => {
    setIsLoading(true);
    setError(null);

    try {
      const { error: insertError } = await supabase
        .from('waitlist_signups')
        .insert({
          email: data.email.toLowerCase().trim(),
          feature_request: data.feature_request?.trim() || null,
          joined_from: data.joined_from
        });

      if (insertError) {
        if (insertError.code === '23505') { // Unique constraint violation
          throw new Error('This email is already on our waitlist! 🎉');
        }
        throw insertError;
      }

      // Store success in localStorage to prevent re-submissions
      localStorage.setItem('waitlist_joined', 'true');
      localStorage.setItem('waitlist_email', data.email);
      
      return { success: true };
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to join waitlist. Please try again.';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const checkPreviousSubmission = () => {
    return {
      hasJoined: localStorage.getItem('waitlist_joined') === 'true',
      email: localStorage.getItem('waitlist_email')
    };
  };

  return {
    submitToWaitlist,
    checkPreviousSubmission,
    isLoading,
    error
  };
};
