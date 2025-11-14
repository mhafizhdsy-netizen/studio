
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/supabase/auth-provider";
import { SidebarProvider, Sidebar, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { InfinityLoader } from "@/components/ui/infinity-loader";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import { SiteStatus } from "@/components/layout/SiteStatusHandler";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, session } = useAuth();
  const router = useRouter();

  // Show a loading screen while authentication status is being determined.
  if (isLoading || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <InfinityLoader />
      </div>
    );
  }

  // Render the main app layout once the user is authenticated.
  return (
    <SidebarProvider>
      <SiteStatus>
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
        </SiteStatus>
    </SidebarProvider>
  );
}

    
