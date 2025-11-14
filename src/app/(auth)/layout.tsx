
'use client';

import { useAuth } from "@/supabase/auth-provider";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { SymbolicLoader } from "@/components/ui/symbolic-loader";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background p-4 animate-page-fade-in">
        <div className="w-full max-w-sm">
            {children}
        </div>
    </div>
  );
}
