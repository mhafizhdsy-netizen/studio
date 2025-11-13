
"use client";

import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";

const formSchema = z.object({
  text: z.string(),
});

interface AIChatInputProps {
  onSendMessage: (text: string) => void;
}

export function AIChatInput({ onSendMessage }: AIChatInputProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { text: "" },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!values.text.trim()) return;
    onSendMessage(values.text);
    form.reset();
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="flex items-center gap-2">
      <Input
        {...form.register("text")}
        placeholder="Ketik pesanmu..."
        autoComplete="off"
      />
      <Button type="submit" size="icon">
        <Send className="h-5 w-5" />
      </Button>
    </form>
  );
}
