
"use client";

import { useAuth } from "@/supabase/auth-provider";
import { AdminDashboard } from "@/components/dashboard/AdminDashboard";
import { Loader2, ShieldAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export default function AdminPage() {
    const { user, isLoading } = useAuth();
    const router = useRouter();

    const isAdmin = user?.user_metadata?.isAdmin || false;

    useEffect(() => {
        if (!isLoading && !isAdmin) {
            router.replace('/dashboard');
        }
    }, [isLoading, isAdmin, router]);

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
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
