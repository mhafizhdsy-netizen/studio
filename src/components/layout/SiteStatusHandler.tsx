
'use client';

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/supabase/auth-provider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { InfinityLoader } from "@/components/ui/infinity-loader";

const fetchSiteStatus = async () => {
    const { data, error } = await supabase
        .from('site_status')
        .select('*')
        .eq('id', 1)
        .single();
    if (error && error.code !== 'PGRST116') { // Ignore "No rows found"
        throw error;
    }
    return data;
}

export function SiteStatus({ children }: { children: React.ReactNode }) {
    const { user, isLoading: isAuthLoading } = useAuth();
    const router = useRouter();
    const { data: status, isLoading: isStatusLoading } = useQuery({
        queryKey: ['siteStatus'],
        queryFn: fetchSiteStatus,
        refetchInterval: 60000, // Check every minute
    });

    useEffect(() => {
        if (isStatusLoading || isAuthLoading) return;

        // Admins are always allowed
        if (user?.user_metadata.isAdmin) {
            return;
        }

        if (status?.isMaintenanceMode || status?.isUpdateMode) {
            router.replace('/maintenance');
        }
    }, [status, isStatusLoading, user, isAuthLoading, router]);

    // If status is loading, and the user is not an admin, show a loading screen.
    // This prevents a flash of the dashboard content before redirection happens.
    if ((isStatusLoading || isAuthLoading) && !user?.user_metadata.isAdmin) {
         return (
            <div className="flex h-screen w-full items-center justify-center bg-background">
                <InfinityLoader />
            </div>
        );
    }
    
    // If status is active and user is not admin, they should be redirected.
    // We render a loader to prevent showing the dashboard layout.
    if (!user?.user_metadata.isAdmin && (status?.isMaintenanceMode || status?.isUpdateMode)) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-background">
                <InfinityLoader />
            </div>
        );
    }

    // Otherwise, render the app
    return <>{children}</>;
}
