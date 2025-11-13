
"use client";

import { useState, useRef, ChangeEvent } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Paperclip, Loader2, Calculator } from "lucide-react";
import { ShareCalculationDialog } from "./ShareCalculationDialog";
import type { Calculation } from "../dashboard/CalculationHistory";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  text: z.string(),
});

interface AIChatInputProps {
  onSendMessage: (text?: string, imageUrl?: string, calculation?: Calculation) => void;
}

export function AIChatInput({ onSendMessage }: AIChatInputProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isShareCalcOpen, setIsShareCalcOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { text: "" },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!values.text.trim()) return;
    onSendMessage(values.text);
    form.reset();
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (e.g., 4MB limit for Gemini)
    if (file.size > 4 * 1024 * 1024) {
        toast({
            title: "File Terlalu Besar",
            description: "Ukuran file maksimal adalah 4MB.",
            variant: "destructive",
        });
        return;
    }

    setIsUploading(true);
    
    // Convert file to data URI
    try {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onloadend = () => {
            const dataUrl = reader.result as string;
            onSendMessage(undefined, dataUrl);
            setIsUploading(false);
        };
        reader.onerror = (error) => {
            console.error("File reading failed", error);
            toast({ title: "Gagal Membaca File", description: "Tidak bisa membaca file yang dipilih.", variant: "destructive" });
            setIsUploading(false);
        }
    } catch (error) {
        console.error("File processing failed", error);
        toast({ title: "Gagal Memproses File", description: "Terjadi kesalahan saat memproses file.", variant: "destructive" });
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
