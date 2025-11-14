
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DollarSign, Wand2, Sparkles, Percent } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

// Schema for Ideal Price Calculator
const idealPriceSchema = z.object({
  totalCost: z.coerce.number().min(0, "Biaya harus positif"),
  profitMargin: z.coerce
    .number()
    .min(0, "Margin harus positif")
    .max(1000, "Margin terlalu besar"),
});
type IdealPriceFormData = z.infer<typeof idealPriceSchema>;

// Schema for Pre-VAT Price Calculator
const preVatPriceSchema = z.object({
  finalPrice: z.coerce.number().min(0, "Harga harus positif"),
  vatRate: z.coerce
    .number()
    .min(0, "Tarif PPN harus positif")
    .max(100, "Tarif PPN tidak boleh > 100%"),
});
type PreVatPriceFormData = z.infer<typeof preVatPriceSchema>;

// Ideal Price Calculator Component
function IdealPriceCalculator() {
  const [result, setResult] = useState<{
    suggestedPrice: number;
    profit: number;
  } | null>(null);

  const form = useForm<IdealPriceFormData>({
    resolver: zodResolver(idealPriceSchema),
    defaultValues: { totalCost: 0, profitMargin: 30 },
  });

  const calculate = (data: IdealPriceFormData) => {
    const profit = data.totalCost * (data.profitMargin / 100);
    const suggestedPrice = data.totalCost + profit;
    setResult({ suggestedPrice, profit });
  };

  const handleCalculate = form.handleSubmit(calculate);

  return (
    <div className="w-full grid lg:grid-cols-2 gap-8">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">
              Kalkulator Harga Jual Ideal
            </CardTitle>
            <CardDescription>
              Tentukan harga jual berdasarkan total biaya dan target keuntungan.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Total Biaya Produksi (HPP) per Produk</Label>
              <Input
                type="number"
                placeholder="Rp"
                {...form.register("totalCost")}
              />
            </div>
            <div>
              <Label>Target Margin Profit (%)</Label>
              <Input
                type="number"
                placeholder="cth: 30"
                {...form.register("profitMargin")}
              />
            </div>
          </CardContent>
        </Card>
        <Button
          type="button"
          onClick={handleCalculate}
          className="w-full font-bold bg-accent hover:bg-accent/90 text-accent-foreground text-lg py-6"
        >
          <Wand2 className="mr-2 h-5 w-5" /> Hitung Harga Jual
        </Button>
      </div>

      <div className="sticky top-6">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline text-2xl flex items-center gap-2">
              <Sparkles className="text-primary" />
              Hasil
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {result ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="text-muted-foreground">Keuntungan</span>
                  <span className="font-semibold text-green-500">
                    {formatCurrency(result.profit)}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-primary/10 rounded-lg">
                  <span className="text-primary font-bold text-lg">
                    Harga Jual Ideal
                  </span>
                  <span className="font-extrabold text-2xl text-primary">
                    {formatCurrency(result.suggestedPrice)}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-center py-20 text-muted-foreground">
                <p>Hasil perhitungan akan muncul di sini.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Pre-VAT Price Calculator Component
function PreVatPriceCalculator() {
  const [result, setResult] = useState<{
    basePrice: number;
    vatAmount: number;
  } | null>(null);

  const form = useForm<PreVatPriceFormData>({
    resolver: zodResolver(preVatPriceSchema),
    defaultValues: { finalPrice: 0, vatRate: 11 }, // Default PPN 11%
  });

  const calculate = (data: PreVatPriceFormData) => {
    const basePrice = data.finalPrice / (1 + data.vatRate / 100);
    const vatAmount = data.finalPrice - basePrice;
    setResult({ basePrice, vatAmount });
  };

  const handleCalculate = form.handleSubmit(calculate);

  return (
    <div className="w-full grid lg:grid-cols-2 gap-8">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">
              Kalkulator Harga Dasar (Sebelum PPN)
            </CardTitle>
            <CardDescription>
              Hitung harga asli produk sebelum ditambah PPN (Pajak Pertambahan
              Nilai).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Harga Jual Akhir (Termasuk PPN)</Label>
              <Input
                type="number"
                placeholder="Rp"
                {...form.register("finalPrice")}
              />
            </div>
            <div>
              <Label>Tarif PPN (%)</Label>
              <Input
                type="number"
                placeholder="cth: 11"
                {...form.register("vatRate")}
              />
            </div>
          </CardContent>
        </Card>
        <Button
          type="button"
          onClick={handleCalculate}
          className="w-full font-bold bg-accent hover:bg-accent/90 text-accent-foreground text-lg py-6"
        >
          <Wand2 className="mr-2 h-5 w-5" /> Hitung Harga Dasar
        </Button>
      </div>

      <div className="sticky top-6">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline text-2xl flex items-center gap-2">
              <Sparkles className="text-primary" />
              Hasil
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {result ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="text-muted-foreground">Nilai PPN</span>
                  <span className="font-semibold">
                    {formatCurrency(result.vatAmount)}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-primary/10 rounded-lg">
                  <span className="text-primary font-bold text-lg">
                    Harga Dasar (Sebelum PPN)
                  </span>
                  <span className="font-extrabold text-2xl text-primary">
                    {formatCurrency(result.basePrice)}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-center py-20 text-muted-foreground">
                <p>Hasil perhitungan akan muncul di sini.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Main Page Component
export default function IdealPriceCalculatorPage() {
  return (
    <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
      <div className="mx-auto w-full max-w-7xl">
        <div className="flex items-center">
          <h1 className="text-lg font-semibold md:text-2xl font-headline">
            Kalkulator Harga Jual
          </h1>
        </div>

        <Tabs defaultValue="ideal-price" className="w-full mt-4">
          <TabsList className="grid w-full grid-cols-2 max-w-lg mx-auto">
            <TabsTrigger value="ideal-price">
              <DollarSign className="mr-2 h-4 w-4" />
              Harga Jual Ideal
            </TabsTrigger>
            <TabsTrigger value="pre-vat">
              <Percent className="mr-2 h-4 w-4" />
              Harga Dasar (Sebelum PPN)
            </TabsTrigger>
          </TabsList>
          <TabsContent value="ideal-price">
            <div className="flex flex-1 rounded-lg border border-dashed shadow-sm p-4 lg:p-6 mt-4">
              <IdealPriceCalculator />
            </div>
          </TabsContent>
          <TabsContent value="pre-vat">
            <div className="flex flex-1 rounded-lg border border-dashed shadow-sm p-4 lg:p-6 mt-4">
              <PreVatPriceCalculator />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
