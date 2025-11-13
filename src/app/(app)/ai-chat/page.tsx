
"use client";

import { useState, useEffect, useRef } from "react";
import { useUser, useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase";
import { collection, query, orderBy, serverTimestamp, Timestamp, getDocs } from 'firebase/firestore';
import { Button } from "@/components/ui/button";
import { Loader2, MessageSquareDashed, Bot, Sparkles, Trash2 } from "lucide-react";
import { AIChatInput } from "@/components/messages/AIChatInput";
import { AIChatMessage, type AIMessage, type MessagePart } from "@/components/messages/AIChatView";
import { ScrollArea } from "@/components/ui/scroll-area";
import { chatWithBusinessCoach, ChatInput as AIChatInputType } from "@/ai/flows/business-coach-flow";
import type { Calculation } from "@/components/dashboard/CalculationHistory";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

const CONVERSATION_ID = "main_conversation";

// Helper to convert Firestore Timestamps to plain objects recursively
const toPlainObject = (obj: any): any => {
    if (!obj) return obj;
    if (obj instanceof Timestamp) {
        return obj.toDate().toISOString();
    }
    if (Array.isArray(obj)) {
        return obj.map(item => toPlainObject(item));
    }
    if (typeof obj === 'object') {
        const plainObj: { [key: string]: any } = {};
        for (const key of Object.keys(obj)) {
            plainObj[key] = toPlainObject(obj[key]);
        }
        return plainObj;
    }
    return obj;
};


export default function AIChatPage() {
    const { user } = useUser();
    const firestore = useFirestore();
    const scrollAreaRef = useRef<HTMLDivElement | null>(null);
    const [isAiTyping, setIsAiTyping] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const { toast } = useToast();

    const messagesQuery = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return query(
            collection(firestore, 'users', user.uid, 'ai_conversations', CONVERSATION_ID, 'messages'),
            orderBy('createdAt', 'asc')
        );
    }, [user, firestore]);

    const { data: messages, isLoading } = useCollection<AIMessage>(messagesQuery);
    
    useEffect(() => {
        if (scrollAreaRef.current) {
            scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
        }
    }, [messages, isAiTyping]);

    const handleSendMessage = async (text?: string, imageUrl?: string, calculation?: Calculation) => {
        if (!user || !firestore) return;
        
        const messagesColRef = collection(firestore, 'users', user.uid, 'ai_conversations', CONVERSATION_ID, 'messages');

        const userContent: MessagePart[] = [];
        if (text) userContent.push({ text });
        if (imageUrl) userContent.push({ media: { url: imageUrl } });
        if (calculation) {
             userContent.push({
                data: {
                    type: 'calculation',
                    ...toPlainObject(calculation),
                }
            });
        }
        
        const userMessageData = {
            role: 'user' as const,
            content: userContent,
            createdAt: serverTimestamp(),
        };
        addDocumentNonBlocking(messagesColRef, userMessageData);
        setIsAiTyping(true);

        try {
            // Build a clean history for the AI, ensuring all parts are valid.
            const historyForAI = (messages || [])
                 // Filter out any potentially invalid messages
                .filter(msg => msg && Array.isArray(msg.content))
                .map(msg => toPlainObject(msg));

            const currentUserMessageForAI = {
                role: 'user' as const,
                content: userContent,
            };

             const aiInput: AIChatInputType = {
                history: [...historyForAI, currentUserMessageForAI],
            };

            const aiResponseText = await chatWithBusinessCoach(aiInput);

            const aiMessageData = {
                role: 'model' as const,
                content: [{ text: aiResponseText }],
                createdAt: serverTimestamp(),
            };
            addDocumentNonBlocking(messagesColRef, aiMessageData);

        } catch (error) {
            console.error("Error calling AI coach:", error);
            const errorMessage = {
                role: 'model' as const,
                content: [{ text: "Waduh, koneksi ke AI lagi ada gangguan. Coba tanya lagi beberapa saat ya." }],
                createdAt: serverTimestamp(),
            };
            addDocumentNonBlocking(messagesColRef, errorMessage);
        } finally {
            setIsAiTyping(false);
        }
    };

    const handleDeleteHistory = async () => {
        if (!user || !firestore) return;
        setIsDeleting(true);

        try {
            const messagesColRef = collection(firestore, 'users', user.uid, 'ai_conversations', CONVERSATION_ID, 'messages');
            const snapshot = await getDocs(messagesColRef);
            
            snapshot.forEach(doc => {
                deleteDocumentNonBlocking(doc.ref);
            });

            toast({
                title: "Sukses!",
                description: "Riwayat percakapan telah berhasil dihapus.",
            });

        } catch (error) {
            console.error("Error deleting chat history:", error);
            toast({
                title: "Gagal",
                description: "Gagal menghapus riwayat percakapan.",
                variant: "destructive",
            });
        } finally {
            setIsDeleting(false);
            setIsDeleteDialogOpen(false);
        }
    };
    
    return (
        <>
            <div className="flex-1 flex flex-col h-[calc(100vh-theme(height.14)-1px)]">
                <header className="p-4 border-b flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <Avatar>
                            <AvatarImage src="/logo-ai.png" />
                            <AvatarFallback><Bot /></AvatarFallback>
                        </Avatar>
                        <div>
                            <h3 className="font-semibold text-lg flex items-center gap-2">
                                Teman Bisnis AI 
                                <Sparkles className="h-4 w-4 text-primary"/>
                            </h3>
                            <p className="text-sm text-muted-foreground">
                                {isAiTyping ? 'Lagi ngetik...' : 'Online'}
                            </p>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setIsDeleteDialogOpen(true)} disabled={!messages || messages.length === 0}>
                        <Trash2 className="h-5 w-5" />
                    </Button>
                </header>
                <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
                    <div className="space-y-6 pr-4">
                        {isLoading ? (
                            <div className="flex justify-center items-center h-full pt-10">
                                <Loader2 className="h-8 w-8 animate-spin text-primary"/>
                            </div>
                        ) : messages?.length === 0 ? (
                        <div className="flex flex-col items-center justify-center text-center w-full h-full text-muted-foreground py-10">
                                <MessageSquareDashed className="h-12 w-12 mb-4" />
                                <h3 className="font-bold text-lg text-foreground">Mulai Percakapan</h3>
                                <p className="max-w-md mx-auto">Tanya apa aja soal bisnismu! Minta analisis HPP, feedback foto produk, atau strategi marketing. Aku siap bantu!</p>
                            </div>
                        ) : (
                            messages?.map(message => (
                                <AIChatMessage key={message.id} message={message} isUser={message.role === 'user'} />
                            ))
                        )}
                        {isAiTyping && (
                            <div className="flex items-end gap-2 justify-start">
                                <Avatar className="h-9 w-9">
                                    <AvatarImage src="/logo-ai.png" />
                                    <AvatarFallback><Bot /></AvatarFallback>
                                </Avatar>
                                <div className="p-3 rounded-lg max-w-sm md:max-w-md bg-muted">
                                    <Loader2 className="h-5 w-5 animate-spin"/>
                                </div>
                            </div>
                        )}
                    </div>
                </ScrollArea>
                <footer className="p-4 border-t">
                    <AIChatInput onSendMessage={handleSendMessage} />
                </footer>
            </div>

            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Yakin mau hapus riwayat chat?</AlertDialogTitle>
                    <AlertDialogDescription>
                    Semua percakapanmu dengan Teman Bisnis AI akan dihapus permanen dan tidak bisa dikembalikan.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isDeleting}>Batal</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteHistory} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
                    {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Ya, Hapus
                    </AlertDialogAction>
                </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
