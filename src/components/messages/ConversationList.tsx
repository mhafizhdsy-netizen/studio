"use client";

import { useState } from "react";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, UserPlus, Users } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';
import { StartConversationDialog } from "./StartConversationDialog";
import { type User } from "firebase/auth";

export interface ConversationParticipant {
    name: string;
    photoURL: string;
}

export interface Conversation {
    id: string;
    participantIds: string[];
    participants: Record<string, ConversationParticipant>;
    lastMessageText?: string;
    lastMessageTimestamp?: Timestamp;
}

interface ConversationListProps {
    onSelectConversation: (conversation: Conversation) => void;
    selectedConversationId?: string;
}

export function ConversationList({ onSelectConversation, selectedConversationId }: ConversationListProps) {
    const { user } = useUser();
    const firestore = useFirestore();
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const conversationsQuery = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return query(
            collection(firestore, 'conversations'),
            where('participantIds', 'array-contains', user.uid),
            orderBy('lastMessageTimestamp', 'desc')
        );
    }, [user, firestore]);

    const { data: conversations, isLoading, error } = useCollection<Conversation>(conversationsQuery);

    const getOtherParticipant = (conversation: Conversation, currentUser: User) => {
        const otherId = conversation.participantIds.find(pId => pId !== currentUser.uid);
        if (!otherId) return { name: "Unknown", photoURL: "" };
        return conversation.participants[otherId] || { name: "Unknown", photoURL: "" };
    }
    
    const getInitials = (name: string) => (name || "A").split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase();

    const formatDate = (timestamp: Timestamp | undefined) => {
        if (!timestamp) return '';
        return formatDistanceToNow(timestamp.toDate(), { addSuffix: true, locale: id });
    };

    return (
        <aside className="w-full md:w-80 lg:w-96 flex flex-col border-r h-full">
            <div className="p-4 border-b flex justify-between items-center">
                <h2 className="text-xl font-headline font-bold">Pesan</h2>
                <Button variant="ghost" size="icon" onClick={() => setIsDialogOpen(true)}>
                    <UserPlus className="h-5 w-5"/>
                </Button>
            </div>
            <ScrollArea className="flex-1">
                {isLoading && (
                     <div className="flex h-full items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                )}
                {error && <p className="p-4 text-sm text-destructive">Gagal memuat percakapan.</p>}
                
                {conversations && conversations.length > 0 && user && (
                    <div className="p-2 space-y-1">
                        {conversations.map(convo => {
                            const otherUser = getOtherParticipant(convo, user);
                            return (
                                <button
                                    key={convo.id}
                                    onClick={() => onSelectConversation(convo)}
                                    className={cn(
                                        "w-full text-left p-2 rounded-lg flex items-center gap-3 transition-colors",
                                        selectedConversationId === convo.id ? "bg-muted" : "hover:bg-muted/50"
                                    )}
                                >
                                    <Avatar>
                                        <AvatarImage src={otherUser.photoURL} alt={otherUser.name}/>
                                        <AvatarFallback>{getInitials(otherUser.name)}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 truncate">
                                        <div className="flex justify-between items-center">
                                            <p className="font-semibold truncate">{otherUser.name}</p>
                                            <p className="text-xs text-muted-foreground">{formatDate(convo.lastMessageTimestamp)}</p>
                                        </div>
                                        <p className="text-sm text-muted-foreground truncate">{convo.lastMessageText || '...'}</p>
                                    </div>
                                </button>
                            )
                        })}
                    </div>
                )}

                {conversations && conversations.length === 0 && !isLoading && (
                    <div className="flex flex-col items-center justify-center h-full text-center p-4">
                        <Users className="h-12 w-12 text-muted-foreground mb-4"/>
                        <p className="font-semibold">Belum Ada Pesan</p>
                        <p className="text-sm text-muted-foreground">Mulai percakapan baru dengan pengguna lain.</p>
                    </div>
                )}
            </ScrollArea>
             <StartConversationDialog 
                isOpen={isDialogOpen} 
                onOpenChange={setIsDialogOpen}
                onConversationStarted={onSelectConversation}
            />
        </aside>
    );
}

    