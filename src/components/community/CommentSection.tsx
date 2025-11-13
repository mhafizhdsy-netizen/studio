
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useUser, useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking } from "@/firebase";
import { collection, query, orderBy, Timestamp, serverTimestamp } from "firebase/firestore";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Loader2, Send, MessageSquare } from "lucide-react";
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  userPhotoURL: string;
  text: string;
  createdAt: Timestamp;
}

const commentSchema = z.object({
  text: z.string().min(1, "Komentar tidak boleh kosong.").max(500, "Komentar terlalu panjang."),
});

interface CommentSectionProps {
  calculationId: string;
}

const getInitials = (name: string) => (name || "A").split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase();

export function CommentSection({ calculationId }: CommentSectionProps) {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof commentSchema>>({
    resolver: zodResolver(commentSchema),
    defaultValues: { text: "" },
  });

  const commentsQuery = useMemoFirebase(() => {
    if (!firestore || !calculationId) return null;
    return query(
      collection(firestore, 'public_calculations', calculationId, 'comments'),
      orderBy('createdAt', 'asc')
    );
  }, [firestore, calculationId]);

  const { data: comments, isLoading: isLoadingComments } = useCollection<Comment>(commentsQuery);

  const onSubmit = async (values: z.infer<typeof commentSchema>) => {
    if (!user || !firestore) return;
    setIsSubmitting(true);

    const commentData = {
      userId: user.uid,
      userName: user.displayName || "Anonim",
      userPhotoURL: user.photoURL || "",
      text: values.text,
      createdAt: serverTimestamp(),
    };

    const commentsColRef = collection(firestore, 'public_calculations', calculationId, 'comments');
    addDocumentNonBlocking(commentsColRef, commentData);
    
    form.reset();
    setIsSubmitting(false);
  };

  const formatDate = (timestamp: Timestamp | null) => {
    if (!timestamp) return 'Baru saja';
    return formatDistanceToNow(timestamp.toDate(), { addSuffix: true, locale: id });
  };

  return (
    <div className="pt-6 border-t">
        <h3 className="text-lg font-headline mb-4 flex items-center gap-2">
            <MessageSquare className="h-5 w-5"/> Diskusi Komunitas
        </h3>
        <div className="space-y-4 max-h-64 overflow-y-auto pr-2">
            {isLoadingComments && <div className="flex justify-center py-4"><Loader2 className="h-6 w-6 animate-spin"/></div>}
            
            {comments && comments.length > 0 ? comments.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={comment.userPhotoURL} alt={comment.userName} />
                        <AvatarFallback className="text-xs">{getInitials(comment.userName)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 bg-muted/50 p-3 rounded-lg">
                        <div className="flex justify-between items-center">
                            <p className="font-semibold text-sm">{comment.userName}</p>
                            <p className="text-xs text-muted-foreground">{formatDate(comment.createdAt)}</p>
                        </div>
                        <p className="text-sm mt-1 whitespace-pre-wrap">{comment.text}</p>
                    </div>
                </div>
            )) : !isLoadingComments && (
                <p className="text-sm text-muted-foreground text-center py-4">Jadilah yang pertama berkomentar!</p>
            )}
        </div>

        {user ? (
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
                                <Textarea placeholder="Tulis komentarmu..." {...field} className="min-h-[40px]"/>
                            </FormControl>
                             <FormMessage />
                            </FormItem>
                        )}
                        />
                         <Button type="submit" size="sm" className="mt-2" disabled={isSubmitting}>
                            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin"/> : <Send className="h-4 w-4" />}
                            <span className="ml-2">Kirim</span>
                        </Button>
                    </div>
                </form>
            </Form>
        ) : !isUserLoading && (
            <div className="text-center text-sm text-muted-foreground mt-4 p-4 bg-muted/50 rounded-lg">
                <a href="/login" className="text-primary font-semibold hover:underline">Masuk</a> untuk ikut berdiskusi.
            </div>
        )}
    </div>
  );
}
