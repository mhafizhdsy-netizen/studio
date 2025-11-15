
'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/supabase/auth-provider';
import { supabase } from '@/lib/supabase';
import { Bot, Loader2, ArrowDown } from 'lucide-react';
import { consultAI } from '@/ai/flows/consultant-flow';
import type { AIChatMessage } from '@/components/ai-consultant/AIChatView';
import { AIChatView } from '@/components/ai-consultant/AIChatView';
import { AIChatInput } from '@/components/ai-consultant/AIChatInput';
import { SymbolicLoader } from '@/components/ui/symbolic-loader';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function AIConsultantPage() {
  const { user } = useAuth();
  const [isResponding, setIsResponding] = useState(false);
  const [history, setHistory] = useState<AIChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showScrollFab, setShowScrollFab] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = (behavior: 'smooth' | 'auto' = 'smooth') => {
    endOfMessagesRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    const fetchHistory = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      const { data, error } = await supabase
        .from('ai_consultant_history')
        .select('*')
        .eq('userId', user.id)
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

  useEffect(() => {
    scrollToBottom('auto');
  }, [history, isResponding, isLoading]);

  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer) return;

    const handleScroll = () => {
        if (scrollContainer) {
            const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
            // Show FAB if user is scrolled up more than a certain threshold (e.g., 300px) from the bottom
            const isScrolledUp = scrollHeight - scrollTop > clientHeight + 300;
            setShowScrollFab(isScrolledUp);
        }
    };

    scrollContainer.addEventListener('scroll', handleScroll);
    handleScroll(); // Check on initial load/change

    return () => scrollContainer.removeEventListener('scroll', handleScroll);
  }, [isLoading, history]); // Re-attach listener if history or loading state changes

  const handleSendMessage = async (text: string) => {
    if (!user || !text.trim()) return;

    const userMessage: Omit<AIChatMessage, 'id' | 'createdAt'> = {
      role: 'user',
      content: text,
      userId: user.id,
    };
    
    const tempUserMessage = { ...userMessage, id: 'temp-user', createdAt: new Date().toISOString() };
    setHistory(prev => [...prev, tempUserMessage]);
    setIsResponding(true);

    try {
      await supabase.from('ai_consultant_history').insert(userMessage);

      const currentHistory = (await supabase.from('ai_consultant_history').select('*').eq('userId', user.id).order('createdAt', { ascending: true })).data || [];
      
      const aiHistory = currentHistory.map(h => ({
        role: h.role as 'user' | 'model',
        content: [{ text: h.content }],
      }));

      const aiResponse = await consultAI({
          prompt: text,
          history: aiHistory,
      });

      const aiMessage: Omit<AIChatMessage, 'id' | 'createdAt'> = {
        role: 'model',
        content: aiResponse,
        userId: user.id,
      };

      await supabase.from('ai_consultant_history').insert(aiMessage);
      
      const newHistory = await supabase.from('ai_consultant_history').select('*').eq('userId', user.id).order('createdAt', { ascending: true });
      if(newHistory.data) setHistory(newHistory.data);

    } catch (error) {
      console.error('Error in AI chat flow:', error);
      const errorMessage: Omit<AIChatMessage, 'id' | 'createdAt'> = {
        role: 'model',
        content: "Waduh, koneksi ke AI lagi ada gangguan. Coba tanya lagi beberapa saat ya.",
        isError: true,
        userId: user.id,
      };
      
      await supabase.from('ai_consultant_history').insert(errorMessage);
       
      const newHistory = await supabase.from('ai_consultant_history').select('*').eq('userId', user.id).order('createdAt', { ascending: true });
      if(newHistory.data) setHistory(newHistory.data);

    } finally {
      setIsResponding(false);
    }
  };

  return (
    <main className="flex flex-1 flex-col h-full relative">
       <header className="p-4 border-b flex items-center justify-between bg-background/80 backdrop-blur-sm sticky top-0 md:top-14 z-10 shrink-0">
            <div className="flex items-center gap-3">
                <Bot className="h-6 w-6 text-primary"/>
                <h1 className="text-lg font-semibold md:text-xl font-headline">
                Konsultan AI
                </h1>
            </div>
        </header>
        <div ref={scrollRef} className="flex-1 overflow-y-auto">
            <div className="p-4 flex flex-col justify-end min-h-full">
                {isLoading ? (
                    <div className="flex h-full items-center justify-center flex-1">
                        <SymbolicLoader />
                    </div>
                ) : (
                    <AIChatView history={history} isResponding={isResponding} />
                )}
                <div ref={endOfMessagesRef} />
            </div>
        </div>
        {!isLoading && (
            <footer className="p-4 border-t shrink-0 bg-background">
                <AIChatInput onSendMessage={handleSendMessage} disabled={isResponding}/>
            </footer>
        )}
        <Button
            size="icon"
            className={cn(
                "absolute bottom-24 right-4 rounded-full h-12 w-12 shadow-lg transition-opacity duration-300",
                showScrollFab ? "opacity-100" : "opacity-0 pointer-events-none"
            )}
            onClick={() => scrollToBottom()}
            aria-label="Scroll to bottom"
            >
            <ArrowDown className="h-6 w-6" />
        </Button>
    </main>
  );
}
