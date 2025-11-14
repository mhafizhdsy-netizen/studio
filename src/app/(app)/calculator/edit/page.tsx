"use client";
import { useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from 'firebase/firestore';
import { CalculatorForm } from "@/components/calculator/CalculatorForm";
import { Loader2, ServerCrash } from "lucide-react";
import type { Calculation } from "@/components/dashboard/CalculationHistory";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function EditCalculatorContent() {
  const firestore = useFirestore();
  const searchParams = useSearchParams();
  const fullPath = searchParams.get('path');

  const calcDocRef = useMemoFirebase(() => {
    if (!firestore || !fullPath) return null;
    // The full path is provided directly from the query parameter
    return doc(firestore, fullPath);
  }, [firestore, fullPath]);

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


export default function EditCalculatorPage() {
    return (
        <Suspense fallback={<div className="flex h-screen items-center justify-center"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>}>
            <EditCalculatorContent />
        </Suspense>
    )
}