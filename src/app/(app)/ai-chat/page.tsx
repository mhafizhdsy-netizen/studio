
"use client";

import { useState, useEffect, useRef } from "react";
import { useUser, useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking } from "@/firebase";
import { collection, query, orderBy, serverTimestamp, Timestamp } from 'firebase/firestore';
import { Button } from "@/components/ui/button";
import { Loader2, MessageSquareDashed, Bot, Sparkles } from "lucide-react";
import { AIChatInput } from "@/components/messages/AIChatInput";
import { AIChatMessage, type AIMessage, type MessagePart } from "@/components/messages/AIChatView";
import { ScrollArea } from "@/components/ui/scroll-area";
import { chatWithBusinessCoach, ChatInput as AIChatInputType } from "@/ai/flows/business-coach-flow";
import type { Calculation } from "@/components/dashboard/CalculationHistory";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const CONVERSATION_ID = "main_conversation"; // Using a single conversation per user for now

// Helper to convert Firestore Timestamps to plain objects recursively
const toPlainObject = (obj: any): any => {
  if (!obj) {
    return obj;
  }
  if (obj instanceof Timestamp) {
    return obj.toDate().toISOString();
  }
  if (Array.isArray(obj)) {
    return obj.map(toPlainObject);
  }
  if (typeof obj === 'object') {
    const newObj: { [key: string]: any } = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        newObj[key] = toPlainObject(obj[key]);
      }
    }
    return newObj;
  }
  return obj;
};

export default function AIChatPage() {
    const { user } = useUser();
    const firestore = useFirestore();
    const scrollAreaRef = useRef<HTMLDivElement | null>(null);
    const [isAiTyping, setIsAiTyping] = useState(false);

    // Path to the messages subcollection for the current user
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
    }, [messages]);

    const handleSendMessage = async (text?: string, imageUrl?: string, calculation?: Calculation) => {
        if (!user || !firestore) return;
        
        const messagesColRef = collection(firestore, 'users', user.uid, 'ai_conversations', CONVERSATION_ID, 'messages');

        const userContent: MessagePart[] = [];
        if (text) userContent.push({ text });
        if (imageUrl) userContent.push({ media: { url: imageUrl } });
        
        if (calculation) {
             const plainCalculation = toPlainObject(calculation);
             userContent.push({
                data: {
                    type: 'calculation',
                    ...plainCalculation,
                }
            });
        }
        
        // Add user message to Firestore
        const userMessageData = {
            role: 'user' as const,
            content: userContent,
            createdAt: serverTimestamp(),
        };
        addDocumentNonBlocking(messagesColRef, userMessageData);
        setIsAiTyping(true);

        try {
            // Ensure history is also plain objects before sending to server
            const history = (messages || []).map(m => toPlainObject(m));
            
            const currentUserMessage = {
                role: 'user' as const,
                content: userContent,
            };

             const aiInput: AIChatInputType = {
                history: [...history, currentUserMessage] as any,
            };

            const aiResponseText = await chatWithBusinessCoach(aiInput);

            // Add AI response to Firestore
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
    )
}
