"use client";

import { useAuth } from '@/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';

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

  // Don't render if not authenticated or role not allowed
  if (!isAuthenticated || (user && !allowedRoles.includes(user.role))) {
    return null;
  }

  // Render children if all checks pass
  return <>{children}</>;
}
