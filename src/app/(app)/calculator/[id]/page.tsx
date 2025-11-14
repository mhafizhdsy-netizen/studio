"use client";
import { useFirestore, useDoc, useMemoFirebase, useUser } from "@/firebase";
import { doc } from 'firebase/firestore';
import { CalculatorForm } from "@/components/calculator/CalculatorForm";
import { Loader2, ServerCrash } from "lucide-react";
import type { Calculation } from "@/components/dashboard/CalculationHistory";

interface EditPageParams {
    params: { id: string };
}

export default function EditCalculatorPageForUser({ params }: EditPageParams) {
  const { id } = params;
  const { user } = useUser();
  const firestore = useFirestore();
  
  // This hook now safely depends on `user` and `id`, ensuring it only runs when both are available.
  const calcDocRef = useMemoFirebase(() => {
    if (!firestore || !user || !id) return null;
    // The path is now simple and correct for the user's own calculations.
    return doc(firestore, 'users', user.uid, 'calculations', id);
  }, [firestore, user, id]);

  const { data: calculation, isLoading: isDataLoading, error } = useDoc<Calculation>(calcDocRef);

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
      <div className="flex items-center">
        <h1 className="text-lg font-semibold md:text-2xl font-headline">Edit Perhitungan HPP</h1>
      </div>
      <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm p-4 lg:p-6">
        {isDataLoading ? (
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        ) : error ? (
            <div className="flex flex-col items-center justify-center text-center w-full h-full">
                <ServerCrash className="h-12 w-12 text-destructive mb-4" />
                <p className="font-semibold text-lg">Oops, ada masalah!</p>
                <p className="text-muted-foreground">Gagal memuat data perhitungan. Mungkin Anda tidak punya akses atau data tidak ada.</p>
            </div>
        ) : calculation ? (
          <CalculatorForm existingCalculation={calculation} />
        ) : (
          <p>Perhitungan tidak ditemukan.</p>
        )}
      </div>
    </main>
  );
}
