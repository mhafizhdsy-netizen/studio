
"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useUser, useFirestore, useMemoFirebase, useCollection, useDoc } from "@/firebase";
import { collection, query, where, limit, getDocs, doc, writeBatch, serverTimestamp, setDoc, updateDoc, orderBy, addDoc } from 'firebase/firestore';
import { Button } from "@/components/ui/button";
import { Loader2, MessageSquareDashed, UserRoundX, Wand2, Zap } from "lucide-react";
import { ChatInput } from "@/components/messages/ChatInput";
import { ChatMessage, type Message } from "@/components/messages/ChatView"; // Reusing ChatMessage and Message type
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { errorEmitter, FirestorePermissionError } from "@/firebase";

interface ChatSession {
    id: string;
    participantIds: string[];
    status: 'pending' | 'active' | 'closed';
    createdAt: any;
}

export default function AnonymousChatPage() {
    const { user } = useUser();
    const firestore = useFirestore();
    const [session, setSession] = useState<ChatSession | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSearching, setIsSearching] = useState(false);
    
    // Check for an existing active or pending session for the current user
    const findActiveSession = useCallback(async () => {
        if (!user || !firestore) return;
        setIsLoading(true);

        const activeQuery = query(
            collection(firestore, 'chat_sessions'),
            where('participantIds', 'array-contains', user.uid),
            where('status', 'in', ['active', 'pending'])
        );

        try {
            const activeSnap = await getDocs(activeQuery);
            if (!activeSnap.empty) {
                const activeSession = { id: activeSnap.docs[0].id, ...activeSnap.docs[0].data() } as ChatSession;
                setSession(activeSession);
                if (activeSession.status === 'pending') {
                    setIsSearching(true);
                }
            }
        } catch (error) {
             const permissionError = new FirestorePermissionError({
                path: 'chat_sessions',
                operation: 'list',
            });
            errorEmitter.emit('permission-error', permissionError);
        } finally {
            setIsLoading(false);
        }
    }, [user, firestore]);

    useEffect(() => {
        findActiveSession();
    }, [findActiveSession]);

    // Listen for changes on the pending session
    const pendingSessionRef = useMemoFirebase(() => {
        if (!firestore || !session || session.status !== 'pending') return null;
        return doc(firestore, 'chat_sessions', session.id);
    }, [firestore, session]);

    const { data: liveSession } = useDoc<ChatSession>(pendingSessionRef);

    useEffect(() => {
        if (liveSession && liveSession.status === 'active') {
            setSession(liveSession);
            setIsSearching(false);
        }
    }, [liveSession]);


    const handleFindChat = async () => {
        if (!user || !firestore) return;

        setIsSearching(true);

        const q = query(
            collection(firestore, 'chat_sessions'),
            where('status', '==', 'pending'),
            limit(1)
        );
        
        try {
            const querySnapshot = await getDocs(q);
            const availableSessionDoc = querySnapshot.docs.find(doc => !doc.data().participantIds.includes(user.uid));

            if (availableSessionDoc) {
                // Join an existing pending session
                const sessionData = availableSessionDoc.data() as ChatSession;
                const newParticipants = [...sessionData.participantIds, user.uid];
                
                const batch = writeBatch(firestore);
                batch.update(availableSessionDoc.ref, {
                    status: 'active',
                    participantIds: newParticipants
                });
                
                const systemMessage = {
                    senderId: 'system',
                    type: 'system' as const,
                    text: 'Kamu telah terhubung dengan teman ngobrol baru!',
                    createdAt: serverTimestamp(),
                };
                const messagesColRef = collection(firestore, 'chat_sessions', availableSessionDoc.id, 'messages');
                batch.set(doc(messagesColRef), systemMessage);

                await batch.commit().catch(serverError => {
                    const permissionError = new FirestorePermissionError({
                        path: availableSessionDoc.ref.path,
                        operation: 'update',
                        requestResourceData: { status: 'active', participantIds: newParticipants },
                    });
                    errorEmitter.emit('permission-error', permissionError);
                });

                setSession({ id: availableSessionDoc.id, ...sessionData, status: 'active', participantIds: newParticipants });

            } else {
                // Create a new pending session
                const newSessionData: Omit<ChatSession, 'id'> = {
                    participantIds: [user.uid],
                    status: 'pending',
                    createdAt: serverTimestamp(),
                };
                const newSessionRef = await addDoc(collection(firestore, 'chat_sessions'), newSessionData)
                    .catch(serverError => {
                        const permissionError = new FirestorePermissionError({
                            path: 'chat_sessions',
                            operation: 'create',
                            requestResourceData: newSessionData,
                        });
                        errorEmitter.emit('permission-error', permissionError);
                        throw serverError; // Prevent further execution if addDoc fails
                    });
                setSession({ id: newSessionRef.id, ...newSessionData } as ChatSession);
            }
        } catch (error) {
            // This will catch errors from getDocs or re-thrown from addDoc
            if (!(error instanceof FirestorePermissionError)) {
                 const permissionError = new FirestorePermissionError({
                    path: 'chat_sessions',
                    operation: 'list',
                });
                errorEmitter.emit('permission-error', permissionError);
            }
        } finally {
            setIsSearching(false);
        }
    };
    
    const handleLeaveChat = async () => {
        if (!session || !firestore) return;
        
        updateDoc(doc(firestore, 'chat_sessions', session.id), { status: 'closed' })
        .catch(serverError => {
             const permissionError = new FirestorePermissionError({
                path: `chat_sessions/${session.id}`,
                operation: 'update',
                requestResourceData: { status: 'closed' }
            });
            errorEmitter.emit('permission-error', permissionError);
        });

        setSession(null);
        setIsSearching(false);
    }

    if (isLoading) {
        return (
            <div className="flex flex-1 items-center justify-center h-full">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        );
    }
    
    if (session) {
        return <ActiveChatScreen session={session} onLeave={handleLeaveChat} isSearching={isSearching} />
    }

    return (
        <main className="flex flex-1 flex-col items-center justify-center gap-4 p-4 lg:gap-6 lg:p-6 text-center">
            <div className="rounded-full bg-primary/10 p-6">
                <Wand2 className="h-16 w-16 text-primary" />
            </div>
            <h1 className="text-2xl font-semibold md:text-3xl font-headline">Chat Anonim Acak</h1>
            <p className="max-w-md text-muted-foreground">
                Siap untuk dapat teman diskusi baru? Klik tombol di bawah untuk terhubung secara acak dengan pengusaha muda lainnya!
            </p>
            <Button size="lg" onClick={handleFindChat} disabled={isSearching} className="font-bold text-lg">
                {isSearching ? (
                    <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Mencari...
                    </>
                ) : (
                    <>
                        <Zap className="mr-2 h-5 w-5" />
                        Cari Teman Ngobrol
                    </>
                )}
            </Button>
        </main>
    );
}

function ActiveChatScreen({ session, onLeave, isSearching }: { session: ChatSession, onLeave: () => void, isSearching: boolean }) {
    const { user } = useUser();
    const firestore = useFirestore();
    const scrollAreaRef = useRef<HTMLDivElement | null>(null);

    const messagesQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(
            collection(firestore, 'chat_sessions', session.id, 'messages'),
            orderBy('createdAt', 'asc')
        );
    }, [firestore, session.id]);

    const { data: messages, isLoading } = useCollection<Message>(messagesQuery);
    
    useEffect(() => {
        if (scrollAreaRef.current) {
            scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
        }
    }, [messages]);

    if(isSearching || session.status === 'pending') {
        return (
             <div className="flex flex-1 flex-col items-center justify-center gap-4 p-4 lg:gap-6 lg:p-6 text-center">
                <Loader2 className="h-16 w-16 animate-spin text-primary" />
                <h1 className="text-2xl font-semibold md:text-3xl font-headline mt-4">Mencari Teman Ngobrol...</h1>
                <p className="max-w-md text-muted-foreground">
                    Sabar ya, sistem lagi nyariin kamu partner diskusi yang paling pas.
                </p>
            </div>
        )
    }

    return (
        <div className="flex-1 flex flex-col h-[calc(100vh-theme(height.14)-1px)]">
             <header className="p-4 border-b flex items-center justify-between gap-3">
                <div>
                    <h3 className="font-semibold text-lg">Kamu & Teman Ngobrol Anonim</h3>
                    <p className="text-sm text-muted-foreground">Status: <span className="text-green-500 font-medium">Terhubung</span></p>
                </div>
                <Button variant="destructive" onClick={onLeave}>
                    <UserRoundX className="h-4 w-4 mr-2" />
                    Keluar
                </Button>
            </header>
             <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
                <div className="space-y-6 pr-4">
                    {isLoading ? (
                        <div className="flex justify-center items-center h-full">
                            <Loader2 className="h-8 w-8 animate-spin text-primary"/>
                        </div>
                    ) : messages?.length === 0 ? (
                       <div className="flex flex-col items-center justify-center text-center w-full h-full text-muted-foreground py-10">
                            <MessageSquareDashed className="h-12 w-12 mb-4" />
                            <p>Mulai percakapan!</p>
                        </div>
                    ) : (
                        messages?.map(message => (
                            <ChatMessage key={message.id} message={message} isMe={message.senderId === user?.uid} />
                        ))
                    )}
                    {session.status === 'closed' && (
                         <Alert variant="destructive" className="mt-4">
                            <UserRoundX className="h-4 w-4" />
                            <AlertTitle>Obrolan Ditutup</AlertTitle>
                            <AlertDescription>Teman ngobrolmu telah meninggalkan percakapan. Cari teman baru untuk memulai lagi.</AlertDescription>
                        </Alert>
                    )}
                </div>
            </ScrollArea>
             <footer className="p-4 border-t">
                {session.status === 'active' ? (
                     <ChatInput conversationId={session.id} />
                ) : (
                    <p className="text-center text-sm text-muted-foreground">Obrolan telah berakhir.</p>
                )}
            </footer>
        </div>
    )
}

    