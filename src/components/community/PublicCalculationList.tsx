
"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useQuery } from "@tanstack/react-query";
import { Loader2, ServerCrash, Users, Package, Pin } from "lucide-react";
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
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import type { Calculation } from "../dashboard/CalculationHistory";
import { PublicCalculationDetailDialog } from "./PublicCalculationDetailDialog";
import Image from "next/image";

// PublicCalculation now includes the full breakdown
export interface PublicCalculation extends Calculation {
    userName: string;
    userPhotoURL?: string;
    isFeatured?: boolean;
    userIsAdmin?: boolean; // Added to pass admin status to dialog
}

const fetchPublicCalculations = async () => {
    const { data, error } = await supabase.from('public_calculations').select('*').order('createdAt', { ascending: false });
    if (error) throw new Error(error.message);
    return data as PublicCalculation[];
}


export function PublicCalculationList() {
    const [selectedCalc, setSelectedCalc] = useState<PublicCalculation | null>(null);

    const { data: calculations, isLoading, error } = useQuery({
        queryKey: ['publicCalculations'],
        queryFn: fetchPublicCalculations,
    });


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
    <>
        <div className="w-full grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {calculations && calculations.map((calc) => (
                <PublicCalculationCard key={calc.id} calculation={calc} onSelect={setSelectedCalc} />
            ))}
        </div>
        <PublicCalculationDetailDialog 
            calculation={selectedCalc}
            isOpen={!!selectedCalc}
            onOpenChange={(isOpen) => !isOpen && setSelectedCalc(null)}
        />
    </>
  );
}

function PublicCalculationCard({ calculation, onSelect }: { calculation: PublicCalculation, onSelect: (calc: PublicCalculation) => void }) {
    const getInitials = (name: string) => (name || 'A').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    
    return (
        <Card 
            className="flex flex-col h-full bg-card/50 dark:bg-card/20 hover:border-primary transition-all duration-200 cursor-pointer overflow-hidden group"
            onClick={() => onSelect(calculation)}
        >
             <div className="relative aspect-video w-full bg-muted overflow-hidden">
                {calculation.productImageUrl ? (
                    <Image src={calculation.productImageUrl} alt={calculation.productName} layout="fill" className="object-cover group-hover:scale-105 transition-transform duration-300" />
                ) : (
                    <div className="flex items-center justify-center h-full">
                        <Package className="h-12 w-12 text-muted-foreground" />
                    </div>
                )}
                {calculation.isFeatured && (
                    <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1.5 shadow-lg">
                        <Pin className="h-4 w-4" />
                    </div>
                )}
            </div>
            <CardHeader>
                <CardTitle className="font-headline text-lg truncate">{calculation.productName}</CardTitle>
                <div className="flex items-center gap-2 pt-1">
                    <Avatar className="h-6 w-6">
                         <AvatarImage src={calculation.userPhotoURL} alt={calculation.userName} />
                        <AvatarFallback className='bg-primary/20 text-primary text-xs font-bold'>
                            {getInitials(calculation.userName)}
                        </AvatarFallback>
                    </Avatar>
                    <CardDescription>
                        oleh {calculation.userName || 'Anonim'}
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
