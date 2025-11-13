
"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, MessageSquareDashed, Bot, Sparkles, Trash2 } from "lucide-react";
import { AIChatInput } from "@/components/messages/AIChatInput";
import { AIChatMessage, type SimpleAIMessage } from "@/components/messages/AIChatView";
import { ScrollArea } from "@/components/ui/scroll-area";
import { chatWithBusinessCoach } from "@/ai/flows/business-coach-flow";
import type { ChatInput as AIChatInputType } from "@/ai/flows/business-coach-schemas";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";

export default function AIChatPage() {
    const scrollAreaRef = useRef<HTMLDivElement | null>(null);
    const [messages, setMessages] = useState<SimpleAIMessage[]>([]);
    const [isAiTyping, setIsAiTyping] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        // Scroll to the bottom whenever messages change
        if (scrollAreaRef.current) {
            scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
        }
    }, [messages, isAiTyping]);

    const handleSendMessage = async (text: string) => {
        if (!text.trim()) return;

        const userMessage: SimpleAIMessage = {
            id: `user-${Date.now()}`,
            role: 'user',
            content: text,
        };
        
        const newMessages = [...messages, userMessage];
        setMessages(newMessages);
        setIsAiTyping(true);

        try {
            // Prepare history for the AI, mapping to the new simplified schema
            const historyForAI = newMessages
                .map(msg => {
                    if (msg.content) { // Ensure content exists
                        return {
                            role: msg.role,
                            content: msg.content,
                        };
                    }
                    return undefined; // Return undefined for invalid messages
                })
                .filter(Boolean); // CRITICAL: Remove any undefined entries from the array

            const aiInput: AIChatInputType = {
                history: historyForAI as { role: 'user' | 'model'; content: string }[],
            };

            const aiResponseText = await chatWithBusinessCoach(aiInput);

            const aiMessage: SimpleAIMessage = {
                id: `model-${Date.now()}`,
                role: 'model',
                content: aiResponseText,
            };
            setMessages(prev => [...prev, aiMessage]);

        } catch (error) {
            console.error("Error calling AI coach:", error);
            const errorMessage: SimpleAIMessage = {
                id: `error-${Date.now()}`,
                role: 'model',
                content: "Waduh, koneksi ke AI lagi ada gangguan. Coba tanya lagi beberapa saat ya.",
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
    };
    
    return (
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
                <Button variant="ghost" size="icon" onClick={handleDeleteHistory} disabled={messages.length === 0}>
                    <Trash2 className="h-5 w-5" />
                </Button>
            </header>
            <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
                <div className="space-y-6 pr-4">
                    {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center text-center w-full h-full text-muted-foreground py-10">
                            <MessageSquareDashed className="h-12 w-12 mb-4" />
                            <h3 className="font-bold text-lg text-foreground">Mulai Percakapan</h3>
                            <p className="max-w-md mx-auto">Tanya apa aja soal bisnismu! Minta analisis, feedback, atau strategi marketing. Aku siap bantu!</p>
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
    )
}
