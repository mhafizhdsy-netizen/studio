
"use client";

import { useState, useEffect, useRef } from "react";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { addDoc, collection, doc, getDocs, limit, query, serverTimestamp, updateDoc, where, Timestamp } from 'firebase/firestore';
import { Button } from "@/components/ui/button";
import { Loader2, MessageSquare, Send, UsersRound, Search } from "lucide-react";
import { ChatInput } from "@/components/messages/ChatInput";
import { ChatView, type Message } from "@/components/messages/ChatView";
import type { Calculation } from "@/components/dashboard/CalculationHistory";
import { FirestorePermissionError } from "@/firebase/errors";

export default function AnonymousChatPage() {
    const { user } = useUser();
    const firestore = useFirestore();
    const [session, setSession] = useState<{ id: string, status: 'pending' | 'active' | 'ended', participantIds: string[] } | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isFinding, setIsFinding] = useState(false);
    const [notFound, setNotFound] = useState(false);

    const messagesQuery = useMemoFirebase(() => {
        if (!firestore || !session) return null;
        return query(collection(firestore, 'chat_sessions', session.id, 'messages'), orderBy('createdAt', 'asc'));
    }, [firestore, session]);

    const { data: messages } = useCollection<Message>(messagesQuery);
    
    // Effect to find user's active/pending session on load
    useEffect(() => {
        const findMySession = async () => {
            if (!user || !firestore) return;
            setIsLoading(true);
            try {
                const q = query(
                    collection(firestore, 'chat_sessions'),
                    where('participantIds', 'array-contains', user.uid),
                    where('status', 'in', ['pending', 'active'])
                );
                const querySnapshot = await getDocs(q);
                if (!querySnapshot.empty) {
                    const mySessionDoc = querySnapshot.docs[0];
                    setSession({ id: mySessionDoc.id, ...mySessionDoc.data() } as any);
                }
            } catch (error) {
                console.error("Error finding user session:", error);
            }
            setIsLoading(false);
        };
        findMySession();
    }, [user, firestore]);

    const handleFindChat = async () => {
        if (!user || !firestore) return;
        setIsFinding(true);
        setNotFound(false);

        try {
            const q = query(
                collection(firestore, 'chat_sessions'),
                where('status', '==', 'pending'),
                limit(1)
            );
            const querySnapshot = await getDocs(q);

            let availableSession: { id: string, data: any } | null = null;

            querySnapshot.forEach(doc => {
                if (!doc.data().participantIds.includes(user.uid)) {
                    availableSession = { id: doc.id, data: doc.data() };
                }
            });


            if (availableSession) {
                // Join existing session
                const sessionRef = doc(firestore, 'chat_sessions', availableSession.id);
                await updateDoc(sessionRef, {
                    status: 'active',
                    participantIds: [...availableSession.data.participantIds, user.uid]
                });
                setSession({ id: availableSession.id, ...availableSession.data, status: 'active', participantIds: [...availableSession.data.participantIds, user.uid] } as any);
            } else {
                // No pending session found
                setNotFound(true);
            }
        } catch (error) {
            console.error("Error finding chat:", error);
        }
        setIsFinding(false);
    };
    
    const handleCreateAndWait = async () => {
        if (!user || !firestore) return;
        setIsFinding(true);
        setNotFound(false);

        try {
            // Create new session
            const newSessionData = {
                participantIds: [user.uid],
                status: 'pending',
                createdAt: serverTimestamp()
            };
            const newSessionRef = await addDoc(collection(firestore, 'chat_sessions'), newSessionData)
                .catch(serverError => {
                    const permissionError = new FirestorePermissionError({
                        path: 'chat_sessions',
                        operation: 'create',
                        requestResourceData: newSessionData,
                    });
                    throw permissionError;
                });
            setSession({ id: newSessionRef.id, ...newSessionData });

        } catch (error) {
            console.error("Error creating chat session:", error);
            if (!(error instanceof FirestorePermissionError)) {
                 const permissionError = new FirestorePermissionError({
                    path: 'chat_sessions',
                    operation: 'list',
                });
                throw permissionError;
            }
            throw error;
        } finally {
            setIsFinding(false);
        }
    };


    const handleSendMessage = async (text?: string, imageUrl?: string, calculation?: Calculation) => {
        if (!user || !firestore || !session) return;
        const messageData = {
            senderId: user.uid,
            createdAt: serverTimestamp(),
            content: {
                text: text || null,
                imageUrl: imageUrl || null,
                calculation: calculation || null,
            }
        };
        await addDoc(collection(firestore, 'chat_sessions', session.id, 'messages'), messageData);
    };

    const handleEndChat = async () => {
        if (!firestore || !session) return;
        const sessionRef = doc(firestore, 'chat_sessions', session.id);
        await updateDoc(sessionRef, { status: 'ended' });
        setSession(null);
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

