
"use client";

import { useState } from "react";
import { useUser, useFirestore, useCollection, useMemoFirebase, deleteDocumentNonBlocking } from "@/firebase";
import { collection, query, orderBy, doc, Timestamp } from 'firebase/firestore';
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
  materials: { name: string; cost: number; qty: number, unit?: string, description?: string, isTotalCost?: boolean }[];
  laborCost: number;
  overhead: number;
  packaging: number;
  totalHPP: number;
  suggestedPrice: number;
  margin: number;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
  userId: string;
  isPublic?: boolean;
  productQuantity: number;
  productionTips?: string;
  purchaseLink?: string;
}

export function CalculationHistory() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const calculationsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(collection(firestore, 'users', user.uid, 'calculations'), orderBy('createdAt', 'desc'));
  }, [user, firestore]);

  const { data: calculations, isLoading, error } = useCollection<Calculation>(calculationsQuery);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCalcId, setSelectedCalcId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const openDeleteDialog = (id: string) => {
    setSelectedCalcId(id);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!user || !selectedCalcId || !firestore) return;

    setIsDeleting(true);
    
    // Non-blocking deletion
    const userCalcRef = doc(firestore, 'users', user.uid, 'calculations', selectedCalcId);
    deleteDocumentNonBlocking(userCalcRef);

    const publicCalcRef = doc(firestore, 'public_calculations', selectedCalcId);
    deleteDocumentNonBlocking(publicCalcRef);
    
    toast({
      title: "Berhasil Dihapus",
      description: "Perhitunganmu sudah dihapus dari riwayat.",
    });

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

  if (calculations && calculations.length === 0) {
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
          {calculations && calculations.map((calc) => (
            <CalculationCard key={calc.id} calculation={calc} onDelete={openDeleteDialog} />
          ))}
        </div>
      </div>
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Yakin mau hapus perhitungan ini?</AlertDialogTitle>
            <AlertDialogDescription>
              Data yang sudah dihapus nggak bisa dikembalikan lagi lho. Ini juga akan menghapusnya dari halaman komunitas.
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

    