
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser, useAuth } from "@/firebase";
import { supabase, setSupabaseAuthToken } from "@/lib/supabase";
import { SidebarProvider, Sidebar, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { Loader2 } from "lucide-react";


export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.replace("/");
    }
  }, [user, isUserLoading, router]);

  useEffect(() => {
    if (isUserLoading || !auth) return;

    // This function handles the synchronization.
    const syncUserAndSetAuth = async (currentUser: import('firebase/auth').User | null) => {
        if (currentUser && supabase) {
            try {
                // 1. Get the Firebase ID token.
                const token = await currentUser.getIdToken(true); // Force refresh
                
                // 2. Set Supabase auth token. This is the crucial step for RLS.
                setSupabaseAuthToken(token);

                // 3. Check if user profile exists in Supabase.
                const { data, error: selectError } = await supabase
                    .from('users')
                    .select('id')
                    .eq('id', currentUser.uid)
                    .single();

                if (selectError && selectError.code !== 'PGRST116') { // PGRST116 is "exact-one-row-not-found", which is expected for new users.
                    console.error("Error checking user profile in Supabase:", selectError);
                }

                // 4. If profile doesn't exist, create it.
                if (!data) {
                    const { error: upsertError } = await supabase.from('users').upsert({
                        id: currentUser.uid,
                        name: currentUser.displayName || 'Pengguna Baru',
                        email: currentUser.email,
                        photoURL: currentUser.photoURL,
                        isAdmin: false,
                        onboardingCompleted: false
                    });
                    if (upsertError) {
                        console.error("Error creating Supabase user profile:", upsertError);
                    }
                }
            } catch (e) {
                console.error("Error in token/sync process:", e);
            }
        } else {
            // User is logged out, clear the Supabase token.
            setSupabaseAuthToken(null);
        }
    };

    // Run the sync function for the initial user state.
    syncUserAndSetAuth(user);

    // Set up the listener for subsequent auth state changes.
    const unsubscribe = auth.onIdTokenChanged(syncUserAndSetAuth);

    // Cleanup subscription on unmount.
    return () => unsubscribe();
  }, [user, isUserLoading, auth]);


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
