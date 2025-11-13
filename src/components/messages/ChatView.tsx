
"use client";

import { doc } from 'firebase/firestore';
import { cn, formatCurrency } from "@/lib/utils";
import { useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import type { Calculation } from "../dashboard/CalculationHistory";
import { Loader2, Calculator, Info } from "lucide-react";
import Image from "next/image";
import type { Timestamp } from 'firebase/firestore';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';

export interface Message {
    id: string;
    senderId: string;
    type: 'text' | 'image' | 'calculation' | 'system';
    text?: string;
    mediaUrl?: string;
    mediaName?: string;
    calculationId?: string;
    createdAt: Timestamp;
}

export function ChatMessage({ message, isMe }: { message: Message, isMe: boolean }) {
    
    const renderContent = () => {
        switch(message.type) {
            case 'text':
                return <p className="text-sm whitespace-pre-wrap">{message.text}</p>;
            case 'image':
                return (
                    <a href={message.mediaUrl} target="_blank" rel="noopener noreferrer">
                        <Image src={message.mediaUrl!} alt={message.mediaName || 'Gambar'} width={256} height={256} className="rounded-lg max-w-xs object-cover" />
                    </a>
                );
            case 'calculation':
                return <SharedCalculationCard calculationId={message.calculationId!} />;
            case 'system':
                return (
                    <Alert className="bg-background/80 border-none">
                        <Info className="h-4 w-4" />
                        <AlertDescription>
                            {message.text}
                        </AlertDescription>
                    </Alert>
                );
            default:
                return null;
        }
    }
    
    if (message.type === 'system') {
        return (
             <div className="text-center text-xs text-muted-foreground my-2">
                {message.text}
            </div>
        )
    }

    return (
        <div className={cn("flex items-end gap-2", isMe ? "justify-end" : "justify-start")}>
            <div className={cn(
                "p-3 rounded-lg max-w-sm md:max-w-md", 
                isMe ? "bg-primary text-primary-foreground" : "bg-muted"
            )}>
                {renderContent()}
            </div>
        </div>
    )
}

function SharedCalculationCard({ calculationId }: { calculationId: string }) {
    const firestore = useFirestore();
    
    const calcDocRef = useMemoFirebase(() => {
        if (!firestore || !calculationId) return null;
        // Public calculations are readable by anyone.
        return doc(firestore, 'public_calculations', calculationId);
    }, [firestore, calculationId]);

    const { data: calculation, isLoading } = useDoc<Calculation>(calcDocRef);
    
    if (isLoading) {
        return <div className="flex items-center gap-2 p-2 rounded-lg bg-background/50 text-foreground"><Loader2 className="h-4 w-4 animate-spin"/> <p className="text-sm">Memuat perhitungan...</p></div>
    }

    if (!calculation) {
        return <div className="flex items-center gap-2 p-2 rounded-lg bg-background/50 text-destructive-foreground"><Calculator className="h-4 w-4"/> <p className="text-sm">Perhitungan tidak ditemukan atau tidak publik.</p></div>
    }

    return (
        <div className="p-3 rounded-lg bg-background/50 text-foreground w-64">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1"><Calculator className="h-3 w-3"/> Perhitungan Dibagikan</p>
            <p className="font-bold truncate mt-1">{calculation.productName}</p>
            <div className="text-xs mt-2 space-y-1">
                <div className="flex justify-between">
                    <span>Total HPP:</span>
                    <span className="font-semibold">{formatCurrency(calculation.totalHPP)}</span>
                </div>
                 <div className="flex justify-between">
                    <span>Harga Jual:</span>
                    <span className="font-semibold">{formatCurrency(calculation.suggestedPrice)}</span>
                </div>
            </div>
        </div>
    )
}
