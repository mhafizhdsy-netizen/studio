
"use client";

import { cn, formatCurrency } from "@/lib/utils";
import { User as AuthUser } from '@supabase/supabase-js';
import { User, Calculator, MessageSquareReply } from "lucide-react";
import Image from "next/image";
import { Button } from "../ui/button";

export interface MessageContent {
    text: string | null;
    imageUrl: string | null;
    calculation: any | null; // Can be a Calculation object
    replyTo?: {
        messageId: string;
        text: string;
        senderId: string;
    } | null;
}

export interface Message {
    id: string;
    senderId: string;
    content: MessageContent;
    createdAt: string;
}

interface ChatViewProps {
    messages: Message[];
    currentUser: AuthUser | null;
    onReply: (message: Message) => void;
}

export function ChatView({ messages, currentUser, onReply }: ChatViewProps) {
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
                const isUser = message.senderId === currentUser?.id;
                const otherParticipantName = 'Teman Ngobrol';

                return (
                    <div key={message.id} className={cn("flex items-end gap-2 group", isUser ? "justify-end" : "justify-start")}>
                        {!isUser && <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground"><User className="h-5 w-5"/></div>}
                        
                        <div className="flex items-center gap-2">
                             {isUser && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => onReply(message)}
                                >
                                    <MessageSquareReply className="h-4 w-4" />
                                </Button>
                            )}

                            <div className={cn(
                                "p-3 rounded-lg max-w-sm md:max-w-md", 
                                isUser ? "bg-primary text-primary-foreground" : "bg-muted"
                            )}>
                                {message.content.replyTo && (
                                    <div className="p-2 mb-2 border-l-2 border-background/50 bg-black/10 rounded-md">
                                        <p className="font-semibold text-xs opacity-80">
                                            Membalas {message.content.replyTo.senderId === currentUser?.id ? 'diri sendiri' : otherParticipantName}
                                        </p>
                                        <p className="text-sm opacity-80 truncate">{message.content.replyTo.text}</p>
                                    </div>
                                )}
                                {message.content.text && <p className="whitespace-pre-wrap">{message.content.text}</p>}
                                {message.content.imageUrl && (
                                    <Image src={message.content.imageUrl} alt={'User upload'} width={200} height={200} className="rounded-lg mt-2"/>
                                )}
                                {message.content.calculation && <SharedCalculationCard calculation={message.content.calculation} />}
                            </div>

                             {!isUser && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => onReply(message)}
                                >
                                    <MessageSquareReply className="h-4 w-4" />
                                </Button>
                            )}
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

    