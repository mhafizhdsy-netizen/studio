"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useUser } from "@/firebase";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
  } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, PlusCircle, CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const expenseSchema = z.object({
  name: z.string().min(1, "Nama pengeluaran tidak boleh kosong."),
  amount: z.coerce.number().min(1, "Jumlah harus lebih dari 0."),
  category: z.string({ required_error: "Pilih kategori."}),
  date: z.date({ required_error: "Tanggal tidak boleh kosong." }),
});

type ExpenseFormData = z.infer<typeof expenseSchema>;

interface ExpenseFormProps {
    onFormSubmit: () => void;
}

export function ExpenseForm({ onFormSubmit }: ExpenseFormProps) {
  const { toast } = useToast();
  const { user } = useUser();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      name: "",
      amount: "" as any,
      date: new Date(),
    },
  });

  async function onSubmit(values: ExpenseFormData) {
    if (!user || !supabase) return;

    setIsLoading(true);
    const expenseData = {
      ...values,
      userId: user.uid,
      date: values.date.toISOString(), // Convert date to ISO string for Supabase
    };

    const { error } = await supabase.from('expenses').insert(expenseData);
    
    if (error) {
        console.error("Error creating expense:", error);
        toast({
          title: "Gagal!",
          description: "Gagal mencatat pengeluaran. Coba lagi.",
          variant: "destructive"
        });
    } else {
        toast({
          title: "Sukses!",
          description: "Pengeluaran berhasil dicatat.",
        });
        form.reset();
        form.setValue('date', new Date());
        onFormSubmit(); // Callback to trigger list refresh
    }
    
    setIsLoading(false);
  }

  return (
    <Card>
        <CardHeader>
            <CardTitle className="font-headline text-lg">Tambah Pengeluaran Baru</CardTitle>
        </CardHeader>
        <CardContent>
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Nama Pengeluaran</FormLabel>
                    <FormControl>
                        <Input placeholder="cth: Bayar listrik bulan Mei" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Jumlah (Rp)</FormLabel>
                    <FormControl>
                        <Input type="number" placeholder="500000" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                     <FormItem>
                        <FormLabel>Kategori</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Pilih kategori pengeluaran" />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectItem value="Sewa Tempat">Sewa Tempat</SelectItem>
                                <SelectItem value="Listrik & Air">Listrik & Air</SelectItem>
                                <SelectItem value="Gaji Karyawan">Gaji Karyawan</SelectItem>
                                <SelectItem value="Biaya Pengemasan">Biaya Pengemasan</SelectItem>
                                <SelectItem value="Pemasaran">Pemasaran</SelectItem>
                                <SelectItem value="Lainnya">Lainnya</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )}
                />

                <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                    <FormItem className="flex flex-col">
                    <FormLabel>Tanggal Pengeluaran</FormLabel>
                    <Popover>
                        <PopoverTrigger asChild>
                        <FormControl>
                            <Button
                            variant={"outline"}
                            className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                            )}
                            >
                            {field.value ? (
                                format(field.value, "PPP")
                            ) : (
                                <span>Pilih tanggal</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                        </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                                date > new Date() || date < new Date("1900-01-01")
                            }
                            initialFocus
                        />
                        </PopoverContent>
                    </Popover>
                    <FormMessage />
                    </FormItem>
                )}
                />
                
                <Button type="submit" className="w-full font-bold" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
                Catat Pengeluaran
                </Button>
            </form>
            </Form>
        </CardContent>
    </Card>
  );
}