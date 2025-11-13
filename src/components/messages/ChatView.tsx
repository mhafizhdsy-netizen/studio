
"use client";

import { cn, formatCurrency } from "@/lib/utils";
import { User, Calculator } from "lucide-react";
import Image from "next/image";
import type { Timestamp } from 'firebase/firestore';

export interface MessageContent {
    text: string | null;
    imageUrl: string | null;
    calculation: any | null; // Can be a Calculation object
}

export interface Message {
    id: string;
    senderId: string;
    content: MessageContent;
    createdAt: Timestamp;
}

interface ChatViewProps {
    messages: Message[];
    currentUser: User | null;
}

export function ChatView({ messages, currentUser }: ChatViewProps) {
    if (messages.length === 0) {
        return (
            <div className="text-center text-muted-foreground">
                <p>Kalian sudah terhubung. Mulai obrolan yuk!</p>
            </div>
        );
    }
    
    return (
        <div className="space-y-4">
            {messages.map(message => {
                const isUser = message.senderId === currentUser?.uid;
                return (
                    <div key={message.id} className={cn("flex items-end gap-2", isUser ? "justify-end" : "justify-start")}>
                        {!isUser && <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground"><User className="h-5 w-5"/></div>}
                        <div className={cn(
                            "p-3 rounded-lg max-w-sm md:max-w-md", 
                            isUser ? "bg-primary text-primary-foreground" : "bg-muted"
                        )}>
                            {message.content.text && <p>{message.content.text}</p>}
                            {message.content.imageUrl && (
                                <Image src={message.content.imageUrl} alt={'User upload'} width={200} height={200} className="rounded-lg mt-2"/>
                            )}
                            {message.content.calculation && <SharedCalculationCard calculation={message.content.calculation} />}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}


function SharedCalculationCard({ calculation }: { calculation: any }) {
    if (!calculation) {
        return <div className="flex items-center gap-2 p-2 rounded-lg bg-background/50 text-destructive-foreground"><Calculator className="h-4 w-4"/> <p className="text-sm">Data perhitungan tidak valid.</p></div>
    }

    return (
        <div className="p-3 rounded-lg bg-background/50 text-foreground w-64 mt-2">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1"><Calculator className="h-3 w-3"/> Perhitungan HPP Dibagikan</p>
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
