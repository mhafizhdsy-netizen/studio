
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/supabase/auth-provider";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Loader2, MessageSquare, Send, UsersRound, Search } from "lucide-react";
import { ChatInput } from "@/components/messages/ChatInput";
import { ChatView, type Message } from "@/components/messages/ChatView";
import type { Calculation } from "@/components/dashboard/CalculationHistory";
import { RealtimeChannel } from "@supabase/supabase-js";

interface ChatSession {
    id: string;
    status: 'pending' | 'active' | 'ended';
    participantIds: string[];
}

export default function AnonymousChatPage() {
    const { user } = useAuth();
    const [session, setSession] = useState<ChatSession | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isFinding, setIsFinding] = useState(false);
    const [notFound, setNotFound] = useState(false);

    // Subscribe to session and message changes
    useEffect(() => {
        let sessionChannel: RealtimeChannel | null = null;
        let messagesChannel: RealtimeChannel | null = null;

        const setupSubscriptions = (sessionId: string) => {
            // Channel for the current session document
            sessionChannel = supabase.channel(`chat_sessions:id=eq.${sessionId}`)
                .on<ChatSession>('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'chat_sessions', filter: `id=eq.${sessionId}` },
                (payload) => {
                    setSession(payload.new as ChatSession);
                })
                .subscribe();

            // Channel for messages in the current session
            messagesChannel = supabase.channel(`chat_messages:sessionId=eq.${sessionId}`)
                .on<Message>('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `sessionId=eq.${sessionId}` },
                (payload) => {
                    setMessages(currentMessages => [...currentMessages, payload.new as Message]);
                })
                .subscribe();
        };

        if (session?.id) {
            setupSubscriptions(session.id);
        }

        return () => {
            if (sessionChannel) supabase.removeChannel(sessionChannel);
            if (messagesChannel) supabase.removeChannel(messagesChannel);
        };
    }, [session?.id]);

    // Find user's active/pending session on load
    useEffect(() => {
        const findMySession = async () => {
            if (!user) return;
            setIsLoading(true);

            const { data, error } = await supabase
                .from('chat_sessions')
                .select('*')
                .contains('participantIds', [user.id])
                .in('status', ['pending', 'active'])
                .limit(1)
                .single();

            if (data) {
                setSession(data);
                // Fetch initial messages for the session
                const { data: messagesData } = await supabase
                    .from('chat_messages')
                    .select('*')
                    .eq('sessionId', data.id)
                    .order('createdAt', { ascending: true });
                setMessages(messagesData || []);
            } else if (error && error.code !== 'PGRST116') { // Ignore "No rows found" error
                console.error("Error finding user session:", error);
            }
            setIsLoading(false);
        };
        findMySession();
    }, [user]);

    const handleFindChat = async () => {
        if (!user) return;
        setIsFinding(true);
        setNotFound(false);

        try {
            // Find a pending session from another user
            const { data: availableSession, error: findError } = await supabase
                .from('chat_sessions')
                .select('*')
                .eq('status', 'pending')
                .not('participantIds', 'cs', `{${user.id}}`) // Exclude my own pending sessions
                .limit(1)
                .single();
            
            if (findError && findError.code !== 'PGRST116') throw findError;

            if (availableSession) {
                // Join existing session
                const { data: updatedSession, error: updateError } = await supabase
                    .from('chat_sessions')
                    .update({
                        status: 'active',
                        participantIds: [...availableSession.participantIds, user.id]
                    })
                    .eq('id', availableSession.id)
                    .select()
                    .single();

                if (updateError) throw updateError;
                setSession(updatedSession);
            } else {
                setNotFound(true);
            }
        } catch (error) {
            console.error("Error finding chat:", error);
        }
        setIsFinding(false);
    };
    
    const handleCreateAndWait = async () => {
        if (!user) return;
        setIsFinding(true);
        setNotFound(false);

        try {
            const { data: newSession, error } = await supabase
                .from('chat_sessions')
                .insert({
                    participantIds: [user.id],
                    status: 'pending'
                })
                .select()
                .single();
            
            if (error) throw error;
            setSession(newSession);
        } catch (error) {
            console.error("Error creating chat session:", error);
        } finally {
            setIsFinding(false);
        }
    };

    const handleSendMessage = async (text?: string, imageUrl?: string, calculation?: Calculation) => {
        if (!user || !session) return;
        await supabase.from('chat_messages').insert({
            senderId: user.id,
            sessionId: session.id,
            content: { text, imageUrl, calculation }
        });
    };

    const handleEndChat = async () => {
        if (!session) return;
        await supabase.from('chat_sessions').update({ status: 'ended' }).eq('id', session.id);
        setSession(null);
        setMessages([]);
        setNotFound(false);
    };
    
    if (isLoading) {
        return <div className="flex h-full items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary"/></div>;
    }

    if (session) {
        return (
            <div className="flex flex-col h-full">
                <header className="p-4 border-b flex items-center justify-between">
                    <div>
                        <h3 className="font-semibold text-lg">Chat Anonim</h3>
                        <p className="text-sm text-muted-foreground">
                            {session.status === 'pending' ? 'Menunggu teman ngobrol...' : 'Terhubung!'}
                        </p>
                    </div>
                    <Button variant="destructive" size="sm" onClick={handleEndChat}>Akhiri Obrolan</Button>
                </header>
                <div className="flex-1 p-4 overflow-y-auto">
                    <ChatView messages={messages || []} currentUser={user} />
                </div>
                <footer className="p-4 border-t">
                    <ChatInput onSendMessage={handleSendMessage} disabled={session.status === 'pending'} />
                </footer>
            </div>
        );
    }
    
    if (notFound) {
         return (
            <div className="flex flex-col items-center justify-center h-full text-center p-4">
                 <UsersRound className="h-16 w-16 text-muted-foreground mb-4"/>
                <h2 className="text-2xl font-bold font-headline mb-2">Belum Ada Teman Ngobrol</h2>
                <p className="text-muted-foreground max-w-sm mb-6">Saat ini belum ada pengguna lain yang mencari teman ngobrol. Kamu bisa coba lagi atau jadi yang pertama menunggu.</p>
                <div className="flex gap-4">
                     <Button onClick={handleFindChat} disabled={isFinding}>
                        {isFinding ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Search className="mr-2 h-4 w-4"/>}
                        Coba Cari Lagi
                    </Button>
                    <Button variant="outline" onClick={handleCreateAndWait} disabled={isFinding}>
                        {isFinding ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                        Jadilah yang Pertama & Tunggu
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <MessageSquare className="h-16 w-16 text-primary mb-4"/>
            <h2 className="text-2xl font-bold font-headline mb-2">Mulai Obrolan Anonim</h2>
            <p className="text-muted-foreground max-w-sm mb-6">Klik tombol di bawah untuk terhubung secara acak dengan pengusaha muda lain dan saling berbagi inspirasi.</p>
            <Button size="lg" onClick={handleFindChat} disabled={isFinding}>
                {isFinding ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Send className="mr-2 h-4 w-4" />}
                Cari Teman Ngobrol
            </Button>
        </div>
    );
}
