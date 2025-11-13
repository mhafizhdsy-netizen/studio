
"use client";

import { cn, formatCurrency } from "@/lib/utils";
import { Calculator, Bot, User } from "lucide-react";
import Image from "next/image";
import { Avatar, AvatarImage, AvatarFallback } from "../ui/avatar";
import Markdown from 'react-markdown';
import { useUser } from "@/firebase";

export interface MessagePart {
    text?: string;
    media?: {
        url: string;
        contentType?: string;
    };
    data?: any;
}

export interface AIMessage {
    id: string;
    role: 'user' | 'model';
    content: MessagePart[];
}

export function AIChatMessage({ message, isUser }: { message: AIMessage, isUser: boolean }) {
    const { user } = useUser();
    
    const getInitials = (name: string | undefined | null) => {
        if (!name) return 'U';
        return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    };

    const renderContent = (part: MessagePart, index: number) => {
        if (part.text) {
             return <Markdown key={index} components={{
                p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
                ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-2" {...props} />,
                ol: ({node, ...props}) => <ol className="list-decimal pl-5 mb-2" {...props} />,
                li: ({node, ...props}) => <li className="mb-1" {...props} />,
                strong: ({node, ...props}) => <strong className="font-bold" {...props} />,
                a: ({node, ...props}) => <a className="text-primary underline" target="_blank" rel="noopener noreferrer" {...props} />,
                table: ({node, ...props}) => <table className="table-auto w-full my-2 border-collapse border border-border" {...props} />,
                thead: ({node, ...props}) => <thead className="bg-muted/50" {...props} />,
                tbody: ({node, ...props}) => <tbody {...props} />,
                tr: ({node, ...props}) => <tr className="border-b border-border" {...props} />,
                th: ({node, ...props}) => <th className="p-2 border border-border text-left" {...props} />,
                td: ({node, ...props}) => <td className="p-2 border border-border" {...props} />,
            }}>{part.text}</Markdown>
        }
        if (part.media?.url) {
            return (
                 <a href={part.media.url} target="_blank" rel="noopener noreferrer" key={index}>
                    <Image src={part.media.url} alt={'User upload'} width={256} height={256} className="rounded-lg max-w-xs object-cover mt-2" />
                </a>
            )
        }
        if (part.data?.type === 'calculation') {
            return <SharedCalculationCard key={index} calculation={part.data} />;
        }
        return null;
    }

    return (
        <div className={cn("flex items-end gap-2", isUser ? "justify-end" : "justify-start")}>
             {!isUser && (
                <Avatar className="h-9 w-9 self-start">
                    <AvatarImage src="/logo-ai.png" />
                    <AvatarFallback><Bot /></AvatarFallback>
                </Avatar>
            )}
            <div className={cn(
                "p-3 rounded-lg max-w-sm md:max-w-2xl prose prose-sm dark:prose-invert prose-p:my-0 prose-headings:my-0", 
                isUser ? "bg-primary text-primary-foreground" : "bg-muted"
            )}>
                {message.content.map(renderContent)}
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

function SharedCalculationCard({ calculation }: { calculation: any }) {
    if (!calculation) {
        return <div className="flex items-center gap-2 p-2 rounded-lg bg-background/50 text-destructive-foreground"><Calculator className="h-4 w-4"/> <p className="text-sm">Data perhitungan tidak valid.</p></div>
    }

    return (
        <div className="p-3 rounded-lg bg-background/50 text-foreground w-64 mt-2 not-prose">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1"><Calculator className="h-3 w-3"/> Perhitungan HPP Dibagikan</p>
            <p className="font-bold truncate mt-1">{calculation.productName}</p>
            <div className="text-xs mt-2 space-y-1">
                <div className="flex justify-between">
                    <span>Total HPP:</span>
                    <span className="font-semibold">{formatCurrency(calculation.totalHPP)}</span>
                </div>
                 <div className="flex justify-between">
                    <span>Harga Jual:</span>
                    <span className="font-semibold">{formatCurrency(calculation.suggestedPrice)}</span>
                </div>
            </div>
        </div>
    )
}

    