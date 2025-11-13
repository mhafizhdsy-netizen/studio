
'use client';

import { cn } from '@/lib/utils';
import { User, Bot, AlertTriangle, Copy, Check } from 'lucide-react';
import type { Timestamp } from 'firebase/firestore';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import ReactMarkdown from 'react-markdown';
import { useUser } from '@/firebase';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '../ui/button';

export interface AIChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  createdAt: Timestamp;
  isError?: boolean;
}

interface AIChatViewProps {
  history: AIChatMessage[];
  isResponding: boolean;
}

const WelcomeMessage = () => (
    <div className="flex items-start gap-4">
        <Avatar className="h-9 w-9 border-2 border-primary">
            <AvatarFallback className="bg-primary/20 text-primary">
                 <Bot className="h-5 w-5" />
            </AvatarFallback>
        </Avatar>
        <div className="p-4 rounded-lg bg-muted max-w-2xl prose dark:prose-invert">
            <h3>Halo, bestie! Aku Konsultan AI.</h3>
            <p>Lagi pusing mikirin bisnis? Atau butuh ide segar? Spill aja semua ke aku! Aku siap bantu kamu.</p>
            <p>Tanya apa aja, misalnya:</p>
            <ul>
                <li>"Kasih 5 ide nama brand buat usaha kopi kekinian dong."</li>
                <li>"Gimana cara promosi produk fashion di TikTok biar FYP?"</li>
                <li>"Bikinin contoh caption IG buat jualan kue kering, yang vibes-nya estetik."</li>
            </ul>
        </div>
    </div>
)

export function AIChatView({ history, isResponding }: AIChatViewProps) {
  const { user } = useUser();
  const { toast } = useToast();
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);

  const getInitials = (name: string) => (name || "A").split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase();

  const handleCopy = (text: string, messageId: string) => {
    navigator.clipboard.writeText(text).then(() => {
        toast({
            title: "Tersalin!",
            description: "Respon AI berhasil disalin ke clipboard.",
        });
        setCopiedMessageId(messageId);
        setTimeout(() => setCopiedMessageId(null), 2000);
    });
  }

  return (
    <div className="space-y-6">
        {history.length === 0 && <WelcomeMessage />}
      {history.map((message) => {
        const isUser = message.role === 'user';
        return (
          <div
            key={message.id}
            className={cn(
              'flex items-start gap-4',
              isUser ? 'justify-end' : 'justify-start'
            )}
          >
            {!isUser && (
                 <Avatar className="h-9 w-9 border-2 border-primary">
                    <AvatarFallback className="bg-primary/20 text-primary">
                        <Bot className="h-5 w-5" />
                    </AvatarFallback>
                </Avatar>
            )}
            <div className='group flex flex-col items-start gap-2'>
                <div
                className={cn(
                    'p-4 rounded-lg max-w-2xl prose dark:prose-invert',
                    isUser ? 'bg-primary text-primary-foreground' : (message.isError ? 'bg-destructive/20 border border-destructive' : 'bg-muted')
                )}
                >
                {message.isError && <p className='flex items-center gap-2 font-bold'><AlertTriangle className='h-4 w-4'/> Terjadi Kesalahan</p>}
                <ReactMarkdown
                    components={{
                        h1: ({node, ...props}) => <h1 className="text-2xl font-bold" {...props} />,
                        h2: ({node, ...props}) => <h2 className="text-xl font-bold" {...props} />,
                        h3: ({node, ...props}) => <h3 className="text-lg font-bold" {...props} />,
                        p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
                        ul: ({node, ...props}) => <ul className="list-disc pl-5 my-2" {...props} />,
                        ol: ({node, ...props}) => <ol className="list-decimal pl-5 my-2" {...props} />,
                        li: ({node, ...props}) => <li className="mb-1" {...props} />,
                    }}
                >
                    {message.content}
                </ReactMarkdown>
                </div>
                 {!isUser && !message.isError && (
                    <Button 
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopy(message.content, message.id)}
                        className="h-8 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-label="Salin pesan"
                    >
                       {copiedMessageId === message.id ? (
                           <>
                               <Check className="h-4 w-4 mr-2 text-primary" />
                               Tersalin
                           </>
                       ) : (
                           <>
                               <Copy className="h-4 w-4 mr-2" />
                               Salin
                           </>
                       )}
                    </Button>
                 )}
            </div>
             {isUser && user && (
                 <Avatar className="h-9 w-9">
                    <AvatarImage src={user.photoURL ?? undefined} alt={user.displayName ?? 'User'} />
                    <AvatarFallback className='bg-muted-foreground text-muted'>{getInitials(user.displayName ?? '')}</AvatarFallback>
                </Avatar>
            )}
          </div>
        );
      })}
       {isResponding && (
           <div className="flex items-start gap-4">
                <Avatar className="h-9 w-9 border-2 border-primary">
                    <AvatarFallback className="bg-primary/20 text-primary">
                        <Bot className="h-5 w-5" />
                    </AvatarFallback>
                </Avatar>
                <div className="p-4 rounded-lg bg-muted max-w-2xl flex items-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin text-primary"/>
                    <span className="text-sm text-muted-foreground">AI sedang berpikir...</span>
                </div>
            </div>
       )}
    </div>
  );
}
