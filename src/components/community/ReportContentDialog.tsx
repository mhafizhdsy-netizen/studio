
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
  } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";

interface ReportContentDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  calculationId: string;
  reporterUserId: string;
  reportedUserId: string;
}

const reportSchema = z.object({
    category: z.string({ required_error: "Kategori laporan harus dipilih." }),
    reason: z.string().min(10, "Alasan harus diisi minimal 10 karakter.").max(500, "Alasan terlalu panjang."),
});

type ReportFormData = z.infer<typeof reportSchema>;

export function ReportContentDialog({
  isOpen,
  onOpenChange,
  calculationId,
  reporterUserId,
  reportedUserId,
}: ReportContentDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<ReportFormData>({
    resolver: zodResolver(reportSchema),
    defaultValues: { reason: "" },
  });
  
  const onSubmit = async (values: ReportFormData) => {
    setIsSubmitting(true);
    const { error } = await supabase.from('reports').insert({
        calculationId,
        reporterUserId,
        reportedUserId,
        category: values.category,
        reason: values.reason,
    });

    if (error) {
        console.error("Error submitting report:", error);
        toast({
            title: "Gagal Mengirim Laporan",
            description: "Terjadi kesalahan. Silakan coba lagi.",
            variant: "destructive",
        });
    } else {
        toast({
            title: "Laporan Terkirim",
            description: "Terima kasih atas masukanmu. Tim kami akan segera meninjau laporan ini.",
        });
        form.reset();
        onOpenChange(false);
    }
    setIsSubmitting(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Laporkan Konten</DialogTitle>
          <DialogDescription>
            Bantu kami menjaga komunitas tetap aman dan positif. Pilih kategori dan berikan alasan kenapa konten ini perlu dilaporkan.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Kategori Pelanggaran</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Pilih kategori laporan" />
                                </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="Konten Seksual">Konten Seksual/Pornografi</SelectItem>
                                    <SelectItem value="Ujaran Kebencian">Ujaran Kebencian</SelectItem>
                                    <SelectItem value="Kekerasan">Kekerasan</SelectItem>
                                    <SelectItem value="Spam">Spam/Menyesatkan</SelectItem>
                                    <SelectItem value="Pelanggaran Hak Cipta">Pelanggaran Hak Cipta</SelectItem>
                                    <SelectItem value="Lainnya">Lainnya</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="reason"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Alasan</FormLabel>
                            <FormControl>
                                <Textarea placeholder="Jelaskan secara singkat kenapa konten ini tidak pantas..." {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <DialogFooter>
                    <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={isSubmitting}>Batal</Button>
                    <Button type="submit" disabled={isSubmitting}>
                         {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Kirim Laporan
                    </Button>
                </DialogFooter>
            </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

