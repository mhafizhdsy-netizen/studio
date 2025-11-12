"use client";

import { useState, useEffect } from "react";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy, Timestamp } from 'firebase/firestore';
import { Loader2, ServerCrash, Users } from "lucide-react";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
  } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "../ui/avatar";
import type { Calculation } from "../dashboard/CalculationHistory";

interface PublicCalculation extends Omit<Calculation, 'userId' | 'isPublic'> {
    userName: string;
}

export function PublicCalculationList() {
    const firestore = useFirestore();

    const publicCalculationsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'publicCalculations'), orderBy('createdAt', 'desc'));
    }, [firestore]);

    const { data: calculations, isLoading, error } = useCollection<PublicCalculation>(publicCalculationsQuery);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center text-center w-full h-full">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Lagi ngumpulin inspirasi...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center text-center w-full h-full">
        <ServerCrash className="h-12 w-12 text-destructive mb-4" />
        <p className="font-semibold text-lg">Oops, ada masalah!</p>
        <p className="text-muted-foreground">Gagal memuat data komunitas. Coba lagi nanti ya.</p>
      </div>
    );
  }

  if (calculations && calculations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center w-full h-full">
        <Users className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-2xl font-bold tracking-tight font-headline">
          Komunitas masih sepi nih.
        </h3>
        <p className="text-muted-foreground">
          Jadilah yang pertama berbagi inspirasi perhitunganmu!
        </p>
      </div>
    );
  }

  return (
    <div className="w-full grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {calculations && calculations.map((calc) => (
            <PublicCalculationCard key={calc.id} calculation={calc} />
        ))}
    </div>
  );
}

function PublicCalculationCard({ calculation }: { calculation: PublicCalculation }) {
    const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    
    return (
        <Card className="flex flex-col h-full bg-card/50 dark:bg-card/20">
            <CardHeader>
                <CardTitle className="font-headline text-lg truncate">{calculation.productName}</CardTitle>
                <div className="flex items-center gap-2 pt-1">
                    <Avatar className="h-6 w-6">
                        <AvatarFallback className='bg-primary/20 text-primary text-xs font-bold'>
                            {getInitials(calculation.userName)}
                        </AvatarFallback>
                    </Avatar>
                    <CardDescription>
                        oleh {calculation.userName}
                    </CardDescription>
                </div>
            </CardHeader>
            <CardContent className="flex-grow space-y-2">
                <div>
                    <p className="text-sm text-muted-foreground">Total HPP</p>
                    <p className="text-xl font-bold">{formatCurrency(calculation.totalHPP)}</p>
                </div>
                <div>
                    <p className="text-sm text-muted-foreground">Saran Harga Jual</p>
                    <p className="text-lg font-semibold text-primary">{formatCurrency(calculation.suggestedPrice)}</p>
                </div>
            </CardContent>
            <CardFooter>
                <Badge>Margin: {calculation.margin}%</Badge>
            </CardFooter>
        </Card>
    )
}
