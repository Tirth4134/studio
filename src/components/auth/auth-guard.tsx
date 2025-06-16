
"use client";

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { monitorAuthState, type User } from '@/lib/firebase'; // Ensure User type is imported if not globally available
import { useToast } from '@/hooks/use-toast';

// IMPORTANT: Replace this with your actual admin emails
const ADMIN_EMAILS = ['ptirthv4134@gmail.com', 'testadmin@example.com']; 

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loadingAuthState, setLoadingAuthState] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  useEffect(() => {
    console.log('[AuthGuard] useEffect: Subscribing to auth state');
    const unsubscribe = monitorAuthState((currentUser) => {
      console.log('[AuthGuard] monitorAuthState callback. User:', currentUser);
      setUser(currentUser);
      setLoadingAuthState(false);
    });
    return () => {
      console.log('[AuthGuard] useEffect cleanup: Unsubscribing from auth state');
      unsubscribe();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    console.log('[AuthGuard] useEffect for routing logic. State:', { loadingAuthState, user: user?.email, pathname });
    if (loadingAuthState) {
      console.log('[AuthGuard] useEffect: Auth state still loading, returning.');
      return; 
    }

    const isAdmin = user && user.email && ADMIN_EMAILS.includes(user.email);
    console.log('[AuthGuard] useEffect: isAdmin:', isAdmin);

    if (!user) {
      // Not logged in
      if (pathname !== '/login') {
        console.log('[AuthGuard] useEffect: No user, not on /login. Redirecting to /login.');
        router.push('/login');
      } else {
        console.log('[AuthGuard] useEffect: No user, already on /login.');
      }
    } else {
      // Logged in
      if (isAdmin) {
        if (pathname === '/login') {
          console.log('[AuthGuard] useEffect: Admin on /login. Redirecting to /.');
          router.push('/'); 
        } else {
          console.log('[AuthGuard] useEffect: Admin on protected page. Allowing access.');
        }
      } else {
        // Logged in but NOT an admin
        if (pathname !== '/login') {
          console.log('[AuthGuard] useEffect: Non-admin on protected page. Redirecting to /login with error.');
          toast({
            title: 'Access Denied',
            description: 'You do not have permission to access this page. Please login with an admin account.',
            variant: 'destructive',
            duration: 5000,
          });
          router.push('/login?error=unauthorized'); 
        } else {
           console.log('[AuthGuard] useEffect: Non-admin on /login. Allowing to stay.');
        }
      }
    }
  }, [user, loadingAuthState, pathname, router, toast]);

  console.log('[AuthGuard] Render evaluation. State:', { loadingAuthState, user: user?.email, pathname });

  if (loadingAuthState) {
    console.log('[AuthGuard] Rendering: Loading Spinner');
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary"></div>
        <p className="mt-4 text-lg text-muted-foreground">Authenticating...</p>
      </div>
    );
  }

  // If on the login page, always render it (AuthGuard's children for this path will be LoginPage)
  if (pathname === '/login') {
    console.log('[AuthGuard] Rendering: Login Page (/login path)');
    return <>{children}</>; 
  }
  
  // If user is an admin and not on the login page, render the protected content
  if (user && user.email && ADMIN_EMAILS.includes(user.email)) {
    console.log('[AuthGuard] Rendering: Protected Content for Admin (not /login path)');
    return <>{children}</>; 
  }
  
  // Fallback: Should ideally be handled by redirects in useEffect.
  // If this is rendered, it means the user is not authenticated or not an admin, and is not on the login page,
  // and the redirect hasn't happened or completed yet.
  console.log('[AuthGuard] Rendering: Fallback (null) - indicates potential issue or redirect in progress.');
  return null;
}
    
