
"use client";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc, getDoc } from 'firebase/firestore';
import { CalculatorForm } from "@/components/calculator/CalculatorForm";
import { Loader2, ServerCrash } from "lucide-react";
import type { Calculation } from "@/components/dashboard/CalculationHistory";
import { useParams } from "next/navigation";
import { useState, useEffect } from "react";


export default function EditCalculatorPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const params = useParams();
  const id = params.id as string;

  // State to hold the owner's ID, especially for admins
  const [ownerId, setOwnerId] = useState<string | null>(null);

  const userDocRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'users', user.uid);
  }, [user, firestore]);
  const { data: userProfile } = useDoc(userDocRef);

  useEffect(() => {
    if (userProfile?.isAdmin) {
      const getOwner = async () => {
        if (!firestore || !id || !user) return;
        try {
          const publicDocRef = doc(firestore, 'public_calculations', id);
          const publicDoc = await getDoc(publicDocRef);
          if (publicDoc.exists() && publicDoc.data()?.userId) {
            setOwnerId(publicDoc.data()?.userId);
          } else {
            // Fallback: Check if it's the admin's own calculation
            const adminCalcRef = doc(firestore, 'users', user.uid, 'calculations', id);
            const adminCalcDoc = await getDoc(adminCalcRef);
            if (adminCalcDoc.exists()) {
              setOwnerId(user.uid);
            } else {
              setOwnerId(null); // Or handle 'not found' case
            }
          }
        } catch (e) {
            // If any error, assume it is admin's own calc for now
            setOwnerId(user.uid);
        }
      };
      getOwner();
    } else if (user) {
      setOwnerId(user.uid);
    }
  }, [userProfile, user, firestore, id]);


  const calcDocRef = useMemoFirebase(() => {
    if (!ownerId || !firestore || !id) return null;
    return doc(firestore, 'users', ownerId, 'calculations', id);
  }, [ownerId, firestore, id]);

  const { data: calculation, isLoading, error } = useDoc<Calculation>(calcDocRef);

  const isDataLoading = isLoading || !ownerId;

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
                <p className="text-muted-foreground">Gagal memuat data perhitungan. Mungkin Anda tidak punya akses.</p>
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

    