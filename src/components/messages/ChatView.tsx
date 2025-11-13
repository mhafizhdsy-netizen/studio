"use client";

import { useEffect, useRef } from "react";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy, Timestamp } from 'firebase/firestore';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, MessageSquare, Image as ImageIcon, Calculator } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { type Conversation } from "./ConversationList";
import { ChatInput } from "./ChatInput";
import { useDoc } from "@/firebase/firestore/use-doc";
import type { Calculation } from "../dashboard/CalculationHistory";
import Image from "next/image";

export interface Message {
    id: string;
    senderId: string;
    type: 'text' | 'image' | 'calculation';
    text?: string;
    mediaUrl?: string;
    mediaName?: string;
    calculationId?: string;
    createdAt: Timestamp;
}

interface ChatViewProps {
    conversation: Conversation | null;
}

export function ChatView({ conversation }: ChatViewProps) {
    const { user } = useUser();
    const firestore = useFirestore();
    const scrollAreaRef = useRef<HTMLDivElement>(null);

    const messagesQuery = useMemoFirebase(() => {
        if (!firestore || !conversation) return null;
        return query(
            collection(firestore, 'conversations', conversation.id, 'messages'),
            orderBy('createdAt', 'asc')
        );
    }, [firestore, conversation]);

    const { data: messages, isLoading } = useCollection<Message>(messagesQuery);
    
    useEffect(() => {
        // Auto-scroll to bottom
        if (scrollAreaRef.current) {
            scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight });
        }
    }, [messages]);


    if (!conversation) {
        return (
            <div className="flex-1 flex-col items-center justify-center h-full text-center hidden md:flex">
                <MessageSquare className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold">Pilih Percakapan</h3>
                <p className="text-muted-foreground">Pilih percakapan dari daftar untuk melihat pesan.</p>
            </div>
        );
    }
    
    if (!user) return null; // Should not happen if they can see convos
    
    const otherParticipant = conversation.participants[conversation.participantIds.find(p => p !== user.uid)!];
    const getInitials = (name: string) => (name || "A").split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase();

    return (
        <div className="flex-1 flex flex-col h-full">
            <header className="p-4 border-b flex items-center gap-3">
                <Avatar>
                    <AvatarImage src={otherParticipant?.photoURL} alt={otherParticipant?.name} />
                    <AvatarFallback>{getInitials(otherParticipant?.name)}</AvatarFallback>
                </Avatar>
                <div>
                    <h3 className="font-semibold text-lg">{otherParticipant?.name}</h3>
                </div>
            </header>
            <div className="flex-1 overflow-y-auto p-4">
                 <ScrollArea className="h-full" ref={scrollAreaRef}>
                    <div className="space-y-6 pr-4">
                        {isLoading ? (
                            <div className="flex justify-center items-center h-full">
                                <Loader2 className="h-8 w-8 animate-spin text-primary"/>
                            </div>
                        ) : (
                            messages?.map(message => (
                                <ChatMessage key={message.id} message={message} isMe={message.senderId === user.uid} />
                            ))
                        )}
                    </div>
                </ScrollArea>
            </div>
            <footer className="p-4 border-t">
                <ChatInput conversation={conversation} />
            </footer>
        </div>
    );
}

function ChatMessage({ message, isMe }: { message: Message, isMe: boolean }) {
    
    const renderContent = () => {
        switch(message.type) {
            case 'text':
                return <p className="text-sm whitespace-pre-wrap">{message.text}</p>;
            case 'image':
                return (
                    <a href={message.mediaUrl} target="_blank" rel="noopener noreferrer">
                        <Image src={message.mediaUrl!} alt={message.mediaName || 'Gambar'} width={256} height={256} className="rounded-lg max-w-xs object-cover" />
                    </a>
                )
            case 'calculation':
                return <SharedCalculationCard calculationId={message.calculationId!} />
            default:
                return null;
        }
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
        // Calculations are stored under the user who created them
        // We can't know the owner ID from here, so we fetch from public_calculations
        return doc(firestore, 'public_calculations', calculationId);
    }, [firestore, calculationId]);

    const { data: calculation, isLoading } = useDoc<Calculation>(calcDocRef);
    
    if (isLoading) {
        return <div className="flex items-center gap-2 p-2 rounded-lg bg-background/50 text-foreground"><Loader2 className="h-4 w-4 animate-spin"/> <p className="text-sm">Memuat perhitungan...</p></div>
    }

    if (!calculation) {
        return <div className="flex items-center gap-2 p-2 rounded-lg bg-background/50 text-destructive-foreground"><Calculator className="h-4 w-4"/> <p className="text-sm">Perhitungan tidak ditemukan.</p></div>
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

    