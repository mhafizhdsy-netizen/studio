
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useUser, useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking, useDoc } from "@/firebase";
import { collection, query, orderBy, Timestamp, serverTimestamp, doc } from "firebase/firestore";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Loader2, Send, MessageSquare, ChevronDown, ChevronUp, Shield } from "lucide-react";
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "../ui/badge";

interface UserProfile {
    isAdmin?: boolean;
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  userPhotoURL: string;
  text: string;
  createdAt: Timestamp;
  parentId?: string;
  replies?: Comment[];
}

const commentSchema = z.object({
  text: z.string().min(1, "Komentar tidak boleh kosong.").max(500, "Komentar terlalu panjang."),
});

interface CommentSectionProps {
  calculationId: string;
}

const getInitials = (name: string) => (name || "A").split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase();

const formatDate = (timestamp: Timestamp | null) => {
    if (!timestamp) return 'Baru saja';
    return formatDistanceToNow(timestamp.toDate(), { addSuffix: true, locale: id });
};

function CommentForm({ calculationId, parentId, onAfterSubmit, autofocus }: { calculationId: string; parentId?: string; onAfterSubmit?: () => void; autofocus?: boolean; }) {
    const { user } = useUser();
    const firestore = useFirestore();
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
        if (!user || !firestore) return;
        setIsSubmitting(true);
    
        const commentData: any = {
          userId: user.uid,
          userName: user.displayName || "Anonim",
          userPhotoURL: user.photoURL || "",
          text: values.text,
          createdAt: serverTimestamp(),
        };

        if (parentId) {
            commentData.parentId = parentId;
        }
    
        const commentsColRef = collection(firestore, 'public_calculations', calculationId, 'comments');
        await addDocumentNonBlocking(commentsColRef, commentData);
        
        form.reset();
        setIsSubmitting(false);
        onAfterSubmit?.();
      };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="mt-4 flex gap-2 items-start">
                <Avatar className="h-9 w-9 mt-1">
                    <AvatarImage src={user.photoURL ?? undefined} alt={user.displayName ?? ''} />
                    <AvatarFallback>{getInitials(user.displayName ?? '')}</AvatarFallback>
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

function CommentItem({ comment, calculationId }: { comment: Comment, calculationId: string }) {
    const [isReplying, setIsReplying] = useState(false);
    const [showReplies, setShowReplies] = useState(true);
    const firestore = useFirestore();

    const userDocRef = useMemoFirebase(() => {
        if(!firestore || !comment.userId) return null;
        return doc(firestore, 'users', comment.userId);
    }, [firestore, comment.userId]);

    const {data: userProfile} = useDoc<UserProfile>(userDocRef);

    return (
        <div className="flex gap-3">
            <Avatar className="h-8 w-8">
                <AvatarImage src={comment.userPhotoURL} alt={comment.userName} />
                <AvatarFallback className="text-xs">{getInitials(comment.userName)}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
                <div className="bg-muted/50 p-3 rounded-lg">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                             <p className="font-semibold text-sm">{comment.userName}</p>
                             {userProfile?.isAdmin && <Badge variant="accent" className="text-xs px-1.5 py-0"><Shield className="h-3 w-3 mr-1"/>Admin</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground">{formatDate(comment.createdAt)}</p>
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
                        onAfterSubmit={() => setIsReplying(false)}
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
                                    <CommentItem key={reply.id} comment={reply} calculationId={calculationId} />
                                ))}
                            </div>
                        </CollapsibleContent>
                    </Collapsible>
                )}
            </div>
        </div>
    )
}

export function CommentSection({ calculationId }: CommentSectionProps) {
  const { user } = useUser();
  const firestore = useFirestore();
  
  const commentsQuery = useMemoFirebase(() => {
    if (!firestore || !calculationId) return null;
    return query(
      collection(firestore, 'public_calculations', calculationId, 'comments'),
      orderBy('createdAt', 'asc')
    );
  }, [firestore, calculationId]);

  const { data: allComments, isLoading: isLoadingComments } = useCollection<Omit<Comment, 'replies'>>(commentsQuery);

  const comments = useMemo(() => {
    if (!allComments) return [];
    const commentMap = new Map<string, Comment>();
    const rootComments: Comment[] = [];

    // First pass: create a map of all comments
    allComments.forEach(comment => {
        commentMap.set(comment.id, { ...comment, replies: [] });
    });
    
    // Second pass: group replies under their parents
    allComments.forEach(comment => {
        if (comment.parentId && commentMap.has(comment.parentId)) {
            commentMap.get(comment.parentId)?.replies?.push(commentMap.get(comment.id)!);
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
                <CommentItem key={comment.id} comment={comment} calculationId={calculationId} />
            )) : !isLoadingComments && (
                <p className="text-sm text-muted-foreground text-center py-4">Jadilah yang pertama berkomentar!</p>
            )}
        </div>
        
        <CommentForm calculationId={calculationId} />
    </div>
  );
}
