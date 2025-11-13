
'use client';

import { cn } from '@/lib/utils';
import { User, Bot, AlertTriangle } from 'lucide-react';
import type { Timestamp } from 'firebase/firestore';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import ReactMarkdown from 'react-markdown';
import { useUser } from '@/firebase';
import { Loader2 } from 'lucide-react';

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
            <h3>Halo! Saya adalah konsultan AI bisnismu.</h3>
            <p>Saya di sini untuk membantumu menjawab berbagai pertanyaan seputar bisnis, mulai dari strategi marketing, ide produk, hingga cara mengurus perizinan.</p>
            <p>Tanya apa saja, misalnya:</p>
            <ul>
                <li>"Beri aku 5 ide nama brand untuk usaha kopi kekinian."</li>
                <li>"Bagaimana cara promosi produk fashion di TikTok?"</li>
                <li>"Buatkan contoh caption Instagram untuk jualan kue kering."</li>
            </ul>
        </div>
    </div>
)

export function AIChatView({ history, isResponding }: AIChatViewProps) {
  const { user } = useUser();
  const getInitials = (name: string) => (name || "A").split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase();

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
