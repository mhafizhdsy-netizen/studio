
"use client";

import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Sparkle } from "lucide-react";

const formSchema = z.object({
  text: z.string().min(1, "Pesan tidak boleh kosong"),
});

interface AIChatInputProps {
  onSendMessage: (text: string) => void;
  disabled?: boolean;
}

export function AIChatInput({ onSendMessage, disabled }: AIChatInputProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { text: "" },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    onSendMessage(values.text);
    form.reset();
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="flex items-center gap-2">
      <div className="relative w-full">
          <Sparkle className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            {...form.register("text")}
            placeholder={disabled ? "AI sedang berpikir..." : "Tanya apa saja seputar bisnismu..."}
            autoComplete="off"
            disabled={disabled}
            className="pl-9"
          />
      </div>
      <Button type="submit" size="icon" disabled={disabled}>
        <Send className="h-5 w-5" />
      </Button>
    </form>
  );
}
