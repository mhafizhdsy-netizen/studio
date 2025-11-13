
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Wand2, Sparkles, AlertTriangle } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { CostPieChart } from "./CostPieChart";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";

const formSchema = z.object({
  totalMaterialCost: z.coerce.number().min(0, "Biaya harus positif"),
  laborCost: z.coerce.number().min(0, "Biaya harus positif"),
  packaging: z.coerce.number().min(0, "Biaya harus positif"),
  margin: z.coerce.number().min(0, "Margin harus positif").max(1000, "Margin terlalu besar"),
});

type FormData = z.infer<typeof formSchema>;

interface QuickResult {
  totalHPP: number;
  profit: number;
  suggestedPrice: number;
  pieChartData: { name: string; value: number; fill: string }[];
}

export function QuickCalculatorForm() {
  const [result, setResult] = useState<QuickResult | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      totalMaterialCost: 0,
      laborCost: 0,
      packaging: 0,
      margin: 30,
    },
  });

  const calculate = (data: FormData) => {
    const totalHPP = data.totalMaterialCost + data.laborCost + data.packaging;
    const profit = totalHPP * (data.margin / 100);
    const suggestedPrice = totalHPP + profit;

    const pieChartData = [
      { name: "Bahan Baku", value: data.totalMaterialCost, fill: "hsl(var(--chart-1))" },
      { name: "Tenaga Kerja", value: data.laborCost, fill: "hsl(var(--chart-2))" },
      { name: "Kemasan", value: data.packaging, fill: "hsl(var(--chart-4))" },
    ].filter(item => item.value > 0);

    setResult({ totalHPP, profit, suggestedPrice, pieChartData });
  };
  
  const handleCalculate = form.handleSubmit(calculate);

  return (
    <div className="w-full">
      <div className="w-full grid lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline">Mode Cepat</CardTitle>
              <CardDescription>Masukkan total biaya untuk estimasi HPP cepat. Mode ini tidak menghitung biaya overhead.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Total Biaya Bahan Baku (per produk)</Label>
                <Input type="number" placeholder="Rp" {...form.register("totalMaterialCost")} />
                 {form.formState.errors.totalMaterialCost && <p className="text-sm text-destructive mt-1">{form.formState.errors.totalMaterialCost.message}</p>}
              </div>
              <div>
                <Label>Biaya Tenaga Kerja (per produk)</Label>
                <Input type="number" placeholder="Rp" {...form.register("laborCost")} />
                {form.formState.errors.laborCost && <p className="text-sm text-destructive mt-1">{form.formState.errors.laborCost.message}</p>}
              </div>
              <div>
                <Label>Biaya Kemasan & Distribusi (per produk)</Label>
                <Input type="number" placeholder="Rp" {...form.register("packaging")} />
                 {form.formState.errors.packaging && <p className="text-sm text-destructive mt-1">{form.formState.errors.packaging.message}</p>}
              </div>
              <div>
                <Label>Margin Profit (%)</Label>
                <Input type="number" placeholder="cth: 30" {...form.register("margin")} />
                {form.formState.errors.margin && <p className="text-sm text-destructive mt-1">{form.formState.errors.margin.message}</p>}
              </div>
            </CardContent>
          </Card>
          
          <Button type="button" onClick={handleCalculate} className="w-full font-bold bg-accent hover:bg-accent/90 text-accent-foreground text-lg py-6">
              <Wand2 className="mr-2 h-5 w-5" /> Hitung HPP
          </Button>
        </div>

        <div className="sticky top-6 space-y-6">
          <Card className="shadow-lg">
              <CardHeader>
                  <CardTitle className="font-headline text-2xl flex items-center gap-2"><Sparkles className="text-primary"/>Hasil Perhitungan Cepat</CardTitle>
                  <CardDescription>Ini dia estimasi HPP dan saran harga jual untuk produkmu.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
              {result ? (
                  <>
                      <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Perhatian</AlertTitle>
                        <AlertDescription>
                            Hasil ini adalah estimasi karena tidak termasuk biaya overhead. Gunakan Mode Rinci untuk perhitungan yang lebih akurat.
                        </AlertDescription>
                      </Alert>
                      <div className="h-64">
                         <CostPieChart data={result.pieChartData} />
                      </div>
                      <div className="space-y-4">
                          <div className="flex justify-between items-center border-b pb-2">
                              <span className="text-muted-foreground">Estimasi HPP per Produk</span>
                              <span className="font-bold text-xl">{formatCurrency(result.totalHPP)}</span>
                          </div>
                          <div className="flex justify-between items-center border-b pb-2">
                              <span className="text-muted-foreground">Profit ({form.getValues("margin")}%)</span>
                              <span className="font-semibold text-green-500">{formatCurrency(result.profit)}</span>
                          </div>
                          <div className="flex justify-between items-center p-3 bg-primary/10 rounded-lg print-bg-primary-10">
                              <span className="text-primary font-bold text-lg">Saran Harga Jual</span>
                              <span className="font-extrabold text-2xl text-primary">{formatCurrency(result.suggestedPrice)}</span>
                          </div>
                      </div>
                  </>
              ) : (
                  <div className="text-center py-20 text-muted-foreground">
                      <p>Hasil perhitungan cepatmu akan muncul di sini.</p>
                  </div>
              )}
              </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
