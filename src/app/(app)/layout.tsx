
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/supabase/auth-provider";
import { SidebarProvider, Sidebar, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

// This function syncs the Firebase Auth user to the Supabase `users` table.
const syncUserProfile = async (user: User) => {
    // Check if profile already exists
    const { data: existingProfile } = await supabase
        .from('users')
        .select('id')
        .eq('id', user.id)
        .single();
    
    if (existingProfile) return; // Already exists

    // If not, create a new one
    const { error } = await supabase.from('users').insert({
        id: user.id,
        name: user.user_metadata.name,
        email: user.email,
        photoURL: user.user_metadata.avatar_url || user.user_metadata.picture, // Google OAuth uses avatar_url or picture
    });

    if (error) {
        console.error('Error syncing user profile to Supabase', error);
    }
};


export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, session } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/");
    }
    
    // When the user logs in, sync their profile to the public.users table
    if (user && session) {
        syncUserProfile(user);
    }

  }, [user, isLoading, session, router]);


  if (isLoading || !user) {
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
