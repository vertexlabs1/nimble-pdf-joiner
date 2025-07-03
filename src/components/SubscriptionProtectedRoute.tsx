import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface SubscriptionProtectedRouteProps {
  children: React.ReactNode;
  requiredTier?: 'free' | 'pro' | 'enterprise';
  fallbackPath?: string;
}

export const SubscriptionProtectedRoute: React.FC<SubscriptionProtectedRouteProps> = ({ 
  children, 
  requiredTier = 'pro',
  fallbackPath = '/dashboard'
}) => {
  const { user, loading, hasActiveSubscription } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!hasActiveSubscription(requiredTier)) {
    return <Navigate to={fallbackPath} state={{ 
      error: `This feature requires a ${requiredTier} subscription.` 
    }} replace />;
  }

  return <>{children}</>;
};