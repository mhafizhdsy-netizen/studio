
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/supabase/auth-provider';
import { LoginForm } from '@/components/auth/LoginForm';
import { SymbolicLoader } from '@/components/ui/symbolic-loader';

export default function LoginPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user) {
      router.replace('/dashboard');
    }
  }, [user, isLoading, router]);

  if (isLoading || user) {
    return (
        <div className="flex h-screen w-full items-center justify-center bg-background">
            <SymbolicLoader />
        </div>
    );
  }

  return <LoginForm />;
}
