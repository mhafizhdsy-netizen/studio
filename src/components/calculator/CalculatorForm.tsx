"use client";

import { useState, useEffect } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/hooks/use-auth";
import { addCalculation, updateCalculation, addPublicCalculation } from "@/lib/firebase/firestore";
import type { Calculation } from "@/lib/firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Trash2, PlusCircle, Loader2, Share2, Sparkles, Wand2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/lib/utils";
import { CostPieChart } from "./CostPieChart";
import { Switch } from "@/components/ui/switch";

const materialSchema = z.object({
  name: z.string().min(1, "Nama bahan tidak boleh kosong"),
  cost: z.coerce.number().min(0, "Biaya harus positif"),
  qty: z.coerce.number().min(1, "Jumlah minimal 1"),
});

const formSchema = z.object({
  productName: z.string().min(1, "Nama produk tidak boleh kosong"),
  materials: z.array(materialSchema).min(1, "Minimal ada 1 bahan baku"),
  laborCost: z.coerce.number().min(0, "Biaya harus positif"),
  overhead: z.coerce.number().min(0, "Biaya harus positif"),
  packaging: z.coerce.number().min(0, "Biaya harus positif"),
  margin: z.coerce.number().min(0, "Margin harus positif").max(1000, "Margin terlalu besar"),
  sharePublicly: z.boolean().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface CalculatorFormProps {
  existingCalculation?: Calculation;
}

interface CalculationResult {
  totalMaterialCost: number;
  totalHPP: number;
  profit: number;
  suggestedPrice: number;
  pieChartData: { name: string; value: number; fill: string }[];
}

const motivationalToasts = [
    { title: "Mantap Jiwa! 🔥", description: "Perhitunganmu udah keren! Siap-siap cuan!" },
    { title: "Cuan is Coming! 💸", description: "Angkanya udah pas, bisnis auto-pilot!" },
    { title: "Jenius! 🧠", description: "Strategi hargamu udah di level pro! Lanjutkan!" },
];

export function CalculatorForm({ existingCalculation }: CalculatorFormProps) {
  const { user, userProfile } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<CalculationResult | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      productName: "",
      materials: [{ name: "", cost: 0, qty: 1 }],
      laborCost: 0,
      overhead: 0,
      packaging: 0,
      margin: 30,
      sharePublicly: false,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "materials",
  });

  useEffect(() => {
    if (existingCalculation) {
      form.reset({
        productName: existingCalculation.productName,
        materials: existingCalculation.materials,
        laborCost: existingCalculation.laborCost,
        overhead: existingCalculation.overhead,
        packaging: existingCalculation.packaging,
        margin: existingCalculation.margin,
        sharePublicly: existingCalculation.isPublic || false,
      });
      calculate(form.getValues());
    }
  }, [existingCalculation, form]);
  
  const calculate = (data: FormData) => {
    const totalMaterialCost = data.materials.reduce((acc, mat) => acc + mat.cost * mat.qty, 0);
    const totalHPP = totalMaterialCost + data.laborCost + data.overhead + data.packaging;
    const profit = totalHPP * (data.margin / 100);
    const suggestedPrice = totalHPP + profit;

    const pieChartData = [
      { name: "Bahan Baku", value: totalMaterialCost, fill: "hsl(var(--chart-1))" },
      { name: "Tenaga Kerja", value: data.laborCost, fill: "hsl(var(--chart-2))" },
      { name: "Overhead", value: data.overhead, fill: "hsl(var(--chart-3))" },
      { name: "Kemasan", value: data.packaging, fill: "hsl(var(--chart-4))" },
    ].filter(item => item.value > 0);

    setResult({ totalMaterialCost, totalHPP, profit, suggestedPrice, pieChartData });
  };
  
  const handleCalculate = form.handleSubmit(calculate);

  async function onSubmit(data: FormData) {
    if (!user || !userProfile) return;
    if (!result) {
        toast({ title: "Oops!", description: "Hitung dulu hasilnya sebelum menyimpan ya.", variant: "destructive" });
        return;
    }
    
    setIsSubmitting(true);
    
    const calculationData = {
        productName: data.productName,
        materials: data.materials,
        laborCost: data.laborCost,
        overhead: data.overhead,
        packaging: data.packaging,
        margin: data.margin,
        totalHPP: result.totalHPP,
        suggestedPrice: result.suggestedPrice,
        isPublic: data.sharePublicly,
    };

    let response;
    if (existingCalculation) {
        response = await updateCalculation(user.uid, existingCalculation.id, calculationData);
    } else {
        response = await addCalculation(user.uid, calculationData as any);
    }

    if (data.sharePublicly) {
        const publicData = { ...calculationData, productName: data.productName };
        delete publicData.isPublic;
        await addPublicCalculation(publicData as any, userProfile.name);
    }

    setIsSubmitting(false);

    if (response.error) {
        toast({ title: "Gagal Menyimpan", description: "Ada masalah saat menyimpan. Coba lagi.", variant: "destructive" });
    } else {
        const randomToast = motivationalToasts[Math.floor(Math.random() * motivationalToasts.length)];
        toast(randomToast);
        router.push("/dashboard");
    }
  }

  return (
    <div className="w-full grid lg:grid-cols-2 gap-8">
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Info Produk</CardTitle>
          </CardHeader>
          <CardContent>
            <Label htmlFor="productName">Nama Produk</Label>
            <Input id="productName" placeholder="Contoh: Kaos Polos 'Cuan Series'" {...form.register("productName")} />
            {form.formState.errors.productName && <p className="text-sm text-destructive mt-1">{form.formState.errors.productName.message}</p>}
          </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle className="font-headline">1. Biaya Bahan Baku</CardTitle>
                <CardDescription>Masukkan semua bahan yang kamu pakai untuk satu produk.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
            {fields.map((field, index) => (
                <div key={field.id} className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto_auto] gap-2 items-end p-3 rounded-md border">
                    <div className="flex-grow">
                        <Label>Nama Bahan</Label>
                        <Input placeholder="cth: Kain Katun" {...form.register(`materials.${index}.name`)} />
                    </div>
                    <div>
                        <Label>Biaya Satuan</Label>
                        <Input type="number" placeholder="Rp" {...form.register(`materials.${index}.cost`)} />
                    </div>
                    <div>
                        <Label>Jumlah</Label>
                        <Input type="number" {...form.register(`materials.${index}.qty`)} />
                    </div>
                    <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} disabled={fields.length <= 1}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                </div>
            ))}
            <Button type="button" variant="outline" onClick={() => append({ name: "", cost: 0, qty: 1 })}>
                <PlusCircle className="mr-2 h-4 w-4" /> Tambah Bahan
            </Button>
            {form.formState.errors.materials && <p className="text-sm text-destructive mt-1">{form.formState.errors.materials.message}</p>}
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle className="font-headline">2. Biaya Lain-lain</CardTitle>
                <CardDescription>Biaya tambahan untuk setiap produk.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <Label>Biaya Tenaga Kerja</Label>
                    <Input type="number" placeholder="Rp" {...form.register("laborCost")} />
                </div>
                <div>
                    <Label>Biaya Overhead (Listrik, Sewa, dll)</Label>
                    <Input type="number" placeholder="Rp" {...form.register("overhead")} />
                </div>
                <div>
                    <Label>Biaya Kemasan & Distribusi</Label>
                    <Input type="number" placeholder="Rp" {...form.register("packaging")} />
                </div>
            </CardContent>
        </Card>
        
        <Card>
            <CardHeader>
                <CardTitle className="font-headline">3. Margin Profit</CardTitle>
                <CardDescription>Tentukan berapa persen keuntungan yang kamu mau.</CardDescription>
            </CardHeader>
            <CardContent>
                <Label>Margin (%)</Label>
                <Input type="number" placeholder="cth: 30" {...form.register("margin")} />
            </CardContent>
        </Card>
        
        <Button type="button" onClick={handleCalculate} className="w-full font-bold bg-accent hover:bg-accent/90 text-accent-foreground text-lg py-6">
            <Wand2 className="mr-2 h-5 w-5" /> Hitung HPP
        </Button>
      </form>

      <div className="sticky top-6">
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle className="font-headline text-2xl flex items-center gap-2"><Sparkles className="text-primary"/>Hasil Perhitunganmu</CardTitle>
                <CardDescription>Ini dia rincian biaya dan saran harga jual buat produkmu.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
            {result ? (
                <>
                    <div className="h-64">
                       <CostPieChart data={result.pieChartData} />
                    </div>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center border-b pb-2">
                            <span className="text-muted-foreground">Total Biaya Bahan</span>
                            <span className="font-semibold">{formatCurrency(result.totalMaterialCost)}</span>
                        </div>
                        <div className="flex justify-between items-center border-b pb-2">
                            <span className="text-muted-foreground">Total HPP</span>
                            <span className="font-bold text-xl">{formatCurrency(result.totalHPP)}</span>
                        </div>
                        <div className="flex justify-between items-center border-b pb-2">
                            <span className="text-muted-foreground">Profit ({form.getValues("margin")}%)</span>
                            <span className="font-semibold text-green-500">{formatCurrency(result.profit)}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-primary/10 rounded-lg">
                            <span className="text-primary font-bold text-lg">Saran Harga Jual</span>
                            <span className="font-extrabold text-2xl text-primary">{formatCurrency(result.suggestedPrice)}</span>
                        </div>
                    </div>
                    <div className="space-y-4 pt-4">
                        <div className="flex items-center space-x-2">
                            <Controller
                                control={form.control}
                                name="sharePublicly"
                                render={({ field }) => (
                                    <Switch
                                        id="share-publicly"
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                    />
                                )}
                            />
                            <Label htmlFor="share-publicly" className="flex items-center gap-2">Bagikan ke Komunitas <Share2 className="h-4 w-4"/></Label>
                        </div>
                        <Button type="submit" className="w-full font-bold" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {existingCalculation ? "Update Perhitungan" : "Simpan Perhitungan"}
                        </Button>
                    </div>
                </>
            ) : (
                <div className="text-center py-20 text-muted-foreground">
                    <p>Hasil perhitunganmu akan muncul di sini.</p>
                </div>
            )}
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
