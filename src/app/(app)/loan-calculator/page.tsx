
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Landmark, Sparkles } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

const loanSchema = z.object({
  amount: z.coerce.number().min(100000, "Jumlah pinjaman minimal Rp 100.000"),
  rate: z.coerce.number().min(0.1, "Suku bunga harus positif").max(100, "Suku bunga tidak realistis"),
  term: z.coerce.number().min(1, "Tenor minimal 1 bulan").max(360, "Tenor maksimal 30 tahun (360 bulan)"),
});
type LoanFormData = z.infer<typeof loanSchema>;

interface LoanResult {
    monthlyPayment: number;
    totalPayment: number;
    totalInterest: number;
}

export default function LoanCalculatorPage() {
  const [result, setResult] = useState<LoanResult | null>(null);

  const form = useForm<LoanFormData>({
    resolver: zodResolver(loanSchema),
    defaultValues: {
      amount: 10000000,
      rate: 10,
      term: 12,
    },
  });

  const calculate = (data: LoanFormData) => {
    const principal = data.amount;
    const monthlyRate = data.rate / 100 / 12;
    const numberOfPayments = data.term;
    
    if (monthlyRate === 0) { // Handle case with 0% interest
      const monthlyPayment = principal / numberOfPayments;
      setResult({
        monthlyPayment: monthlyPayment,
        totalPayment: principal,
        totalInterest: 0,
      });
      return;
    }

    const x = Math.pow(1 + monthlyRate, numberOfPayments);
    const monthlyPayment = (principal * x * monthlyRate) / (x - 1);
    const totalPayment = monthlyPayment * numberOfPayments;
    const totalInterest = totalPayment - principal;

    setResult({ monthlyPayment, totalPayment, totalInterest });
  };
  
  const handleCalculate = form.handleSubmit(calculate);

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
      <div className="flex items-center gap-2">
        <Landmark className="h-6 w-6" />
        <h1 className="text-lg font-semibold md:text-2xl font-headline">
          Kalkulator Pinjaman Usaha
        </h1>
      </div>
      <p className="text-muted-foreground">
        Simulasikan cicilan pinjaman modal usahamu untuk perencanaan keuangan yang lebih matang.
      </p>

      <div className="flex flex-1 rounded-lg border border-dashed shadow-sm p-4 lg:p-6 mt-4">
        <div className="w-full grid lg:grid-cols-2 gap-8 items-start">
            <div className="space-y-6">
                <Card className="border-solid">
                    <CardHeader>
                        <CardTitle className="font-headline">Detail Pinjaman</CardTitle>
                        <CardDescription>
                        Masukkan detail pinjaman yang ingin Anda simulasikan.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                        <Label>Jumlah Pinjaman (Rp)</Label>
                        <Input
                            type="number"
                            placeholder="10000000"
                            {...form.register("amount")}
                        />
                        {form.formState.errors.amount && <p className="text-sm text-destructive mt-1">{form.formState.errors.amount.message}</p>}
                        </div>
                        <div>
                        <Label>Suku Bunga Tahunan (%)</Label>
                        <Input
                            type="number"
                            step="0.1"
                            placeholder="10"
                            {...form.register("rate")}
                        />
                        {form.formState.errors.rate && <p className="text-sm text-destructive mt-1">{form.formState.errors.rate.message}</p>}
                        </div>
                         <div>
                        <Label>Tenor Pinjaman (Bulan)</Label>
                        <Input
                            type="number"
                            placeholder="12"
                            {...form.register("term")}
                        />
                        {form.formState.errors.term && <p className="text-sm text-destructive mt-1">{form.formState.errors.term.message}</p>}
                        </div>
                    </CardContent>
                </Card>
                 <Button
                    type="button"
                    onClick={handleCalculate}
                    className="w-full font-bold text-lg py-6"
                    >
                    Hitung Simulasi
                </Button>
            </div>
             <div className="sticky top-6">
                <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="font-headline text-2xl flex items-center gap-2">
                    <Sparkles className="text-primary" />
                    Hasil Simulasi
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {result ? (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center border-b pb-2">
                            <span className="text-muted-foreground">Total Bunga</span>
                            <span className="font-semibold">
                                {formatCurrency(result.totalInterest)}
                            </span>
                        </div>
                         <div className="flex justify-between items-center border-b pb-2">
                            <span className="text-muted-foreground">Total Pembayaran</span>
                            <span className="font-semibold">
                                {formatCurrency(result.totalPayment)}
                            </span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-primary/10 rounded-lg">
                        <span className="text-primary font-bold text-lg">
                            Cicilan per Bulan
                        </span>
                        <span className="font-extrabold text-2xl text-primary">
                            {formatCurrency(result.monthlyPayment)}
                        </span>
                        </div>
                    </div>
                    ) : (
                    <div className="text-center py-20 text-muted-foreground">
                        <p>Hasil simulasi cicilan akan muncul di sini.</p>
                    </div>
                    )}
                </CardContent>
                </Card>
            </div>
        </div>
      </div>
    </main>
  );
}
