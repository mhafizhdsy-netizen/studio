
'use client';

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/supabase/auth-provider";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { SymbolicLoader } from "@/components/ui/symbolic-loader";

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
    const [isAdmin, setIsAdmin] = useState(false);
    
    const { data: status, isLoading: isStatusLoading } = useQuery({
        queryKey: ['siteStatus'],
        queryFn: fetchSiteStatus,
        refetchInterval: 60000, // Check every minute
    });

     useEffect(() => {
        const checkAdmin = async () => {
            if (!user) {
                setIsAdmin(false);
                return;
            };
            const { data } = await supabase.from('users').select('isAdmin').eq('id', user.id).single();
            setIsAdmin(data?.isAdmin || false);
        };
        checkAdmin();
    }, [user]);

    useEffect(() => {
        if (isStatusLoading || isAuthLoading) return;

        // Admins are always allowed
        if (isAdmin) {
            return;
        }

        if (status?.isMaintenanceMode || status?.isUpdateMode) {
            router.replace('/maintenance');
        }
    }, [status, isStatusLoading, user, isAuthLoading, router, isAdmin]);

    // If status is loading, and the user is not an admin, show a loading screen.
    // This prevents a flash of the dashboard content before redirection happens.
    if ((isStatusLoading || isAuthLoading) && !isAdmin) {
         return (
            <div className="flex h-screen w-full items-center justify-center bg-background">
                <SymbolicLoader />
            </div>
        );
    }
    
    // If status is active and user is not admin, they should be redirected.
    // We render a loader to prevent showing the dashboard layout.
    if (!isAdmin && (status?.isMaintenanceMode || status?.isUpdateMode)) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-background">
                <SymbolicLoader />
            </div>
        );
    }

    // Otherwise, render the app
    return <>{children}</>;
}
