"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { getCalculations, deleteCalculation } from "@/lib/firebase/firestore";
import type { Calculation } from "@/lib/firebase/firestore";
import { CalculationCard } from "./CalculationCard";
import { Loader2, ServerCrash } from "lucide-react";
import { Button } from "../ui/button";
import Link from "next/link";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";


export function CalculationHistory() {
  const { user } = useAuth();
  const [calculations, setCalculations] = useState<Calculation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCalcId, setSelectedCalcId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      const unsubscribe = getCalculations(user.uid, (data, err) => {
        if (err) {
          setError("Gagal memuat riwayat perhitungan. Coba lagi nanti ya.");
          console.error(err);
        } else {
          setCalculations(data);
          setError(null);
        }
        setLoading(false);
      });
      return () => unsubscribe();
    }
  }, [user]);

  const openDeleteDialog = (id: string) => {
    setSelectedCalcId(id);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!user || !selectedCalcId) return;

    setIsDeleting(true);
    const { error } = await deleteCalculation(user.uid, selectedCalcId);
    
    if (error) {
      toast({
        title: "Gagal Menghapus",
        description: "Tidak bisa menghapus perhitungan. Coba lagi.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Berhasil Dihapus",
        description: "Perhitunganmu sudah dihapus dari riwayat.",
      });
    }

    setIsDeleting(false);
    setIsDeleteDialogOpen(false);
    setSelectedCalcId(null);
  };


  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center text-center w-full h-full">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Lagi ngambil data kamu...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center text-center w-full h-full">
        <ServerCrash className="h-12 w-12 text-destructive mb-4" />
        <p className="font-semibold text-lg">Oops, ada masalah!</p>
        <p className="text-muted-foreground">{error}</p>
      </div>
    );
  }

  if (calculations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center w-full h-full">
        <h3 className="text-2xl font-bold tracking-tight font-headline">
          Kamu belum punya perhitungan.
        </h3>
        <p className="text-muted-foreground">
          Yuk, mulai hitung HPP produk pertamamu!
        </p>
        <Button asChild className="mt-4 font-bold">
          <Link href="/calculator">Mulai Menghitung</Link>
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="w-full">
        <h2 className="text-xl font-bold font-headline mb-4">Riwayat Perhitungan</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {calculations.map((calc) => (
            <CalculationCard key={calc.id} calculation={calc} onDelete={openDeleteDialog} />
          ))}
        </div>
      </div>
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Yakin mau hapus perhitungan ini?</AlertDialogTitle>
            <AlertDialogDescription>
              Data yang sudah dihapus nggak bisa dikembalikan lagi lho.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Ya, Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
