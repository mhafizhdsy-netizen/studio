"use client";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from 'firebase/firestore';
import { CalculatorForm } from "@/components/calculator/CalculatorForm";
import { Loader2, ServerCrash } from "lucide-react";
import type { Calculation } from "@/components/dashboard/CalculationHistory";
import { useParams } from "next/navigation";

export default function EditCalculatorPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const params = useParams();
  const id = params.id as string;

  // --- Revised Data Fetching Logic ---

  // 1. First, try to fetch from public_calculations. This document contains the owner's userId.
  const publicCalcDocRef = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return doc(firestore, 'public_calculations', id);
  }, [firestore, id]);
  
  const { data: publicCalculation, isLoading: isLoadingPublic } = useDoc<Calculation>(publicCalcDocRef);

  // 2. Determine the ownerId. 
  //    - If public data exists, use its userId.
  //    - If not, assume the current user is the owner (covers both non-admin editing their own, and admin editing a non-public calc which we assume is their own).
  const ownerId = publicCalculation?.userId || user?.uid;

  // 3. Now, create the definitive reference to the user's private calculation document.
  //    This will only run when `ownerId` is valid.
  const calcDocRef = useMemoFirebase(() => {
    if (!ownerId || !firestore || !id) return null;
    return doc(firestore, 'users', ownerId, 'calculations', id);
  }, [ownerId, firestore, id]);

  const { data: calculation, isLoading: isLoadingPrivate, error } = useDoc<Calculation>(calcDocRef);
  
  // The final loading state depends on when we expect to have the data.
  // If we are still trying to figure out the owner, we are loading.
  const isDataLoading = isLoadingPublic || isLoadingPrivate;

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
