"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { getCalculationById, Calculation } from "@/lib/firebase/firestore";
import { CalculatorForm } from "@/components/calculator/CalculatorForm";
import { Loader2, ServerCrash } from "lucide-react";

export default function EditCalculatorPage({ params }: { params: { id: string } }) {
  const { user } = useAuth();
  const [calculation, setCalculation] = useState<Calculation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user && params.id) {
      const fetchCalculation = async () => {
        setLoading(true);
        const { data, error } = await getCalculationById(user.uid, params.id);
        if (error) {
          setError("Gagal memuat data perhitungan.");
          console.error(error);
        } else {
          setCalculation(data);
        }
        setLoading(false);
      };
      fetchCalculation();
    }
  }, [user, params.id]);

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
      <div className="flex items-center">
        <h1 className="text-lg font-semibold md:text-2xl font-headline">Edit Perhitungan HPP</h1>
      </div>
      <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm p-4 lg:p-6">
        {loading ? (
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        ) : error ? (
            <div className="flex flex-col items-center justify-center text-center w-full h-full">
                <ServerCrash className="h-12 w-12 text-destructive mb-4" />
                <p className="font-semibold text-lg">Oops, ada masalah!</p>
                <p className="text-muted-foreground">{error}</p>
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
