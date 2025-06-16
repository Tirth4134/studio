
"use client";

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { monitorAuthState, type User } from '@/lib/firebase'; 
import { useToast } from '@/hooks/use-toast';

// IMPORTANT: Replace this with your actual admin emails
const ADMIN_EMAILS = ['ptirthv4134@gmail.com', 'testadmin@example.com']; 

interface AuthGuardProps {
  children: React.ReactNode;
}

function AuthLoadingSpinner({ message }: { message: string }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary"></div>
      <p className="mt-4 text-lg text-muted-foreground">{message}</p>
    </div>
  );
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
      console.log('[AuthGuard] monitorAuthState callback. User:', currentUser ? currentUser.email : 'null');
      setUser(currentUser);
      setLoadingAuthState(false);
    });
    return () => {
      console.log('[AuthGuard] useEffect cleanup: Unsubscribing from auth state');
      unsubscribe();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // No dependencies, runs once on mount

  useEffect(() => {
    console.log('[AuthGuard] useEffect for routing logic. State:', { loadingAuthState, user: user?.email, pathname });
    if (loadingAuthState) {
      console.log('[AuthGuard] useEffect (routing): Auth state still loading, returning.');
      return; 
    }

    const isAdmin = user && user.email && ADMIN_EMAILS.includes(user.email);
    console.log('[AuthGuard] useEffect (routing): isAdmin:', isAdmin);

    if (!user) {
      // Not logged in
      if (pathname !== '/login') {
        console.log('[AuthGuard] useEffect (routing): No user, not on /login. Redirecting to /login.');
        router.push('/login');
      } else {
        console.log('[AuthGuard] useEffect (routing): No user, already on /login.');
      }
    } else {
      // Logged in
      if (isAdmin) {
        if (pathname === '/login') {
          console.log('[AuthGuard] useEffect (routing): Admin on /login. Redirecting to /.');
          router.push('/'); 
        } else {
          console.log('[AuthGuard] useEffect (routing): Admin on protected page. Allowing access.');
        }
      } else {
        // Logged in but NOT an admin
        if (pathname !== '/login') {
          console.log('[AuthGuard] useEffect (routing): Non-admin on protected page. Redirecting to /login with error.');
          toast({
            title: 'Access Denied',
            description: 'You do not have permission to access this page. Please login with an admin account.',
            variant: 'destructive',
            duration: 5000,
          });
          router.push('/login?error=unauthorized'); 
        } else {
           console.log('[AuthGuard] useEffect (routing): Non-admin on /login. Allowing to stay (likely after unauthorized redirect).');
        }
      }
    }
  }, [user, loadingAuthState, pathname, router, toast]); // Dependencies for routing logic

  console.log('[AuthGuard] Render evaluation. State:', { loadingAuthState, user: user?.email, pathname });

  if (loadingAuthState) {
    console.log('[AuthGuard] Rendering: Auth state loading spinner (Authenticating...).');
    return <AuthLoadingSpinner message="Authenticating..." />;
  }

  // At this point, loadingAuthState is false. Auth state is resolved.
  const isAdmin = user && user.email && ADMIN_EMAILS.includes(user.email);

  if (!user) { // User is not logged in
    if (pathname === '/login') {
      console.log('[AuthGuard] Rendering: No user, on /login. Rendering children (LoginPage).');
      return <>{children}</>; // Render LoginPage
    } else {
      console.log('[AuthGuard] Rendering: No user, not on /login. Redirect should be in progress. Showing loading spinner (Redirecting to login...).');
      return <AuthLoadingSpinner message="Redirecting to login..." />;
    }
  } else { // User is logged in
    if (isAdmin) {
      if (pathname === '/login') {
        console.log('[AuthGuard] Rendering: Admin on /login. Redirect should be in progress to /. Showing loading spinner (Redirecting to dashboard...).');
        return <AuthLoadingSpinner message="Redirecting to dashboard..." />;
      } else {
        console.log('[AuthGuard] Rendering: Admin on protected page. Rendering children (Protected Content).');
        return <>{children}</>; // Render protected content
      }
    } else { // Logged in, but NOT an admin
      if (pathname === '/login') {
        console.log('[AuthGuard] Rendering: Non-admin on /login. Rendering children (LoginPage - likely after unauthorized redirect).');
        return <>{children}</>; // Render LoginPage (e.g. to show error or allow re-login attempt)
      } else {
        console.log('[AuthGuard] Rendering: Non-admin on protected page. Redirect should be in progress to /login. Showing loading spinner (Access Denied. Redirecting...).');
        return <AuthLoadingSpinner message="Access Denied. Redirecting..." />;
      }
    }
  }
}
    
