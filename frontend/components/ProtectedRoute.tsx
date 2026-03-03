"use client";

import { useAuth } from '@/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import DashboardLoading from '@/components/DashboardLoading';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: Array<'user' | 'admin'>;
  redirectTo?: string;
}

export default function ProtectedRoute({
  children,
  allowedRoles = ['user', 'admin'],
  redirectTo = '/login',
}: ProtectedRouteProps) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const [serversReady, setServersReady] = useState(false);

  // Polling Server Health
  useEffect(() => {
    let interval: NodeJS.Timeout;

    // Check if the route is dashboard-related. If so, poll servers; otherwise, bypass.
    if (!pathname.startsWith('/dashboard')) {
      setServersReady(true);
      return;
    }

    const checkServers = async () => {
      try {
        const res = await fetch('/api/health-check').catch(() => null);

        if (res?.ok) {
          setServersReady(true);
          return true;
        }
      } catch {
        return false;
      }
      return false;
    };

    checkServers().then(ready => {
      if (!ready) {
        interval = setInterval(async () => {
          const isReady = await checkServers();
          if (isReady) clearInterval(interval);
        }, 3000); // Check every 3 seconds
      }
    });

    return () => clearInterval(interval);
  }, [pathname]);

  useEffect(() => {
    // Wait for loading to complete
    if (isLoading) return;

    // Check if user is authenticated
    if (!isAuthenticated) {
      // Store intended destination
      sessionStorage.setItem('redirectAfterLogin', pathname);
      router.push(redirectTo);
      return;
    }

    // Check if user role is allowed
    if (user && !allowedRoles.includes(user.role)) {
      // Redirect based on role
      if (user.role === 'admin') {
        router.push('/dashboard');
      } else {
        router.push('/dashboard');
      }
    }
  }, [isLoading, isAuthenticated, user, allowedRoles, router, pathname, redirectTo]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show beautiful initialization animation if servers aren't ready and user is authenticated
  if (isAuthenticated && !serversReady && pathname.startsWith('/dashboard')) {
    return <DashboardLoading />;
  }

  // Don't render if not authenticated or role not allowed
  if (!isAuthenticated || (user && !allowedRoles.includes(user.role))) {
    return null;
  }

  // Render children if all checks pass
  return <>{children}</>;
}
