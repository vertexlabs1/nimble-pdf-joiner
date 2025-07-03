import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, CheckCircle } from 'lucide-react';

interface EmailProvider {
  name: string;
  url: string;
  logo: string;
}

const emailProviders: EmailProvider[] = [
  { name: 'Gmail', url: 'https://mail.google.com', logo: '🔴' },
  { name: 'Outlook', url: 'https://outlook.live.com', logo: '🔵' },
  { name: 'Yahoo', url: 'https://mail.yahoo.com', logo: '🟣' },
  { name: 'Apple Mail', url: 'https://www.icloud.com/mail', logo: '⚫' },
  { name: 'Proton', url: 'https://mail.proton.me', logo: '🟡' },
];

interface EmailVerificationSuccessProps {
  email: string;
  onBack: () => void;
  onResendEmail?: () => void;
}

export default function EmailVerificationSuccess({ 
  email, 
  onBack, 
  onResendEmail 
}: EmailVerificationSuccessProps) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="p-3 bg-primary/10 rounded-full">
              <Mail className="h-8 w-8 text-primary" />
            </div>
          </div>
          <div>
            <CardTitle className="text-2xl font-bold flex items-center justify-center gap-2">
              <CheckCircle className="h-6 w-6 text-green-500" />
              Check Your Email
            </CardTitle>
            <CardDescription className="mt-2">
              We've sent a verification link to <span className="font-semibold">{email}</span>
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="text-center space-y-3">
            <p className="text-sm text-muted-foreground">
              Thank you for signing up! Please check your email and click the verification link to activate your account.
            </p>
            
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground mb-3">
                Quick access to your email:
              </p>
              <div className="grid grid-cols-2 gap-2">
                {emailProviders.map((provider) => (
                  <Button
                    key={provider.name}
                    variant="outline"
                    size="sm"
                    className="h-10 text-xs"
                    onClick={() => window.open(provider.url, '_blank')}
                  >
                    <span className="mr-2">{provider.logo}</span>
                    {provider.name}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-2">
                Didn't receive the email?
              </p>
              {onResendEmail && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onResendEmail}
                  className="w-full"
                >
                  Resend Verification Email
                </Button>
              )}
            </div>

            <Button
              variant="ghost"
              onClick={onBack}
              className="w-full"
            >
              Back to Login
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}