
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
    const unsubscribe = monitorAuthState((currentUser) => {
      setUser(currentUser);
      setLoadingAuthState(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (loadingAuthState) {
      return; // Don't do anything while auth state is loading
    }

    const isAdmin = user && user.email && ADMIN_EMAILS.includes(user.email);

    if (!user) {
      // Not logged in
      if (pathname !== '/login') {
        router.push('/login');
      }
    } else {
      // Logged in
      if (isAdmin) {
        if (pathname === '/login') {
          router.push('/'); // Admin is on login page, redirect to home
        }
        // Admin is logged in and not on login page, allow access (children will render)
      } else {
        // Logged in but NOT an admin
        if (pathname !== '/login') {
          // To prevent an infinite loop if they were already on /login
          // and ensure the toast is shown when redirected from a protected page
          toast({
            title: 'Access Denied',
            description: 'You do not have permission to access this page. Please login with an admin account.',
            variant: 'destructive',
            duration: 5000,
          });
          router.push('/login?error=unauthorized'); 
        }
        // If they are a non-admin and already on /login, let them stay there (e.g. to try again)
      }
    }
  }, [user, loadingAuthState, pathname, router, toast]);

  if (loadingAuthState) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary"></div>
        <p className="mt-4 text-lg text-muted-foreground">Authenticating...</p>
      </div>
    );
  }

  // If user is loaded, not admin, and trying to access a protected route, 
  // the useEffect above would have redirected.
  // If on login page, or if admin on protected route, render children.
  if (pathname === '/login') {
    return <>{children}</>; // Render login page
  }
  
  // Check if user is admin before rendering protected children
  if (user && user.email && ADMIN_EMAILS.includes(user.email)) {
    return <>{children}</>; // Render protected content for admin
  }
  
  // Fallback: if not loading, not on login, and not an admin (should have been redirected, but as safety)
  // This will effectively show the loading spinner until redirection happens.
  // Or, if already on login page and not admin, login page is rendered.
  // If an unauthenticated user tries to access a protected page, they will be redirected.
  return null; // Or a more specific loading/redirecting indicator
}

    