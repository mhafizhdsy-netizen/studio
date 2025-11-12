
"use client";

import { useState, useEffect } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useUser, useFirestore, errorEmitter, FirestorePermissionError } from "@/firebase";
import { doc, serverTimestamp, collection, writeBatch } from 'firebase/firestore';
import type { Calculation } from "@/components/dashboard/CalculationHistory";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Trash2, PlusCircle, Loader2, Share2, Sparkles, Wand2, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/lib/utils";
import { CostPieChart } from "./CostPieChart";
import { Switch } from "@/components/ui/switch";
import { ProfitAIAnalyst } from "./ProfitAIAnalyst";
import { ExportDialog } from "./ExportDialog";


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

export interface CalculationResult {
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
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);

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
      const materials = existingCalculation.materials.map(m => ({
        ...m,
        cost: Number(m.cost),
        qty: Number(m.qty)
      }));

      form.reset({
        productName: existingCalculation.productName,
        materials: materials,
        laborCost: Number(existingCalculation.laborCost),
        overhead: Number(existingCalculation.overhead),
        packaging: Number(existingCalculation.packaging),
        margin: Number(existingCalculation.margin),
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
    if (!user || !firestore) return;
    if (!result) {
        toast({ title: "Oops!", description: "Hitung dulu hasilnya sebelum menyimpan ya.", variant: "destructive" });
        return;
    }
    
    setIsSubmitting(true);
    
    const calculationData: Omit<Calculation, 'id' | 'createdAt' | 'updatedAt'> = {
        productName: data.productName,
        materials: data.materials.map(m => ({ ...m, cost: Number(m.cost), qty: Number(m.qty) })),
        laborCost: Number(data.laborCost),
        overhead: Number(data.overhead),
        packaging: Number(data.packaging),
        margin: Number(data.margin),
        totalHPP: result.totalHPP,
        suggestedPrice: result.suggestedPrice,
        isPublic: data.sharePublicly || false,
        userId: user.uid,
    };

    const batch = writeBatch(firestore);

    // Main calculation document
    const calcRef = existingCalculation
        ? doc(firestore, 'users', user.uid, 'calculations', existingCalculation.id)
        : doc(collection(firestore, 'users', user.uid, 'calculations'));

    const dataToSave = existingCalculation
        ? { ...calculationData, updatedAt: serverTimestamp() }
        : { ...calculationData, createdAt: serverTimestamp() };

    batch.set(calcRef, dataToSave, { merge: true });

    // Public calculation document
    const publicCalcId = existingCalculation ? existingCalculation.id : calcRef.id;
    const publicCalcRef = doc(firestore, 'public_calculations', publicCalcId);

    if (data.sharePublicly) {
        const publicData = {
            productName: data.productName,
            totalHPP: result.totalHPP,
            suggestedPrice: result.suggestedPrice,
            margin: Number(data.margin),
            userName: user.displayName || 'Anonymous',
            createdAt: existingCalculation?.createdAt || serverTimestamp(),
            updatedAt: serverTimestamp(),
        };
        
        batch.set(publicCalcRef, publicData, { merge: true });
    } else if (existingCalculation && existingCalculation.isPublic) {
        // If it was public before, but now it's not, delete it.
        batch.delete(publicCalcRef);
    }

    batch.commit().then(() => {
        const randomToast = motivationalToasts[Math.floor(Math.random() * motivationalToasts.length)];
        toast(randomToast);
        router.push("/dashboard");
    }).catch(error => {
        const isCreating = !existingCalculation;
        const operation = isCreating ? 'create' : 'update';
        
        const permissionError = new FirestorePermissionError({
            path: calcRef.path,
            operation,
            requestResourceData: dataToSave,
        });

        errorEmitter.emit('permission-error', permissionError);

        setIsSubmitting(false); // Make sure to re-enable button on error
    });
  }

  const calculationForExport = result ? { ...form.getValues(), ...result } : null;

  return (
    <div className="w-full">
      <form onSubmit={form.handleSubmit(onSubmit)} className="w-full grid lg:grid-cols-2 gap-8">
        <div className="space-y-6">
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
        </div>

        <div className="sticky top-6 space-y-6" id="print-area">
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
                      <div className="space-y-2 pt-4 hide-on-print">
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
                           <Button type="button" variant="outline" className="w-full" onClick={() => setIsExportDialogOpen(true)}>
                              <Download className="mr-2 h-4 w-4" />
                              Ekspor Hasil
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
          {result && (
              <ProfitAIAnalyst
                calculationData={{
                    productName: form.getValues("productName"),
                    materials: form.getValues("materials").map(m => ({ ...m, cost: Number(m.cost), qty: Number(m.qty) })),
                    laborCost: Number(form.getValues("laborCost")),
                    overhead: Number(form.getValues("overhead")),
                    packaging: Number(form.getValues("packaging")),
                    margin: Number(form.getValues("margin")),
                }}
                totalHPP={result.totalHPP}
              />
            )}
        </div>
      </form>
       {calculationForExport && (
        <ExportDialog
          isOpen={isExportDialogOpen}
          onOpenChange={setIsExportDialogOpen}
          calculationData={calculationForExport}
        />
      )}
    </div>
  );
}
