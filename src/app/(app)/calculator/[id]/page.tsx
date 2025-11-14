
'use client';

import { useParams } from 'next/navigation';
import { useAuth } from '@/supabase/auth-provider';
import { supabase } from '@/lib/supabase';
import { CalculatorForm } from '@/components/calculator/CalculatorForm';
import { Loader2, ServerCrash } from 'lucide-react';
import type { Calculation } from '@/components/dashboard/CalculationHistory';
import { useState, useEffect } from 'react';

export default function EditCalculatorPage() {
  const params = useParams();
  const id = params.id as string;
  const { user } = useAuth();
  const [calculation, setCalculation] = useState<Calculation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchCalculation = async () => {
        if (!user || !id) {
            setIsLoading(false);
            return;
        };

        setIsLoading(true);
        setError(null);

        try {
            const { data, error } = await supabase
                .from('calculations')
                .select('*')
                .eq('id', id)
                .eq('userId', user.id)
                .single();
            
            if (error) throw error;

            setCalculation(data);

        } catch (e: any) {
            console.error("Error fetching calculation for edit:", e);
            setError(e);
        } finally {
            setIsLoading(false);
        }
    }
    fetchCalculation();
  }, [id, user]);


  return (
    <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
      <div className="flex items-center">
        <h1 className="text-lg font-semibold md:text-2xl font-headline">
          Edit Perhitungan HPP
        </h1>
      </div>
      <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm p-4 lg:p-6">
        {isLoading ? (
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        ) : error ? (
          <div className="flex flex-col items-center justify-center text-center w-full h-full">
            <ServerCrash className="h-12 w-12 text-destructive mb-4" />
            <p className="font-semibold text-lg">Oops, ada masalah!</p>
            <p className="text-muted-foreground">
              Gagal memuat data perhitungan. Mungkin Anda tidak punya akses atau
              data tidak ada.
            </p>
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
