
"use client";

import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useUser, useFirestore, useStorage, addDocumentNonBlocking } from "@/firebase";
import { collection, serverTimestamp } from "firebase/firestore";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Paperclip, Loader2, Calculator } from "lucide-react";
import { uploadFile } from "@/firebase/storage";
import { ShareCalculationDialog } from "./ShareCalculationDialog";

const formSchema = z.object({
  text: z.string().min(1, "Pesan tidak boleh kosong."),
});

interface ChatInputProps {
  conversationId: string;
}

export function ChatInput({ conversationId }: ChatInputProps) {
  const { user } = useUser();
  const firestore = useFirestore();
  const storage = useStorage();
  const [isUploading, setIsUploading] = useState(false);
  const [isShareCalcOpen, setIsShareCalcOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { text: "" },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!user || !firestore) return;
    
    const messageData = {
      senderId: user.uid,
      type: 'text' as const,
      text: values.text,
      createdAt: serverTimestamp(),
    };
    
    const messagesColRef = collection(firestore, 'chat_sessions', conversationId, 'messages');
    addDocumentNonBlocking(messagesColRef, messageData);

    form.reset();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    if (!storage || !user) return;

    setIsUploading(true);
    const file = e.target.files[0];
    const filePath = `chat-files/${conversationId}/${user.uid}/${Date.now()}-${file.name}`;
    
    try {
        const downloadURL = await uploadFile(storage, filePath, file, () => {}); // Progress not shown here for simplicity
        
        const messageData = {
            senderId: user.uid,
            type: 'image' as const,
            mediaUrl: downloadURL,
            mediaName: file.name,
            createdAt: serverTimestamp(),
        };
        const messagesColRef = collection(firestore, 'chat_sessions', conversationId, 'messages');
        addDocumentNonBlocking(messagesColRef, messageData);

    } catch (error) {
        console.error("File upload failed", error);
    } finally {
        setIsUploading(false);
    }
  };
  
  const handleShareCalculation = (calculationId: string, calculationName: string) => {
    if (!user || !firestore) return;
    
    const messageData = {
      senderId: user.uid,
      type: 'calculation' as const,
      calculationId: calculationId,
      createdAt: serverTimestamp(),
      text: `Membagikan perhitungan: ${calculationName}` // Add text for context
    };
    
    const messagesColRef = collection(firestore, 'chat_sessions', conversationId, 'messages');
    addDocumentNonBlocking(messagesColRef, messageData);
    setIsShareCalcOpen(false);
  };

  return (
    <>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex items-center gap-2">
        <Button type="button" variant="ghost" size="icon" onClick={() => setIsShareCalcOpen(true)}>
            <Calculator className="h-5 w-5" />
        </Button>
        <Button type="button" variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
          {isUploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Paperclip className="h-5 w-5" />}
        </Button>
        <Input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept="image/png, image/jpeg, image/gif, image/webp"
        />
        <Input
          {...form.register("text")}
          placeholder="Ketik pesanmu..."
          autoComplete="off"
        />
        <Button type="submit" size="icon">
          <Send className="h-5 w-5" />
        </Button>
      </form>
      <ShareCalculationDialog
        isOpen={isShareCalcOpen}
        onOpenChange={setIsShareCalcOpen}
        onShare={handleShareCalculation}
      />
    </>
  );
}
