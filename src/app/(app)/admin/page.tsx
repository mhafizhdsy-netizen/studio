
"use client";

import { useAuth } from "@/supabase/auth-provider";
import { AdminDashboard } from "@/components/dashboard/AdminDashboard";
import { Loader2, ShieldAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { InfinityLoader } from "@/components/ui/infinity-loader";

export default function AdminPage() {
    const { user, isLoading: isAuthLoading } = useAuth();
    const router = useRouter();
    const [isAdmin, setIsAdmin] = useState(false);
    const [isLoading, setIsLoading] = useState(true);


    useEffect(() => {
        const checkAdminStatus = async () => {
            if (isAuthLoading) return;
            if (!user) {
                router.replace('/dashboard');
                return;
            }

            setIsLoading(true);
            const { data } = await supabase
                .from('users')
                .select('isAdmin')
                .eq('id', user.id)
                .single();

            const isAdminUser = data?.isAdmin || false;
            setIsAdmin(isAdminUser);

            if (!isAdminUser) {
                router.replace('/dashboard');
            }
            setIsLoading(false);
        }
        checkAdminStatus();
    }, [isAuthLoading, user, router]);

    if (isLoading || isAuthLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <InfinityLoader />
            </div>
        );
    }
    
    if (!isAdmin) {
        return (
            <main className="flex flex-1 flex-col items-center justify-center p-4 lg:p-6">
                 <Card className="w-full max-w-md text-center">
                    <CardHeader>
                        <CardTitle className="flex items-center justify-center gap-2 text-destructive">
                            <ShieldAlert className="h-6 w-6"/>
                            Akses Ditolak
                        </CardTitle>
                        <CardDescription>
                            Halaman ini hanya untuk admin.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">Anda akan dialihkan ke dashboard.</p>
                    </CardContent>
                </Card>
            </main>
        )
    }

    return (
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
            <AdminDashboard />
        </main>
    );
}
