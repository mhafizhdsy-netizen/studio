"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import { SignupForm } from '@/components/auth/SignupForm';
import { Skeleton } from '@/components/ui/skeleton';

export default function SignupPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && user) {
      router.push('/dashboard');
    }
  }, [user, isUserLoading, router]);
  
  // Show a loading skeleton while checking the user's status, or if the user is already logged in.
  // This prevents the signup form from flashing before the redirect happens.
  if (isUserLoading || user) {
    return (
      <div className="w-full max-w-md space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-6 w-full" />
      </div>
    );
  }

  // Only show the SignupForm if we are done loading and there is no user.
  return <SignupForm />;
}
