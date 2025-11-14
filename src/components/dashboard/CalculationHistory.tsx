"use client";

import { useState, useEffect } from "react";
import { useUser } from "@/firebase";
import { supabase } from "@/lib/supabase";
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

export interface Calculation {
  id: string;
  productName: string;
  productImageUrl?: string;
  productDescription?: string;
  materials: { name: string; cost: number; qty: number, unit?: string, description?: string, isTotalCost?: boolean, purchaseLink?: string }[];
  laborCost: number;
  overhead: number;
  packaging: number;
  totalHPP: number;
  suggestedPrice: number;
  margin: number;
  createdAt: string; // Changed from Timestamp
  updatedAt?: string;
  userId: string;
  isPublic?: boolean;
  productQuantity: number;
  productionTips?: string;
  // Fields from PublicCalculation that might be merged in some contexts
  userName?: string;
  userPhotoURL?: string;
}

export function CalculationHistory() {
  const { user } = useUser();
  const { toast } = useToast();
  const [calculations, setCalculations] = useState<Calculation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCalcId, setSelectedCalcId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchCalculations = async () => {
      if (!user || !supabase) return;

      setIsLoading(true);
      setError(null);

      try {
        const { data, error } = await supabase
          .from('calculations')
          .select('*')
          .eq('userId', user.uid)
          .order('createdAt', { ascending: false });

        if (error) throw error;
        setCalculations(data || []);
      } catch (e: any) {
        setError(e);
        console.error("Error fetching calculations:", e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCalculations();
  }, [user]);

  const openDeleteDialog = (id: string) => {
    setSelectedCalcId(id);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!user || !selectedCalcId || !supabase) return;

    setIsDeleting(true);
    
    // In Supabase, we would typically rely on RLS and cascade deletes,
    // but for explicit deletion from both tables:
    try {
      // First, delete from public_calculations if it exists
      await supabase.from('public_calculations').delete().eq('id', selectedCalcId);
      
      // Then, delete from the user's private calculations
      const { error } = await supabase.from('calculations').delete().eq('id', selectedCalcId);

      if (error) throw error;

      setCalculations(prev => prev.filter(c => c.id !== selectedCalcId));
      
      toast({
        title: "Berhasil Dihapus",
        description: "Perhitunganmu sudah dihapus.",
      });

    } catch (e) {
        console.error("Deletion failed:", e);
        toast({
            title: "Gagal Menghapus",
            description: "Terjadi kesalahan saat menghapus perhitungan.",
            variant: "destructive",
        });
    }

    setIsDeleting(false);
    setIsDeleteDialogOpen(false);
    setSelectedCalcId(null);
  };

  if (isLoading) {
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
        <p className="text-muted-foreground">Gagal memuat riwayat perhitungan. Coba lagi nanti ya.</p>
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
              Data yang sudah dihapus nggak bisa dikembalikan lagi lho. Ini juga akan menghapusnya dari halaman komunitas jika pernah dibagikan.
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
