
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import { LoginForm } from '@/components/auth/LoginForm';
import { Skeleton } from '@/components/ui/skeleton';

export default function LoginPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && user) {
      // Check for suspension
      if ((user as any).isSuspended) {
        // Redirect to a suspended page or show a message
        // For now, redirecting to a placeholder or back to landing
        router.push('/?error=suspended');
        return;
      }
      router.push('/dashboard');
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading || user) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  return <LoginForm />;
}

    