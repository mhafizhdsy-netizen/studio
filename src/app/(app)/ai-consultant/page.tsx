
'use client';

import { useState } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking } from '@/firebase';
import { collection, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { Bot, Loader2 } from 'lucide-react';
import { consultAI } from '@/ai/flows/consultant-flow';
import type { AIChatMessage } from '@/components/ai-consultant/AIChatView';
import { AIChatView } from '@/components/ai-consultant/AIChatView';
import { AIChatInput } from '@/components/ai-consultant/AIChatInput';

export default function AIConsultantPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [isResponding, setIsResponding] = useState(false);

  const historyQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(
      collection(firestore, 'users', user.uid, 'ai_consultant_history'),
      orderBy('createdAt', 'asc')
    );
  }, [user, firestore]);

  const { data: history, isLoading } = useCollection<AIChatMessage>(historyQuery);

  const handleSendMessage = async (text: string) => {
    if (!user || !firestore || !text.trim()) return;

    const userMessage: Omit<AIChatMessage, 'id'> = {
      role: 'user',
      content: text,
      createdAt: serverTimestamp(),
    };

    // Optimistically add user message to history
    const historyCollectionRef = collection(firestore, 'users', user.uid, 'ai_consultant_history');
    await addDocumentNonBlocking(historyCollectionRef, userMessage);
    
    setIsResponding(true);
    
    try {
      // Prepare history for AI
      const aiHistory = (history || []).map(h => ({
        role: h.role,
        content: [{ text: h.content }],
      }));

      // Add current user message to history for AI context
      aiHistory.push({ role: 'user', content: [{ text }] });
      
      const aiResponse = await consultAI({
          prompt: text,
          history: aiHistory,
      });

      const aiMessage: Omit<AIChatMessage, 'id'> = {
        role: 'model',
        content: aiResponse,
        createdAt: serverTimestamp(),
      };
      
      await addDocumentNonBlocking(historyCollectionRef, aiMessage);

    } catch (error) {
      console.error('Error consulting AI:', error);
      const errorMessage: Omit<AIChatMessage, 'id'> = {
        role: 'model',
        content: "Waduh, koneksi ke AI lagi ada gangguan. Coba tanya lagi beberapa saat ya.",
        createdAt: serverTimestamp(),
        isError: true,
      };
      await addDocumentNonBlocking(historyCollectionRef, errorMessage);
    } finally {
      setIsResponding(false);
    }
  };

  return (
    <main className="flex flex-1 flex-col h-full">
       <header className="p-4 border-b flex items-center justify-between bg-background/80 backdrop-blur-sm sticky top-0 md:top-14 z-10">
            <div className="flex items-center gap-3">
                <Bot className="h-6 w-6 text-primary"/>
                <h1 className="text-lg font-semibold md:text-xl font-headline">
                Konsultan AI
                </h1>
            </div>
        </header>
        <div className="flex-1 overflow-y-auto p-4">
            {isLoading ? (
                <div className="flex h-full items-center justify-center">
                    <Loader2 className="h-10 w-10 animate-spin text-primary"/>
                </div>
            ) : (
                <AIChatView history={history || []} isResponding={isResponding} />
            )}
        </div>
        <footer className="p-4 border-t">
            <AIChatInput onSendMessage={handleSendMessage} disabled={isResponding}/>
        </footer>
    </main>
  );
}
