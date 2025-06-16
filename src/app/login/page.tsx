
"use client";

import { useState, useEffect } from 'react'; // Added useEffect
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { loginUser, signInWithGoogle, sendPasswordReset } from '@/lib/firebase'; 
import { useToast } from '@/hooks/use-toast';
import { LogIn, Mail, KeyRound, Chrome } from 'lucide-react'; 

// Helper function to get specific error messages
const getAuthErrorMessage = (errorCode: string): string => {
  switch (errorCode) {
    case 'auth/invalid-email':
      return 'Invalid email format. Please enter a valid email.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential': 
      return 'Invalid email or password. Please try again.';
    case 'auth/user-disabled':
      return 'This user account has been disabled.';
    case 'auth/too-many-requests':
      return 'Too many login attempts. Please try again later or reset your password.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your internet connection.';
    default:
      return 'Login failed. Please try again.';
  }
};


export default function LoginPage() {
  console.log('[LoginPage] Component rendering or re-rendering.'); // Log when component renders

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isResetLoading, setIsResetLoading] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    console.log('[LoginPage] Mounted.'); // Log when component mounts
    return () => {
      console.log('[LoginPage] Unmounted.'); // Log when component unmounts
    };
  }, []);


  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    console.log('[LoginPage] Attempting email/password login for:', email);
    try {
      await loginUser(email, password);
      toast({ title: 'Login Successful', description: 'Welcome back!' });
      console.log('[LoginPage] Email/password login successful. Redirecting to /');
      router.push('/'); 
    } catch (err: any) {
      const errorMessage = getAuthErrorMessage(err.code);
      setError(errorMessage);
      toast({ title: 'Login Failed', description: errorMessage, variant: 'destructive' });
      console.error('[LoginPage] Email/password login failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setError(null);
    console.log('[LoginPage] Attempting Google Sign-In.');
    try {
      await signInWithGoogle();
      toast({ title: 'Google Sign-In Successful', description: 'Welcome!' });
      console.log('[LoginPage] Google Sign-In successful. Redirecting to /');
      router.push('/');
    } catch (err: any) {
      const errorMessage = getAuthErrorMessage(err.code);
      setError(errorMessage);
      toast({ title: 'Google Sign-In Failed', description: errorMessage, variant: 'destructive' });
      console.error('[LoginPage] Google Sign-In failed:', err);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handlePasswordResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) {
      toast({ title: 'Email Required', description: 'Please enter your email address to reset password.', variant: 'destructive' });
      return;
    }
    setIsResetLoading(true);
    setError(null);
    console.log('[LoginPage] Requesting password reset for:', resetEmail);
    try {
      await sendPasswordReset(resetEmail);
      toast({ title: 'Password Reset Email Sent', description: 'Check your email for instructions to reset your password.' });
      setShowResetPassword(false);
      setResetEmail('');
      console.log('[LoginPage] Password reset email sent successfully.');
    } catch (err: any) {
      let specificError = 'Failed to send password reset email. Please try again.';
      if (err.code === 'auth/invalid-email') {
        specificError = 'The email address is not valid.';
      } else if (err.code === 'auth/user-not-found') {
        specificError = 'No user found with this email address.';
      }
      setError(specificError);
      toast({ title: 'Password Reset Failed', description: specificError, variant: 'destructive' });
      console.error('[LoginPage] Password reset failed:', err);
    } finally {
      setIsResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto bg-primary text-primary-foreground rounded-full p-3 w-fit mb-4">
            <KeyRound className="h-8 w-8" />
          </div>
          <CardTitle className="text-2xl font-headline">Admin Login</CardTitle>
          <CardDescription>Access your InvoiceFlow dashboard.</CardDescription>
        </CardHeader>

        {!showResetPassword ? (
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading || isGoogleLoading}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                 <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading || isGoogleLoading}
                    className="pl-10"
                  />
                </div>
              </div>
              {error && <p className="text-sm text-destructive text-center">{error}</p>}
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={isLoading || isGoogleLoading}>
                {isLoading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-primary-foreground mr-2"></div>
                ) : (
                  <LogIn className="mr-2 h-5 w-5" />
                )}
                {isLoading ? 'Logging in...' : 'Login'}
              </Button>
              <div className="relative w-full">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or continue with
                  </span>
                </div>
              </div>
              <Button variant="outline" type="button" className="w-full" onClick={handleGoogleSignIn} disabled={isLoading || isGoogleLoading}>
                {isGoogleLoading ? (
                   <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-foreground mr-2"></div>
                ) : (
                  <Chrome className="mr-2 h-5 w-5" />
                )}
                {isGoogleLoading ? 'Signing in...' : 'Sign in with Google'}
              </Button>
              <Button variant="link" size="sm" type="button" onClick={() => { setShowResetPassword(true); setError(null); }} className="text-sm">
                Forgot Password?
              </Button>
            </CardFooter>
          </form>
        ) : (
          <form onSubmit={handlePasswordResetRequest}>
            <CardContent className="space-y-4">
              <CardDescription className="text-center">
                Enter your email address and we'll send you a link to reset your password.
              </CardDescription>
              <div className="space-y-2">
                <Label htmlFor="reset-email">Email for Password Reset</Label>
                 <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="reset-email"
                      type="email"
                      placeholder="your-email@example.com"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      required
                      disabled={isResetLoading}
                      className="pl-10"
                    />
                </div>
              </div>
              {error && <p className="text-sm text-destructive text-center">{error}</p>}
            </CardContent>
            <CardFooter className="flex flex-col gap-2">
              <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={isResetLoading}>
                {isResetLoading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-primary-foreground mr-2"></div>
                ) : (
                  <Mail className="mr-2 h-5 w-5" />
                )}
                {isResetLoading ? 'Sending...' : 'Send Password Reset Email'}
              </Button>
              <Button variant="link" size="sm" type="button" onClick={() => { setShowResetPassword(false); setError(null); }} className="text-sm">
                Back to Login
              </Button>
            </CardFooter>
          </form>
        )}
      </Card>
    </div>
  );
}
