'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/firebase';
import { supabase } from '@/lib/supabase';
import { Bot, Loader2 } from 'lucide-react';
import { consultAI } from '@/ai/flows/consultant-flow';
import type { AIChatMessage } from '@/components/ai-consultant/AIChatView';
import { AIChatView } from '@/components/ai-consultant/AIChatView';
import { AIChatInput } from '@/components/ai-consultant/AIChatInput';

export default function AIConsultantPage() {
  const { user } = useUser();
  const [isResponding, setIsResponding] = useState(false);
  const [history, setHistory] = useState<AIChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!user || !supabase) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      const { data, error } = await supabase
        .from('ai_consultant_history')
        .select('*')
        .eq('userId', user.uid)
        .order('createdAt', { ascending: true });

      if (error) {
        console.error('Error fetching AI chat history:', error);
      } else {
        setHistory(data as AIChatMessage[]);
      }
      setIsLoading(false);
    };

    fetchHistory();
  }, [user]);

  const handleSendMessage = async (text: string) => {
    if (!user || !supabase || !text.trim()) return;

    const userMessage: Omit<AIChatMessage, 'id' | 'createdAt'> = {
      role: 'user',
      content: text,
      userId: user.uid,
    };
    
    // Optimistically update UI
    const tempUserMessage = { ...userMessage, id: 'temp-user', createdAt: new Date().toISOString() };
    setHistory(prev => [...prev, tempUserMessage]);
    setIsResponding(true);

    try {
      // 1. Save user message to DB
      const { error: userError } = await supabase.from('ai_consultant_history').insert(userMessage);
      if (userError) throw userError;

      // 2. Prepare history for AI by excluding the temp message and adding the new one
      const aiHistory = history.map(h => ({
        role: h.role as 'user' | 'model',
        content: [{ text: h.content }],
      }));
      aiHistory.push({ role: 'user', content: [{ text }] });
      
      // 3. Get AI response
      const aiResponse = await consultAI({
          prompt: text,
          history: aiHistory,
      });

      const aiMessage: Omit<AIChatMessage, 'id' | 'createdAt'> = {
        role: 'model',
        content: aiResponse,
        userId: user.uid,
      };

      // 4. Save AI message to DB
      const { data: newAiMessage, error: aiError } = await supabase
        .from('ai_consultant_history')
        .insert(aiMessage)
        .select()
        .single();
      if (aiError) throw aiError;
      
      // 5. Update UI by replacing temp message with real data
      setHistory(prev => [...prev.filter(m => m.id !== 'temp-user'), newAiMessage as AIChatMessage]);

    } catch (error) {
      console.error('Error in AI chat flow:', error);
      const errorMessage: Omit<AIChatMessage, 'id' | 'createdAt'> = {
        role: 'model',
        content: "Waduh, koneksi ke AI lagi ada gangguan. Coba tanya lagi beberapa saat ya.",
        isError: true,
        userId: user.uid,
      };
      // Save error message to DB
      const { data: newErrorMessage, error: dbError } = await supabase.from('ai_consultant_history').insert(errorMessage).select().single();
       if (dbError) {
         console.error("Could not save error message to DB", dbError);
         setHistory(prev => prev.filter(m => m.id !== 'temp-user'));
       } else if (newErrorMessage) {
         setHistory(prev => [...prev.filter(m => m.id !== 'temp-user'), newErrorMessage as AIChatMessage]);
       }
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
                <AIChatView history={history} isResponding={isResponding} />
            )}
        </div>
        <footer className="p-4 border-t">
            <AIChatInput onSendMessage={handleSendMessage} disabled={isResponding}/>
        </footer>
    </main>
  );
}
