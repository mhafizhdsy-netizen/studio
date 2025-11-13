
"use client";

import { cn } from "@/lib/utils";
import { Bot } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "../ui/avatar";
import { useUser } from "@/firebase";

// Simplified message type for text-only chat
export interface SimpleAIMessage {
    id: string;
    role: 'user' | 'model';
    content: string;
}

export function AIChatMessage({ message, isUser }: { message: SimpleAIMessage, isUser: boolean }) {
    const { user } = useUser();
    
    const getInitials = (name: string | undefined | null) => {
        if (!name) return 'U';
        return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    };

    return (
        <div className={cn("flex items-end gap-2", isUser ? "justify-end" : "justify-start")}>
             {!isUser && (
                <Avatar className="h-9 w-9 self-start">
                    <AvatarImage src="/logo-ai.png" />
                    <AvatarFallback><Bot /></AvatarFallback>
                </Avatar>
            )}
            <div className={cn(
                "p-3 rounded-lg max-w-sm md:max-w-2xl", 
                isUser ? "bg-primary text-primary-foreground" : "bg-muted"
            )}>
                <p className="whitespace-pre-wrap">{message.content}</p>
            </div>
             {isUser && (
                <Avatar className="h-9 w-9 self-start">
                    <AvatarImage src={user?.photoURL ?? undefined} />
                    <AvatarFallback>{getInitials(user?.displayName)}</AvatarFallback>
                </Avatar>
            )}
        </div>
    )
}
