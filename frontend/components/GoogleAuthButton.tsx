"use client";

import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { authService } from '@/lib/api/auth.service';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';

interface GoogleAuthButtonProps {
  mode: 'signin' | 'signup';
  onSuccess?: () => void;
}

export default function GoogleAuthButton({ mode, onSuccess }: GoogleAuthButtonProps) {
  const { toast } = useToast();
  const { login } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    if (!credentialResponse.credential) {
      toast({
        title: "Error",
        description: "Failed to get credentials from Google",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const idToken = credentialResponse.credential;

      let response;
      
      if (mode === 'signup') {
        // Call signup with Google
        response = await authService.signupWithGoogle({ idToken });
      } else {
        // Call login with Google
        response = await authService.loginWithGoogle({ idToken });
      }

      if (response.success && response.user) {
        toast({
          title: "Success",
          description: response.message,
          variant: "success",
        });

        // Update auth context
        login(response.user);

        // Call onSuccess callback if provided
        if (onSuccess) {
          onSuccess();
        }

        // Redirect to dashboard
        router.push('/dashboard');
      }
    } catch (error: any) {
      console.error('Google auth error:', error);
      
      toast({
        title: mode === 'signup' ? "Signup Failed" : "Login Failed",
        description: error.message || `Failed to ${mode === 'signup' ? 'sign up' : 'sign in'} with Google`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleError = () => {
    toast({
      title: "Error",
      description: "Failed to connect with Google",
      variant: "destructive",
    });
  };

  if (isLoading) {
    return (
      <Button
        type="button"
        variant="outline"
        className="flex items-center gap-3 w-full"
        disabled
      >
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>{mode === 'signup' ? 'Signing up...' : 'Signing in...'}</span>
      </Button>
    );
  }

  return (
    <GoogleLogin
      onSuccess={handleGoogleSuccess}
      onError={handleGoogleError}
      useOneTap={false}
      theme="outline"
      size="large"
      text={mode === 'signup' ? 'signup_with' : 'signin_with'}
      width="100%"
    />
  );
}
