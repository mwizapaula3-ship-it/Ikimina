'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: string | string[];
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useAuth();

  const roles = requiredRole ? (Array.isArray(requiredRole) ? requiredRole : [requiredRole]) : null;
  const roleAllowed = !roles || (user ? roles.includes(user.role) : false);

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }

    if (roles && !roleAllowed) {
      router.replace('/unauthorized');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, isAuthenticated, roleAllowed]);

  // While auth state is hydrating from localStorage, or once we know a redirect
  // is coming, render nothing rather than flashing protected content or bouncing
  // a genuinely authenticated user during the initial load race.
  if (isLoading || !isAuthenticated || (roles && !roleAllowed)) {
    return null;
  }

  return <>{children}</>;
}
