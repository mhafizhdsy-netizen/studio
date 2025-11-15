
"use client";

import { useState, useMemo, useEffect } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/supabase/auth-provider";
import { supabase } from "@/lib/supabase";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Loader2, Send, MessageSquare, ChevronDown, ChevronUp, Shield } from "lucide-react";
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "../ui/badge";
import { useQuery } from "@tanstack/react-query";

interface UserProfile {
    isAdmin?: boolean;
    name: string;
}

export interface Comment {
  id: string;
  userId: string;
  calculationId: string;
  text: string;
  createdAt: string;
  parentId?: string;
  replies?: Comment[];
  user?: {
      name: string;
      photoURL?: string;
      isAdmin?: boolean;
  }
}

const commentSchema = z.object({
  text: z.string().min(1, "Komentar tidak boleh kosong.").max(500, "Komentar terlalu panjang."),
});

interface CommentSectionProps {
  calculationId: string;
}

const getInitials = (name: string) => (name || "A").split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase();

const formatDate = (timestamp: string | null) => {
    if (!timestamp) return 'Baru saja';
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true, locale: id });
};

function CommentForm({ calculationId, parentId, onAfterSubmit, autofocus }: { calculationId: string; parentId?: string; onAfterSubmit?: () => void; autofocus?: boolean; }) {
    const { user } = useAuth();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<z.infer<typeof commentSchema>>({
        resolver: zodResolver(commentSchema),
        defaultValues: { text: "" },
    });

    if (!user) {
        return (
             <div className="text-center text-sm text-muted-foreground mt-4 p-4 bg-muted/50 rounded-lg">
                <a href="/login" className="text-primary font-semibold hover:underline">Masuk</a> untuk ikut berdiskusi.
            </div>
        );
    }
    
    const onSubmit = async (values: z.infer<typeof commentSchema>) => {
        if (!user) return;
        setIsSubmitting(true);
    
        const commentData: any = {
          userId: user.id,
          calculationId: calculationId,
          text: values.text,
        };

        if (parentId) {
            commentData.parentId = parentId;
        }
    
        await supabase.from('comments').insert(commentData);
        
        form.reset();
        setIsSubmitting(false);
        onAfterSubmit?.();
      };

    const photoURL = user?.user_metadata?.photoURL;
    const name = user?.user_metadata?.name || 'Anonim';

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="mt-4 flex gap-2 items-start">
                <Avatar className="h-9 w-9 mt-1">
                    <AvatarImage src={photoURL} alt={name} />
                    <AvatarFallback>{getInitials(name)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                    <FormField
                    control={form.control}
                    name="text"
                    render={({ field }) => (
                        <FormItem>
                        <FormControl>
                            <Textarea autoFocus={autofocus} placeholder={parentId ? "Tulis balasanmu..." : "Tulis komentarmu..."} {...field} className="min-h-[40px]"/>
                        </FormControl>
                         <FormMessage />
                        </FormItem>
                    )}
                    />
                     <Button type="submit" size="sm" className="mt-2" disabled={isSubmitting}>
                        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin"/> : <Send className="h-4 w-4" />}
                        <span className="ml-2">{parentId ? "Balas" : "Kirim"}</span>
                    </Button>
                </div>
            </form>
        </Form>
    );
}

function CommentItem({ comment, calculationId, onCommentAdded }: { comment: Comment, calculationId: string, onCommentAdded: () => void }) {
    const [isReplying, setIsReplying] = useState(false);
    const [showReplies, setShowReplies] = useState(false);

    const userName = comment.user?.name || "Anonim";
    const userPhotoURL = comment.user?.photoURL;
    const isAdmin = comment.user?.isAdmin || false;

    return (
        <div className="flex gap-3">
            <Avatar className="h-8 w-8">
                <AvatarImage src={userPhotoURL} alt={userName} />
                <AvatarFallback className="text-xs">{getInitials(userName)}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
                <div className="bg-muted/50 p-3 rounded-lg">
                    <div className="flex justify-between items-center gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                             <p className="font-semibold text-sm">{userName}</p>
                             {isAdmin && <Badge variant="accent" className="text-xs px-1.5 py-0 shrink-0"><Shield className="h-3 w-3 mr-1"/>Admin</Badge>}
                        </div>
                        <p className="text-[10px] text-muted-foreground whitespace-nowrap">{formatDate(comment.createdAt)}</p>
                    </div>
                    <p className="text-sm mt-1 whitespace-pre-wrap">{comment.text}</p>
                </div>
                 <Button variant="ghost" size="sm" className="h-auto px-2 py-1 text-xs text-muted-foreground" onClick={() => setIsReplying(!isReplying)}>
                    {isReplying ? "Batal" : "Balas"}
                </Button>
                
                {isReplying && (
                    <CommentForm
                        calculationId={calculationId}
                        parentId={comment.id}
                        onAfterSubmit={() => { setIsReplying(false); onCommentAdded(); }}
                        autofocus
                    />
                )}
                
                {comment.replies && comment.replies.length > 0 && (
                     <Collapsible open={showReplies} onOpenChange={setShowReplies}>
                        <CollapsibleTrigger asChild>
                             <Button variant="ghost" size="sm" className="h-auto px-2 py-1 text-xs text-muted-foreground">
                                {showReplies ? <ChevronUp className="h-3 w-3 mr-1" /> : <ChevronDown className="h-3 w-3 mr-1" />}
                                {showReplies ? `Sembunyikan ${comment.replies.length} balasan` : `Tampilkan ${comment.replies.length} balasan`}
                            </Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                             <div className="mt-4 pl-4 border-l-2 space-y-4">
                                {comment.replies.map(reply => (
                                    <CommentItem key={reply.id} comment={reply} calculationId={calculationId} onCommentAdded={onCommentAdded} />
                                ))}
                            </div>
                        </CollapsibleContent>
                    </Collapsible>
                )}
            </div>
        </div>
    )
}

const fetchComments = async (calculationId: string) => {
    if (!calculationId) return [];
    const { data, error } = await supabase
        .from('comments')
        .select(`
            id,
            userId,
            calculationId,
            text,
            createdAt,
            parentId,
            user:users (
                name,
                photoURL,
                isAdmin
            )
        `)
        .eq('calculationId', calculationId)
        .order('createdAt', { ascending: true });
    
    if (error) {
        console.error("Error fetching comments", error);
        throw error;
    }
    return data || [];
};

export function CommentSection({ calculationId }: CommentSectionProps) {
  const { data: allComments, isLoading: isLoadingComments, refetch } = useQuery({
      queryKey: ['comments', calculationId],
      queryFn: () => fetchComments(calculationId),
      enabled: !!calculationId
  });

  const comments = useMemo(() => {
    if (!allComments) return [];
    const commentMap = new Map<string, Comment>();
    const rootComments: Comment[] = [];

    // First pass: create a map of all comments
    allComments.forEach((comment: any) => {
        commentMap.set(comment.id, { ...comment, replies: [] });
    });
    
    // Second pass: group replies under their parents
    allComments.forEach((comment: any) => {
        if (comment.parentId && commentMap.has(comment.parentId)) {
            const parent = commentMap.get(comment.parentId);
            if (parent) {
                parent.replies = parent.replies ? [...parent.replies, commentMap.get(comment.id)!] : [commentMap.get(comment.id)!];
            }
        } else {
            rootComments.push(commentMap.get(comment.id)!);
        }
    });

    return rootComments;
  }, [allComments]);


  return (
    <div className="pt-6 border-t">
        <h3 className="text-lg font-headline mb-4 flex items-center gap-2">
            <MessageSquare className="h-5 w-5"/> Diskusi Komunitas
        </h3>
        <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
            {isLoadingComments && <div className="flex justify-center py-4"><Loader2 className="h-6 w-6 animate-spin"/></div>}
            
            {comments && comments.length > 0 ? comments.map((comment) => (
                <CommentItem key={comment.id} comment={comment} calculationId={calculationId} onCommentAdded={refetch} />
            )) : !isLoadingComments && (
                <p className="text-sm text-muted-foreground text-center py-4">Jadilah yang pertama berkomentar!</p>
            )}
        </div>
        
        <CommentForm calculationId={calculationId} onAfterSubmit={refetch} />
    </div>
  );
}
