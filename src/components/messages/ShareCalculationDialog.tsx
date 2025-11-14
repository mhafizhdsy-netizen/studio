
"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useAuth } from "@/supabase/auth-provider";
import { supabase } from "@/lib/supabase";
import { Loader2, Package } from "lucide-react";
import { Input } from "../ui/input";
import { ScrollArea } from "../ui/scroll-area";
import type { Calculation } from "../dashboard/CalculationHistory";
import Image from "next/image";
import { formatCurrency } from "@/lib/utils";

interface ShareCalculationDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    onShare: (calculation: Calculation) => void;
}

export function ShareCalculationDialog({ isOpen, onOpenChange, onShare }: ShareCalculationDialogProps) {
    const { user } = useAuth();
    const [searchTerm, setSearchTerm] = useState("");
    const [calculations, setCalculations] = useState<Calculation[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!isOpen || !user) return;

        const fetchCalculations = async () => {
            setIsLoading(true);
            const { data, error } = await supabase
                .from('calculations')
                .select('*')
                .eq('userId', user.id)
                .order('createdAt', { ascending: false });

            if (data) {
                setCalculations(data);
            }
            if (error) {
                console.error("Error fetching calculations for sharing:", error);
            }
            setIsLoading(false);
        };
        fetchCalculations();
    }, [isOpen, user]);

    const filteredCalculations = calculations?.filter(calc => 
        calc.productName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSelect = (calc: Calculation) => {
        onShare(calc);
        onOpenChange(false);
        setSearchTerm("");
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Bagikan Perhitungan</DialogTitle>
                    <DialogDescription>Pilih perhitungan HPP yang ingin Anda bagikan dalam chat.</DialogDescription>
                </DialogHeader>
                <div className="py-2">
                    <Input 
                        placeholder="Cari perhitungan berdasarkan nama produk..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <ScrollArea className="h-72">
                    <div className="pr-4 space-y-2">
                        {isLoading ? (
                            <div className="flex items-center justify-center h-full py-8">
                                <Loader2 className="h-6 w-6 animate-spin text-primary"/>
                            </div>
                        ) : (
                            filteredCalculations?.map(calc => (
                                <div key={calc.id}
                                    onClick={() => handleSelect(calc)}
                                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer border"
                                >
                                    {calc.productImageUrl ? (
                                        <Image src={calc.productImageUrl} alt={calc.productName} width={48} height={48} className="rounded-md aspect-square object-cover" />
                                    ) : (
                                        <div className="h-12 w-12 bg-muted rounded-md flex items-center justify-center">
                                            <Package className="h-6 w-6 text-muted-foreground" />
                                        </div>
                                    )}
                                    <div className="truncate flex-1">
                                        <p className="font-semibold truncate">{calc.productName}</p>
                                        <p className="text-sm text-muted-foreground truncate">{formatCurrency(calc.suggestedPrice)}</p>
                                    </div>
                                </div>
                            ))
                        )}
                         {filteredCalculations?.length === 0 && !isLoading && (
                            <p className="text-center text-sm text-muted-foreground py-8">Perhitungan tidak ditemukan.</p>
                         )}
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    )
}
