
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/supabase/auth-provider";
import { SidebarProvider, Sidebar, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

// This function syncs the user profile to the Supabase `users` table.
const syncUserProfile = async (user: User) => {
    try {
        // Check if profile already exists.
        // We select 'id' to minimize data transfer.
        const { data: existingProfile, error: selectError } = await supabase
            .from('users')
            .select('id')
            .eq('id', user.id)
            .single();

        // If there's an error other than "no rows found", log it.
        if (selectError && selectError.code !== 'PGRST116') {
            throw selectError;
        }

        // If profile already exists, we're done.
        if (existingProfile) {
            return;
        }

        // If not, create a new profile.
        // We carefully select the data to insert to avoid errors.
        const { error: insertError } = await supabase.from('users').insert({
            id: user.id,
            email: user.email,
            // Handle different metadata structures from email/password vs. OAuth
            name: user.user_metadata?.name || user.user_metadata?.full_name || 'Pengguna Baru',
            photoURL: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
        });

        if (insertError) {
            throw insertError;
        }
    } catch (error) {
        // This log helps in debugging if the sync process fails.
        console.error('Error syncing user profile to Supabase', error);
    }
};


export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, session } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If loading is finished and there's no user, redirect to login.
    if (!isLoading && !user) {
      router.replace("/");
    }
    
    // When the user and session are confirmed, sync their profile.
    // This is crucial for new sign-ups.
    if (user && session) {
        syncUserProfile(user);
    }

  }, [user, isLoading, session, router]);


  // Show a loading screen while authentication status is being determined.
  if (isLoading || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  // Render the main app layout once the user is authenticated.
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
