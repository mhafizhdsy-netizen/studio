
'use client';

import { useAuth } from "@/supabase/auth-provider";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { SymbolicLoader } from "@/components/ui/symbolic-loader";
import { Logo } from "@/components/ui/logo";
import Link from "next/link";

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
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background p-4 animate-page-fade-in overflow-hidden relative">
        {/* Background shapes */}
        <div className="absolute -top-1/4 -left-1/4 w-96 h-96 bg-primary/5 rounded-full filter blur-3xl opacity-50 animate-blob"></div>
        <div className="absolute -bottom-1/4 -right-1/4 w-96 h-96 bg-accent/5 rounded-full filter blur-3xl opacity-50 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-1/4 -left-1/4 w-72 h-72 bg-primary/5 rounded-full filter blur-3xl opacity-50 animate-blob animation-delay-4000"></div>

        <div className="relative z-10 w-full max-w-sm">
            <div className="mb-8 flex flex-col items-center text-center">
                 <Link href="/" className="flex items-center gap-3 mb-4">
                    <Logo />
                    <h1 className="text-3xl font-bold font-headline text-foreground">
                        HitunginAja
                    </h1>
                </Link>
                <p className="text-muted-foreground">Waktunya Jadi #Sultan. Mulai hitung cuan-mu di sini.</p>
            </div>
            {children}
        </div>
    </div>
  );
}
