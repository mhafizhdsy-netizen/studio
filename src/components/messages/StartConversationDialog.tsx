"use client";

import { useState }from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useUser, useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking } from "@/firebase";
import { collection, query, where, doc, getDocs, writeBatch, serverTimestamp } from 'firebase/firestore';
import type { User as FirebaseUser } from "firebase/auth";
import { Avatar, AvatarImage, AvatarFallback } from "../ui/avatar";
import { Loader2 } from "lucide-react";
import { Input } from "../ui/input";
import { ScrollArea } from "../ui/scroll-area";
import type { Conversation } from "./ConversationList";

interface UserProfile {
    id: string;
    name: string;
    email: string;
    photoURL: string;
}

interface StartConversationDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    onConversationStarted: (conversation: Conversation) => void;
}

export function StartConversationDialog({ isOpen, onOpenChange, onConversationStarted }: StartConversationDialogProps) {
    const { user: currentUser } = useUser();
    const firestore = useFirestore();
    const [searchTerm, setSearchTerm] = useState("");
    const [isCreating, setIsCreating] = useState(false);

    const usersQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'users'), where('id', '!=', currentUser?.uid || ''));
    }, [firestore, currentUser]);

    const { data: users, isLoading } = useCollection<UserProfile>(usersQuery);

    const filteredUsers = users?.filter(user => 
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    const getInitials = (name: string) => (name || "A").split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase();

    const handleSelectUser = async (selectedUser: UserProfile) => {
        if (!currentUser || !firestore || isCreating) return;
        setIsCreating(true);

        // Check if a conversation already exists
        const existingConvoQuery = query(
            collection(firestore, 'conversations'),
            where('participantIds', '==', [currentUser.uid, selectedUser.id].sort())
        );

        const existingConvoSnap = await getDocs(existingConvoQuery);

        if (!existingConvoSnap.empty) {
            // Conversation already exists
            const convoDoc = existingConvoSnap.docs[0];
            onConversationStarted({ id: convoDoc.id, ...convoDoc.data() } as Conversation);
        } else {
            // Create a new conversation
            const conversationData = {
                participantIds: [currentUser.uid, selectedUser.id].sort(),
                participants: {
                    [currentUser.uid]: {
                        name: currentUser.displayName || currentUser.email,
                        photoURL: currentUser.photoURL,
                    },
                    [selectedUser.id]: {
                        name: selectedUser.name,
                        photoURL: selectedUser.photoURL,
                    },
                },
                lastMessageTimestamp: serverTimestamp(),
                lastMessageText: "Percakapan dimulai.",
            };

            const newConvoRef = doc(collection(firestore, 'conversations'));
            // Not using non-blocking here as we need the result immediately
            await setDoc(newConvoRef, conversationData);
            
            onConversationStarted({ id: newConvoRef.id, ...conversationData } as unknown as Conversation);
        }
        
        setIsCreating(false);
        onOpenChange(false);
        setSearchTerm("");
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Mulai Percakapan Baru</DialogTitle>
                    <DialogDescription>Pilih pengguna untuk memulai obrolan.</DialogDescription>
                </DialogHeader>
                <div className="py-2">
                    <Input 
                        placeholder="Cari pengguna berdasarkan nama atau email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <ScrollArea className="h-72">
                    <div className="pr-4">
                        {isLoading || isCreating ? (
                            <div className="flex items-center justify-center h-full py-8">
                                <Loader2 className="h-6 w-6 animate-spin text-primary"/>
                            </div>
                        ) : (
                            filteredUsers?.map(user => (
                                <div key={user.id}
                                    onClick={() => handleSelectUser(user)}
                                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer"
                                >
                                    <Avatar>
                                        <AvatarImage src={user.photoURL} alt={user.name} />
                                        <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                                    </Avatar>
                                    <div className="truncate">
                                        <p className="font-semibold truncate">{user.name}</p>
                                        <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                                    </div>
                                </div>
                            ))
                        )}
                         {filteredUsers?.length === 0 && !isLoading && (
                            <p className="text-center text-sm text-muted-foreground py-8">Pengguna tidak ditemukan.</p>
                         )}
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    )
}

    