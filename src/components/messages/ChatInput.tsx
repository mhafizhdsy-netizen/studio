
"use client";

import { useState, useRef, ChangeEvent } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useUser } from "@/firebase";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Paperclip, Loader2, Calculator } from "lucide-react";
import { supabase, uploadFileToSupabase } from "@/lib/supabase";
import { ShareCalculationDialog } from "./ShareCalculationDialog";
import type { Calculation } from "../dashboard/CalculationHistory";
import { moderateImage } from "@/ai/flows/image-moderation-flow";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  text: z.string(),
});

interface ChatInputProps {
  onSendMessage: (text?: string, imageUrl?: string, calculation?: Calculation) => void;
  disabled?: boolean;
}

const fileToDataUri = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

export function ChatInput({ onSendMessage, disabled }: ChatInputProps) {
  const { user } = useUser();
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [isShareCalcOpen, setIsShareCalcOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { text: "" },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!values.text || disabled) return;
    onSendMessage(values.text);
    form.reset();
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || disabled) return;
    if (!supabase || !user) return;

    setIsUploading(true);
    const file = e.target.files[0];
    
    // Moderate image before upload
    const imageDataUri = await fileToDataUri(file);
    const moderationResult = await moderateImage({ imageDataUri });

    if (!moderationResult.isSafe) {
        toast({
            title: "Gambar Tidak Sesuai",
            description: moderationResult.reason || "Gambar yang Anda kirim melanggar pedoman komunitas.",
            variant: "destructive",
        });
        setIsUploading(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        return;
    }

    const fileExtension = file.name.split('.').pop();
    const randomFileName = `${Math.random().toString(36).substring(2)}.${fileExtension}`;
    const filePath = `public/chat-files/anonymous_chat/${user.uid}/${Date.now()}-${randomFileName}`;
    
    try {
        const downloadUrl = await uploadFileToSupabase(file, 'user-assets', filePath);
        onSendMessage(undefined, downloadUrl);
    } catch (error) {
        console.error("File upload failed", error);
        toast({
            title: "Gagal Mengunggah",
            description: "Gagal mengunggah gambar. Coba lagi nanti.",
            variant: "destructive",
        });
    } finally {
        setIsUploading(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
    }
  };
  
  const handleShareCalculation = (calculation: Calculation) => {
    onSendMessage(undefined, undefined, calculation);
    setIsShareCalcOpen(false);
  };

  return (
    <>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex items-center gap-2">
        <Button type="button" variant="ghost" size="icon" onClick={() => setIsShareCalcOpen(true)} disabled={disabled}>
            <Calculator className="h-5 w-5" />
        </Button>
        <Button type="button" variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()} disabled={isUploading || disabled || !supabase}>
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
          placeholder={disabled ? "Menunggu teman ngobrol..." : "Ketik pesanmu..."}
          autoComplete="off"
          disabled={disabled}
        />
        <Button type="submit" size="icon" disabled={disabled}>
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
