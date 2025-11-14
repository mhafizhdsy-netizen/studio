
"use client";

import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { AdminDashboard } from "@/components/dashboard/AdminDashboard";
import { Loader2, ShieldAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

interface UserProfile {
    isAdmin?: boolean;
}

export default function AdminPage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const router = useRouter();

    const userDocRef = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return doc(firestore, 'users', user.uid);
    }, [user, firestore]);

    const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userDocRef);

    useEffect(() => {
        // If profile is loaded and user is not an admin, redirect them
        if (!isUserLoading && !isProfileLoading && userProfile && !userProfile.isAdmin) {
            router.replace('/dashboard');
        }
    }, [isUserLoading, isProfileLoading, userProfile, router]);
    
    const isLoading = isUserLoading || isProfileLoading;

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }
    
    // If after loading, the user is still not an admin (or no profile), show access denied
    if (!userProfile?.isAdmin) {
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

    // Render admin dashboard if user is an admin
    return (
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
            <AdminDashboard />
        </main>
    );
}
