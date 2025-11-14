
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/firebase";
import { supabase } from "@/lib/supabase";
import { SidebarProvider, Sidebar, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { Loader2 } from "lucide-react";


export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.replace("/");
    }
  }, [user, isUserLoading, router]);

  useEffect(() => {
    const ensureSupabaseProfile = async () => {
        if (user && supabase) {
            const { data } = await supabase.from('users').select('id').eq('id', user.uid).single();
            if (!data) {
                // Profile doesn't exist, create it
                await supabase.from('users').upsert({
                    id: user.uid,
                    name: user.displayName || 'Pengguna Baru',
                    email: user.email,
                    photoURL: user.photoURL,
                    isAdmin: false,
                    onboardingCompleted: false
                });
            }
        }
    };

    if (!isUserLoading && user) {
        ensureSupabaseProfile();
    }
  }, [user, isUserLoading]);

  if (isUserLoading || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <Sidebar>
        <AppSidebar />
      </Sidebar>
      <SidebarInset className="animate-page-fade-in">
        <header className="flex h-14 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-4 md:hidden sticky top-0 z-10">
            <SidebarTrigger />
            <h1 className="text-lg font-semibold font-headline">HitunginAja</h1>
        </header>
        {children}
        </SidebarInset>
    </SidebarProvider>
  );
}
