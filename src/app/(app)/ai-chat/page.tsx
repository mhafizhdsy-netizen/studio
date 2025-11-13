
"use client";

import { useState, useEffect, useRef } from "react";
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

// Helper to convert Firestore Timestamps within a calculation object
const convertCalcTimestamps = (calc: any): any => {
    if (!calc) return null;
    const newCalc = { ...calc };
    if (newCalc.createdAt && typeof newCalc.createdAt.toDate === 'function') {
        newCalc.createdAt = newCalc.createdAt.toDate().toISOString();
    }
    if (newCalc.updatedAt && typeof newCalc.updatedAt.toDate === 'function') {
        newCalc.updatedAt = newCalc.updatedAt.toDate().toISOString();
    }
    // Also handle materials if they exist
    if (Array.isArray(newCalc.materials)) {
        newCalc.materials = newCalc.materials.map((mat: any) => ({ ...mat }));
    }
    return newCalc;
};


export default function AIChatPage() {
    const scrollAreaRef = useRef<HTMLDivElement | null>(null);
    const [messages, setMessages] = useState<AIMessage[]>([]);
    const [isAiTyping, setIsAiTyping] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        if (scrollAreaRef.current) {
            scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
        }
    }, [messages, isAiTyping]);

    const handleSendMessage = async (text?: string, imageUrl?: string, calculation?: Calculation) => {
        const userContent: MessagePart[] = [];
        if (text) userContent.push({ text });
        if (imageUrl) userContent.push({ media: { url: imageUrl } });
        if (calculation) {
             userContent.push({
                data: {
                    type: 'calculation',
                    ...calculation, // Pass the raw calculation object
                }
            });
        }
        
        const userMessage: AIMessage = {
            id: `user-${Date.now()}`,
            role: 'user',
            content: userContent,
        };
        
        const newMessages = [...messages, userMessage];
        setMessages(newMessages);
        setIsAiTyping(true);

        try {
            // Build a clean history for the AI.
            // This is the most critical part to fix the recurring error.
            const historyForAI = newMessages
                .filter(msg => msg && msg.content && msg.content.length > 0) // Ensure message and content are valid
                .map(msg => ({
                    role: msg.role,
                    content: msg.content.map(part => {
                        // Securely create parts, ensuring no undefined data
                        const newPart: any = {};
                        if (part.text) {
                            newPart.text = part.text;
                        }
                        if (part.media) {
                            newPart.media = part.media;
                        }
                        // For calculations, ensure timestamps are converted.
                        if (part.data?.type === 'calculation') {
                            newPart.data = convertCalcTimestamps(part.data);
                        } else if (part.data) {
                            newPart.data = part.data; // Keep other data as is
                        }
                        return newPart;
                    }).filter(p => Object.keys(p).length > 0) // Filter out any empty parts that might have been created
                }));


             const aiInput: AIChatInputType = {
                history: historyForAI as any, // Cast to any to match Zod schema on the server
            };

            const aiResponseText = await chatWithBusinessCoach(aiInput);

            const aiMessage: AIMessage = {
                id: `model-${Date.now()}`,
                role: 'model',
                content: [{ text: aiResponseText }],
            };
            setMessages(prev => [...prev, aiMessage]);

        } catch (error) {
            console.error("Error calling AI coach:", error);
            const errorMessage: AIMessage = {
                id: `error-${Date.now()}`,
                role: 'model',
                content: [{ text: "Waduh, koneksi ke AI lagi ada gangguan. Coba tanya lagi beberapa saat ya." }],
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsAiTyping(false);
        }
    };

    const handleDeleteHistory = () => {
        setMessages([]);
        toast({
            title: "Sukses!",
            description: "Riwayat percakapan sesi ini telah berhasil dihapus.",
        });
        setIsDeleteDialogOpen(false);
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
                    <Button variant="ghost" size="icon" onClick={() => setIsDeleteDialogOpen(true)} disabled={messages.length === 0}>
                        <Trash2 className="h-5 w-5" />
                    </Button>
                </header>
                <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
                    <div className="space-y-6 pr-4">
                        {messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center text-center w-full h-full text-muted-foreground py-10">
                                <MessageSquareDashed className="h-12 w-12 mb-4" />
                                <h3 className="font-bold text-lg text-foreground">Mulai Percakapan</h3>
                                <p className="max-w-md mx-auto">Tanya apa aja soal bisnismu! Minta analisis HPP, feedback foto produk, atau strategi marketing. Aku siap bantu!</p>
                            </div>
                        ) : (
                            messages.map(message => (
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
                    Semua percakapanmu di sesi ini akan dihapus permanen dan tidak bisa dikembalikan.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Batal</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteHistory} className="bg-destructive hover:bg-destructive/90">
                    Ya, Hapus
                    </AlertDialogAction>
                </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
