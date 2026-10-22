'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { Skeleton } from '@/components/ui/skeleton';

interface GuardProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: GuardProps) {
  const { isAuthenticated, isLoading } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Skeleton className="w-16 h-16 rounded-full" />
        <Skeleton className="w-[200px] h-4" />
      </div>
    );
  }

  return isAuthenticated ? <>{children}</> : null;
}

export function AdminRoute({ children }: GuardProps) {
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.replace('/login');
      } else if (user?.role?.toUpperCase() !== 'ADMIN') {
        router.replace('/');
      }
    }
  }, [isAuthenticated, user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Skeleton className="w-16 h-16 rounded-full" />
        <Skeleton className="w-[250px] h-4" />
      </div>
    );
  }

  return isAuthenticated && user?.role?.toUpperCase() === 'ADMIN' ? <>{children}</> : null;
}

export function GuestRoute({ children }: GuardProps) {
  const { isAuthenticated, isLoading } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace('/');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Skeleton className="w-16 h-16 rounded-full" />
        <Skeleton className="w-[150px] h-4" />
      </div>
    );
  }

  return !isAuthenticated ? <>{children}</> : null;
}
