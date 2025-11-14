
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/supabase/auth-provider";
import { SidebarProvider, Sidebar, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { SymbolicLoader } from "@/components/ui/symbolic-loader";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import { SiteStatus } from "@/components/layout/SiteStatusHandler";
import { cn } from "@/lib/utils";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);

  // This effect handles the display logic
  useEffect(() => {
    // If auth is no longer loading and we have a user, the app is ready.
    if (!isLoading && user) {
      setIsReady(true);
    }
    // If auth is not loading and there's no user, redirect them.
    if (!isLoading && !user) {
        router.replace('/login');
    }
  }, [isLoading, user, router]);

  // Show a loader until the initial auth check is complete.
  if (isLoading || !isReady) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background transition-opacity duration-500 ease-out">
        <SymbolicLoader />
      </div>
    );
  }

  // Render the main app layout once the user is authenticated and ready.
  return (
    <SidebarProvider>
      <SiteStatus>
        <div className={cn("transition-opacity duration-500 ease-in", isReady ? 'opacity-100' : 'opacity-0')}>
          <Sidebar>
            <AppSidebar />
          </Sidebar>
          <SidebarInset>
            <header className="flex h-14 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-4 md:hidden sticky top-0 z-10">
                <SidebarTrigger />
                <h1 className="text-lg font-semibold font-headline">HitunginAja</h1>
            </header>
            <main className="flex-1 overflow-y-auto">{children}</main>
            </SidebarInset>
          </div>
        </SiteStatus>
    </SidebarProvider>
  );
}
