
"use client";

import { useState, useRef, ChangeEvent } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useUser, useStorage } from "@/firebase";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Paperclip, Loader2, Calculator } from "lucide-react";
import { uploadFile } from "@/firebase/storage";
import { ShareCalculationDialog } from "./ShareCalculationDialog";
import type { Calculation } from "../dashboard/CalculationHistory";

const formSchema = z.object({
  text: z.string(),
});

interface ChatInputProps {
  onSendMessage: (text?: string, imageUrl?: string, calculation?: Calculation) => void;
}

export function ChatInput({ onSendMessage }: ChatInputProps) {
  const { user } = useUser();
  const storage = useStorage();
  const [isUploading, setIsUploading] = useState(false);
  const [isShareCalcOpen, setIsShareCalcOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { text: "" },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!values.text) return;
    onSendMessage(values.text);
    form.reset();
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    if (!storage || !user) return;

    setIsUploading(true);
    const file = e.target.files[0];
    const filePath = `chat-files/ai_coach/${user.uid}/${Date.now()}-${file.name}`;
    
    try {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const dataUrl = reader.result as string;
            onSendMessage(undefined, dataUrl);
        };
    } catch (error) {
        console.error("File upload failed", error);
    } finally {
        setIsUploading(false);
    }
  };
  
  const handleShareCalculation = (calculation: Calculation) => {
    onSendMessage(undefined, undefined, calculation);
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
          placeholder="Ketik pesanmu atau unggah file..."
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
