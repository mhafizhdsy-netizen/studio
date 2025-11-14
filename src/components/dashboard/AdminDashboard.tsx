
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Shield, UserPlus } from "lucide-react";
import { getFunctions, httpsCallable } from "firebase/functions";

export function AdminDashboard() {
  const { toast } = useToast();
  const [targetUid, setTargetUid] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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

    try {
      const functions = getFunctions();
      const setAdminRole = httpsCallable(functions, 'setAdminRole');
      
      // PENTING: Pastikan Anda sudah mendeploy Firebase Function 'setAdminRole'
      // Jika belum, kode ini akan gagal.
      await setAdminRole({ uid: targetUid });

      toast({
        title: "Sukses!",
        description: `Pengguna ${targetUid} telah berhasil dijadikan admin.`,
      });
      setTargetUid("");
    } catch (error: any) {
      console.error("Error setting admin role:", error);
      toast({
        title: "Gagal Mengatur Admin",
        description: error.message || "Terjadi kesalahan. Pastikan Firebase Function 'setAdminRole' sudah ter-deploy dan UID benar.",
        variant: "destructive",
      });
    }

    setIsSubmitting(false);
  };

  return (
    <Card className="mb-6 border-accent/50 bg-accent/10">
      <CardHeader>
        <CardTitle className="font-headline flex items-center gap-2 text-accent">
          <Shield />
          Panel Admin
        </CardTitle>
        <CardDescription>
          Kelola hak akses pengguna dari sini.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="p-4 rounded-lg border bg-background/50">
          <h3 className="font-semibold flex items-center gap-2"><UserPlus /> Manajemen Admin</h3>
          <p className="text-sm text-muted-foreground mt-1 mb-4">Berikan hak akses admin kepada pengguna lain dengan memasukkan User ID (UID) mereka.</p>
          <div className="flex items-end gap-2">
            <div className="flex-grow">
              <Label htmlFor="uid" className="sr-only">User ID (UID)</Label>
              <Input
                id="uid"
                placeholder="Masukkan UID pengguna"
                value={targetUid}
                onChange={(e) => setTargetUid(e.target.value)}
              />
            </div>
            <Button onClick={handleMakeAdmin} disabled={isSubmitting} variant="accent">
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Jadikan Admin
            </Button>
          </div>
           <p className="text-xs text-muted-foreground mt-2">Anda dapat menemukan UID pengguna di konsol Firebase Authentication.</p>
        </div>
      </CardContent>
    </Card>
  );
}
