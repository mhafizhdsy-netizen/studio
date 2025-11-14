
"use client";

import { useUser } from "@/firebase";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2, Shield, Ban, Wrench, UserPlus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export default function AdminPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [targetUid, setTargetUid] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isUserLoading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    user.getIdTokenResult().then((idTokenResult) => {
      const claims = idTokenResult.claims;
      if (claims.isAdmin) {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
        // Redirect non-admins away
        router.replace("/dashboard");
      }
    });
  }, [user, isUserLoading, router]);
  
  const handleMakeAdmin = async () => {
    if (!targetUid) {
        toast({
            title: "UID Diperlukan",
            description: "Silakan masukkan UID pengguna yang ingin dijadikan admin.",
            variant: "destructive",
        });
        return;
    }
    setIsSubmitting(true);
    
    // =================================================================
    // PENTING: Panggil Firebase Function Anda di sini
    // =================================================================
    // Contoh:
    // const setAdminRole = httpsCallable(functions, 'setAdminRole');
    // try {
    //   await setAdminRole({ uid: targetUid });
    //   toast({ title: "Sukses!", description: `Pengguna ${targetUid} telah menjadi admin.` });
    //   setTargetUid("");
    // } catch (error) {
    //   console.error("Error setting admin role:", error);
    //   toast({ title: "Gagal", description: "Tidak dapat mengatur hak akses admin.", variant: "destructive" });
    // }
    // =================================================================
    
    // Simulasi pemanggilan fungsi backend
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    console.log(`(Simulasi) Menjadikan UID: ${targetUid} sebagai admin.`);
    toast({
        title: "Fitur Backend Diperlukan",
        description: "UI telah siap. Anda perlu membuat Firebase Function 'setAdminRole' untuk membuat fitur ini bekerja.",
    });

    setIsSubmitting(false);
  };

  if (isAdmin === null) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
      <div className="flex items-center">
        <h1 className="text-lg font-semibold md:text-2xl font-headline flex items-center gap-2">
          <Shield className="h-6 w-6" />
          Admin Dashboard
        </h1>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><UserPlus /> Manajemen Admin</CardTitle>
                <CardDescription>Berikan hak akses admin kepada pengguna lain.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <Label htmlFor="uid">User ID (UID)</Label>
                    <Input 
                        id="uid" 
                        placeholder="Masukkan UID pengguna" 
                        value={targetUid}
                        onChange={(e) => setTargetUid(e.target.value)}
                    />
                </div>
                <Button onClick={handleMakeAdmin} disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                    Jadikan Admin
                </Button>
            </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Ban /> Manajemen User</CardTitle>
                <CardDescription>Fitur untuk ban user akan tersedia di sini.</CardDescription>
            </CardHeader>
            <CardContent>
                <Button disabled>Ban User (Segera Hadir)</Button>
            </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Wrench /> Mode Maintenance</CardTitle>
                <CardDescription>Aktifkan mode maintenance untuk website.</CardDescription>
            </CardHeader>
            <CardContent>
                <Button disabled>Atur Maintenance (Segera Hadir)</Button>
            </CardContent>
        </Card>
      </div>
    </main>
  );
}
