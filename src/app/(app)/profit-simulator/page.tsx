
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
import { Wand2, Sparkles, TrendingUp, Target, ArrowRight, ArrowLeftRight } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

// Schema for Price Simulator
const priceSimSchema = z.object({
  baseHpp: z.coerce.number().min(0, "HPP harus positif"),
  basePrice: z.coerce.number().min(0, "Harga Jual harus positif"),
  newHpp: z.coerce.number().min(0, "HPP Baru harus positif"),
  newPrice: z.coerce.number().min(0, "Harga Baru harus positif"),
});
type PriceSimFormData = z.infer<typeof priceSimSchema>;

// Schema for Target Profit Calculator
const targetProfitSchema = z.object({
  profitPerProduct: z.coerce.number().min(1, "Profit harus lebih dari 0"),
  profitTarget: z.coerce.number().min(1, "Target profit harus lebih dari 0"),
});
type TargetProfitFormData = z.infer<typeof targetProfitSchema>;


// Price Simulator Component
function PriceSimulator() {
    const form = useForm<PriceSimFormData>({
        resolver: zodResolver(priceSimSchema),
        defaultValues: { baseHpp: 50000, basePrice: 75000, newHpp: 50000, newPrice: 80000 },
    });
    
    const watchAllFields = form.watch();

    const baseProfit = watchAllFields.basePrice - watchAllFields.baseHpp;
    const baseMargin = watchAllFields.baseHpp > 0 ? (baseProfit / watchAllFields.baseHpp) * 100 : 0;
    
    const newProfit = watchAllFields.newPrice - watchAll_fields.newHpp;
    const newMargin = watchAll_fields.newHpp > 0 ? (newProfit / watchAll_fields.newHpp) * 100 : 0;
    
    const profitChange = newProfit - baseProfit;
    const marginChange = newMargin - baseMargin;

    return (
        <div className="w-full grid lg:grid-cols-2 gap-8 items-start">
            <div className="space-y-6">
                <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Data Saat Ini</CardTitle>
                </CardHeader>
                <CardContent className="grid sm:grid-cols-2 gap-4">
                    <div>
                        <Label>HPP per Produk</Label>
                        <Input type="number" placeholder="Rp" {...form.register("baseHpp")} />
                    </div>
                    <div>
                        <Label>Harga Jual per Produk</Label>
                        <Input type="number" placeholder="Rp" {...form.register("basePrice")} />
                    </div>
                </CardContent>
                </Card>

                <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Data Simulasi</CardTitle>
                </CardHeader>
                <CardContent className="grid sm:grid-cols-2 gap-4">
                    <div>
                        <Label>HPP Baru</Label>
                        <Input type="number" placeholder="Rp" {...form.register("newHpp")} />
                    </div>
                    <div>
                        <Label>Harga Jual Baru</Label>
                        <Input type="number" placeholder="Rp" {...form.register("newPrice")} />
                    </div>
                </CardContent>
                </Card>
            </div>
            
            <div className="sticky top-6">
                <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="font-headline text-2xl flex items-center gap-2">
                    <Sparkles className="text-primary" />
                    Hasil Simulasi
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex justify-around text-center">
                        <div>
                            <p className="text-sm text-muted-foreground">Profit Awal</p>
                            <p className="font-bold text-lg">{formatCurrency(baseProfit)}</p>
                            <p className="text-xs text-muted-foreground">({baseMargin.toFixed(1)}%)</p>
                        </div>
                        <div className="flex items-center text-muted-foreground">
                            <ArrowRight className="h-6 w-6"/>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Profit Baru</p>
                            <p className="font-bold text-lg">{formatCurrency(newProfit)}</p>
                            <p className="text-xs text-muted-foreground">({newMargin.toFixed(1)}%)</p>
                        </div>
                    </div>
                    <Separator/>
                    <div className="space-y-2">
                         <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                            <span className="font-bold text-lg flex items-center gap-2">
                                <ArrowLeftRight className="h-4 w-4"/>
                                Perubahan Profit
                            </span>
                            <span className={`font-extrabold text-2xl ${profitChange >= 0 ? 'text-green-500' : 'text-destructive'}`}>
                                {profitChange >= 0 ? '+' : ''}{formatCurrency(profitChange)}
                            </span>
                        </div>
                         <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Perubahan Margin</span>
                            <span className={`font-semibold ${marginChange >= 0 ? 'text-green-500' : 'text-destructive'}`}>
                                {marginChange >= 0 ? '+' : ''}{marginChange.toFixed(1)}%
                            </span>
                        </div>
                    </div>
                </CardContent>
                </Card>
            </div>
        </div>
    )
}

// Target Profit Calculator Component
function TargetProfitCalculator() {
  const [result, setResult] = useState<{ unitsToSell: number } | null>(null);

  const form = useForm<TargetProfitFormData>({
    resolver: zodResolver(targetProfitSchema),
    defaultValues: { profitPerProduct: 25000, profitTarget: 5000000 },
  });

  const calculate = (data: TargetProfitFormData) => {
    const unitsToSell = Math.ceil(data.profitTarget / data.profitPerProduct);
    setResult({ unitsToSell });
  };
  const handleCalculate = form.handleSubmit(calculate);

  return (
    <div className="w-full grid lg:grid-cols-2 gap-8">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">
              Kalkulator Target Profit
            </CardTitle>
            <CardDescription>
              Hitung berapa banyak produk yang perlu kamu jual untuk mencapai target keuntungan.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Profit per Produk</Label>
              <Input
                type="number"
                placeholder="Rp"
                {...form.register("profitPerProduct")}
              />
               <p className="text-xs text-muted-foreground mt-1">Harga Jual - HPP</p>
            </div>
            <div>
              <Label>Target Keuntungan yang Diinginkan</Label>
              <Input
                type="number"
                placeholder="Rp"
                {...form.register("profitTarget")}
              />
            </div>
          </CardContent>
        </Card>
        <Button
          type="button"
          onClick={handleCalculate}
          className="w-full font-bold bg-accent hover:bg-accent/90 text-accent-foreground text-lg py-6"
        >
          <Wand2 className="mr-2 h-5 w-5" /> Hitung Target
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
                <div className="text-center">
                  <p className="text-muted-foreground">Untuk mencapai profit</p>
                  <p className="font-bold text-2xl text-primary">{formatCurrency(form.getValues("profitTarget"))}</p>
                </div>
                 <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <p className="text-muted-foreground">Kamu perlu menjual</p>
                  <p className="font-extrabold text-5xl my-2">
                    {result.unitsToSell.toLocaleString('id-ID')}
                  </p>
                  <p className="text-muted-foreground">produk</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-20 text-muted-foreground">
                <p>Hasil perhitungan target akan muncul di sini.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Main Page Component
export default function ProfitSimulatorPage() {
  return (
    <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
      <div className="flex items-center gap-2">
        <Wand2 className="h-6 w-6"/>
        <h1 className="text-lg font-semibold md:text-2xl font-headline">
          Simulator Keuntungan
        </h1>
      </div>
      <p className="text-muted-foreground">Buat keputusan bisnis yang lebih cerdas dengan menganalisis berbagai skenario.</p>

      <Tabs defaultValue="price-sim" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-lg mx-auto">
          <TabsTrigger value="price-sim">
            <TrendingUp className="mr-2 h-4 w-4" />
            Simulasi Harga & Biaya
          </TabsTrigger>
          <TabsTrigger value="target-profit">
            <Target className="mr-2 h-4 w-4" />
            Kalkulator Target Profit
          </TabsTrigger>
        </TabsList>
        <TabsContent value="price-sim">
          <div className="flex flex-1 rounded-lg border border-dashed shadow-sm p-4 lg:p-6 mt-4">
            <PriceSimulator />
          </div>
        </TabsContent>
        <TabsContent value="target-profit">
          <div className="flex flex-1 rounded-lg border border-dashed shadow-sm p-4 lg:p-6 mt-4">
            <TargetProfitCalculator />
          </div>
        </TabsContent>
      </Tabs>
    </main>
  );
}
