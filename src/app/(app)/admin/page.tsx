"use client";

import { useUser } from "@/firebase";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2, Shield, Ban, Wrench } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function AdminPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

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
        router.replace("/dashboard");
      }
    });
  }, [user, isUserLoading, router]);

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
      <div className="grid gap-4 md:grid-cols-2">
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
