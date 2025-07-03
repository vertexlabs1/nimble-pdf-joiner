
import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Lock, FileText } from 'lucide-react';
import loginIllustration from '@/assets/login-illustration.jpg';
import EmailVerificationSuccess from '@/components/EmailVerificationSuccess';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [showEmailVerification, setShowEmailVerification] = useState(false);
  const { signIn, signUp, user, isAdmin, loading, adminLoading } = useAuth();
  const { toast } = useToast();
  const location = useLocation();

  // Show error from navigation state if present
  useEffect(() => {
    if (location.state?.error) {
      toast({
        title: "Access Denied",
        description: location.state.error,
        variant: "destructive",
      });
    }
  }, [location.state, toast]);

  // Show loading while checking auth state
  if (loading || (user && adminLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  // Redirect if already authenticated and admin
  if (user && isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = isSignUp ? await signUp(email, password) : await signIn(email, password);

      if (error) {
        let errorMessage = error.message;
        
        // Provide better error messages
        if (error.message?.includes('Invalid login credentials')) {
          errorMessage = 'Invalid email or password. Please check your credentials.';
        } else if (error.message?.includes('User already registered')) {
          errorMessage = 'An account with this email already exists. Try signing in instead.';
        } else if (error.message?.includes('Signup not allowed')) {
          errorMessage = 'Account registration is currently disabled.';
        }

        toast({
          title: isSignUp ? "Sign Up Failed" : "Sign In Failed",
          description: errorMessage,
          variant: "destructive",
        });
      } else if (isSignUp) {
        // Show email verification screen instead of toast
        setShowEmailVerification(true);
      }
    } catch (error) {
      toast({
        title: isSignUp ? "Sign Up Failed" : "Sign In Failed",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    setShowEmailVerification(false);
    setEmail('');
    setPassword('');
    setIsSignUp(false);
  };

  const handleResendEmail = async () => {
    setIsLoading(true);
    const { error } = await signUp(email, password);
    setIsLoading(false);
    
    if (!error) {
      toast({
        title: "Email Resent",
        description: "We've sent another verification email to your inbox.",
        variant: "default",
      });
    } else {
      toast({
        title: "Failed to Resend",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Show email verification screen if signup was successful
  if (showEmailVerification) {
    return (
      <EmailVerificationSuccess 
        email={email}
        onBack={handleBackToLogin}
        onResendEmail={handleResendEmail}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="grid lg:grid-cols-2 h-screen">
        {/* Left Column - Login Form */}
        <div className="flex items-center justify-center p-8">
          <div className="w-full max-w-md space-y-8">
            {/* Header */}
            <div className="text-center space-y-3">
              <div className="flex items-center justify-center mb-4">
                <div className="flex items-center gap-2">
                  <FileText className="h-8 w-8 text-primary" />
                  <Lock className="h-6 w-6 text-muted-foreground" />
                </div>
              </div>
              <h1 className="text-4xl font-bold tracking-tight text-foreground">
                {isSignUp ? 'Create Account' : 'Pro Dashboard'}
              </h1>
              <p className="text-lg text-muted-foreground">
                {isSignUp ? 'Join to access professional PDF management tools' : 'Access your professional PDF management tools'}
              </p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium text-foreground">
                    Email address
                  </label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                    className="h-12 text-base transition-all duration-200"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium text-foreground">
                    {isSignUp ? 'Set Password' : 'Password'}
                  </label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={isSignUp ? "Create a password" : "Enter your password"}
                    required
                    className="h-12 text-base transition-all duration-200"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 text-base font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                    Signing in...
                  </div>
                  ) : (
                    isSignUp ? 'Create Account' : 'Sign in'
                  )}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-12 text-base font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                  onClick={() => setIsSignUp(!isSignUp)}
                >
                  {isSignUp ? 'Already have an account? Sign in' : 'Need an account? Sign up'}
                </Button>
            </form>

            {/* Footer */}
            <div className="text-center">
              <button 
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => {/* TODO: Implement forgot password */}}
              >
                Forgot password?
              </button>
            </div>
          </div>
        </div>

        {/* Right Column - Illustration */}
        <div className="hidden lg:flex items-center justify-center bg-muted/50 relative overflow-hidden">
          <div className="relative z-10 text-center max-w-lg px-8">
            <img 
              src={loginIllustration} 
              alt="Document Management Illustration" 
              className="w-full h-auto mb-8 rounded-lg shadow-lg"
            />
            <h2 className="text-2xl font-bold text-foreground mb-4">
              Professional Document Management
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Streamline your workflow with powerful PDF tools, secure document handling, and advanced management features.
            </p>
          </div>
          
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-muted/10" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
        </div>
      </div>
    </div>
  );
}
