
'use client';

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Construction, Rocket } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Logo } from "@/components/ui/logo";
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
    if (error) throw error;
    return data;
}

export default function MaintenancePage() {
    const { user, isLoading: isAuthLoading } = useAuth();
    const router = useRouter();
    const [isAdmin, setIsAdmin] = useState(false);
    const { data: status, isLoading: isStatusLoading, error } = useQuery({
        queryKey: ['siteStatus'],
        queryFn: fetchSiteStatus,
    });

    const isLoading = isAuthLoading || isStatusLoading;

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
      // If status is loaded, not in maintenance/update, redirect to app
      // Admins are exempt and can access the app anyway
      if (isAdmin) {
        router.replace('/dashboard');
        return;
      }
      if (!isStatusLoading && status && !status.isMaintenanceMode && !status.isUpdateMode) {
        router.replace('/dashboard');
      }
    }, [status, isStatusLoading, user, isAuthLoading, router, isAdmin]);

    const isMaintenance = status?.isMaintenanceMode;
    const title = isMaintenance ? status?.maintenanceTitle : status?.updateTitle;
    const message = isMaintenance ? status?.maintenanceMessage : status?.updateMessage;
    const Icon = isMaintenance ? Construction : Rocket;

    return (
        <div className="flex flex-col min-h-screen items-center justify-center bg-background p-4">
            <div className="absolute top-8 flex items-center gap-2">
                <Logo />
                <h1 className="text-2xl font-bold font-headline">HitunginAja</h1>
            </div>
            
            <Card className="w-full max-w-lg text-center animate-page-fade-in">
                <CardHeader>
                    {isLoading ? (
                        <div className="flex justify-center p-8">
                             <SymbolicLoader />
                        </div>
                    ) : (
                        <Icon className="mx-auto h-12 w-12 text-primary" />
                    )}
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="space-y-4">
                           <div className="h-8 bg-muted rounded w-3/4 mx-auto animate-pulse"></div>
                           <div className="h-4 bg-muted rounded w-full mx-auto animate-pulse"></div>
                           <div className="h-4 bg-muted rounded w-5/6 mx-auto animate-pulse"></div>
                        </div>
                    ) : (
                         <>
                            <CardTitle className="font-headline text-2xl mb-2">{title || (isMaintenance ? 'Situs Dalam Perbaikan' : 'Situs Sedang Diperbarui')}</CardTitle>
                            <CardDescription className="text-lg">
                                {message || 'Kami akan segera kembali. Terima kasih atas kesabaran Anda.'}
                            </CardDescription>
                         </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
