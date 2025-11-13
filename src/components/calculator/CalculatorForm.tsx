
"use client";

import { useState, useEffect, useRef, ChangeEvent } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useUser, useFirestore, setDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase";
import { doc, serverTimestamp, collection } from 'firebase/firestore';
import type { Calculation } from "@/components/dashboard/CalculationHistory";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Trash2, PlusCircle, Loader2, Share2, Sparkles, Wand2, Download, Package, Camera } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/lib/utils";
import { CostPieChart } from "./CostPieChart";
import { Switch } from "@/components/ui/switch";
import { ProfitAIAnalyst } from "./ProfitAIAnalyst";
import { ExportDialog } from "./ExportDialog";
import { Textarea } from "../ui/textarea";
import Image from "next/image";
import { Progress } from "../ui/progress";
import { supabase, uploadFileToSupabase } from "@/lib/supabase";


const materialSchema = z.object({
  name: z.string().min(1, "Nama bahan tidak boleh kosong"),
  cost: z.coerce.number().min(0, "Biaya harus positif"),
  qty: z.coerce.number().min(1, "Jumlah minimal 1"),
});

const formSchema = z.object({
  productName: z.string().min(1, "Nama produk tidak boleh kosong"),
  productImageUrl: z.string().optional(),
  materials: z.array(materialSchema).min(1, "Minimal ada 1 bahan baku"),
  laborCost: z.coerce.number().min(0, "Biaya harus positif"),
  overhead: z.coerce.number().min(0, "Biaya harus positif"),
  packaging: z.coerce.number().min(0, "Biaya harus positif"),
  productQuantity: z.coerce.number().min(1, "Jumlah produk minimal 1"),
  margin: z.coerce.number().min(0, "Margin harus positif").max(1000, "Margin terlalu besar"),
  sharePublicly: z.boolean().optional(),
  productionTips: z.string().optional(),
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

  // State for image upload
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(existingCalculation?.productImageUrl || null);
  const [isUploading, setIsUploading] = useState(false);
  const calcIdRef = useRef(existingCalculation?.id || doc(collection(firestore, 'temp')).id);


  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      productName: "",
      productImageUrl: "",
      materials: [{ name: "", cost: 0, qty: 1 }],
      laborCost: 0,
      overhead: 0,
      packaging: 0,
      productQuantity: 1,
      margin: 30,
      sharePublicly: false,
      productionTips: "",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "materials",
  });

  const watchSharePublicly = form.watch("sharePublicly");

  useEffect(() => {
    if (existingCalculation) {
      const materials = (existingCalculation.materials || []).map(m => ({
        ...m,
        cost: Number(m.cost),
        qty: Number(m.qty)
      }));

      form.reset({
        productName: existingCalculation.productName,
        productImageUrl: existingCalculation.productImageUrl || "",
        materials: materials.length > 0 ? materials : [{ name: "", cost: 0, qty: 1 }],
        laborCost: Number(existingCalculation.laborCost),
        overhead: Number(existingCalculation.overhead),
        packaging: Number(existingCalculation.packaging),
        margin: Number(existingCalculation.margin),
        sharePublicly: existingCalculation.isPublic || false,
        productQuantity: existingCalculation.productQuantity || 1,
        productionTips: existingCalculation.productionTips || "",
      });
      setImageUrl(existingCalculation.productImageUrl || null);
      calculate(form.getValues());
    }
  }, [existingCalculation, form]);

    const handlePhotoChange = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    if (!supabase || !user) {
      toast({ title: "Error", description: "Layanan penyimpanan tidak tersedia.", variant: "destructive" });
      return;
    }

    const file = e.target.files[0];
    const localUrl = URL.createObjectURL(file);
    setImageUrl(localUrl);
    setIsUploading(true);
    setUploadProgress(0);

    const filePath = `public/product-images/${user.uid}/${calcIdRef.current}/${file.name}`;

    try {
      const newPhotoURL = await uploadFileToSupabase(file, 'user-assets', filePath, (progress) => {
        setUploadProgress(progress);
      });
      setImageUrl(newPhotoURL);
      form.setValue('productImageUrl', newPhotoURL);
      toast({ title: "Sukses!", description: "Gambar produk berhasil diunggah." });
    } catch (error) {
      console.error(error);
      setImageUrl(existingCalculation?.productImageUrl || null); // Revert on error
      toast({ title: "Gagal", description: "Gagal mengunggah gambar produk.", variant: "destructive" });
    } finally {
        setIsUploading(false);
        setTimeout(() => setUploadProgress(null), 2000);
    }
  };
  
  const calculate = (data: FormData) => {
    const totalMaterialCost = data.materials.reduce((acc, mat) => acc + mat.cost * mat.qty, 0);
    const laborCostPerProduct = data.productQuantity > 0 ? data.laborCost / data.productQuantity : 0;
    const overheadPerProduct = data.productQuantity > 0 ? data.overhead / data.productQuantity : 0;
    
    const totalHPP = totalMaterialCost + laborCostPerProduct + overheadPerProduct + data.packaging;
    const profit = totalHPP * (data.margin / 100);
    const suggestedPrice = totalHPP + profit;

    const pieChartData = [
      { name: "Bahan Baku", value: totalMaterialCost, fill: "hsl(var(--chart-1))" },
      { name: "Tenaga Kerja", value: laborCostPerProduct, fill: "hsl(var(--chart-2))" },
      { name: "Overhead", value: overheadPerProduct, fill: "hsl(var(--chart-3))" },
      { name: "Kemasan", value: data.packaging, fill: "hsl(var(--chart-4))" },
    ].filter(item => item.value > 0);

    setResult({ totalMaterialCost, totalHPP, profit, suggestedPrice, pieChartData });
  };
  
  const handleCalculate = form.handleSubmit(calculate);

  function onSubmit(data: FormData) {
    if (!user || !firestore) return;
    if (!result) {
        toast({ title: "Oops!", description: "Hitung dulu hasilnya sebelum menyimpan ya.", variant: "destructive" });
        return;
    }
    
    setIsSubmitting(true);
    
    const calculationData: Omit<Calculation, 'id' | 'createdAt' | 'updatedAt'> = {
        productName: data.productName,
        productImageUrl: data.productImageUrl || "",
        materials: data.materials.map(m => ({ ...m, cost: Number(m.cost), qty: Number(m.qty) })),
        laborCost: Number(data.laborCost),
        overhead: Number(data.overhead),
        packaging: Number(data.packaging),
        margin: Number(data.margin),
        totalHPP: result.totalHPP,
        suggestedPrice: result.suggestedPrice,
        isPublic: data.sharePublicly || false,
        userId: user.uid,
        productQuantity: data.productQuantity,
        productionTips: data.productionTips || "",
    };

    // Main calculation document
    const calcRef = existingCalculation
        ? doc(firestore, 'users', user.uid, 'calculations', existingCalculation.id)
        : doc(collection(firestore, 'users', user.uid, 'calculations'), calcIdRef.current);

    const dataToSave = existingCalculation
        ? { ...calculationData, updatedAt: serverTimestamp() }
        : { ...calculationData, createdAt: serverTimestamp(), updatedAt: serverTimestamp() };

    setDocumentNonBlocking(calcRef, dataToSave, { merge: true });

    // Public calculation document
    const publicCalcId = calcIdRef.current;
    const publicCalcRef = doc(firestore, 'public_calculations', publicCalcId);

    if (data.sharePublicly) {
        const publicData = {
            ...calculationData,
            userName: user.displayName || 'Anonymous',
            userPhotoURL: user.photoURL || '',
            createdAt: existingCalculation?.createdAt || serverTimestamp(),
            updatedAt: serverTimestamp(),
        };
        delete (publicData as any).userId; 
        delete (publicData as any).isPublic;

        setDocumentNonBlocking(publicCalcRef, publicData, { merge: true });
    } else if (existingCalculation && existingCalculation.isPublic) {
        deleteDocumentNonBlocking(publicCalcRef);
    }

    const randomToast = motivationalToasts[Math.floor(Math.random() * motivationalToasts.length)];
    toast(randomToast);
    router.push("/dashboard");
    setIsSubmitting(false);
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
            <CardContent className="space-y-4">
               <div
                className="relative aspect-video w-full bg-muted rounded-lg flex items-center justify-center border-2 border-dashed border-border cursor-pointer hover:border-primary transition-colors"
                onClick={() => supabase && fileInputRef.current?.click()}
              >
                {imageUrl ? (
                  <Image src={imageUrl} alt="Pratinjau Produk" layout="fill" className="object-cover rounded-lg" />
                ) : (
                  <div className="text-center text-muted-foreground">
                    <Package className="mx-auto h-12 w-12" />
                    <p>Unggah Gambar Produk</p>
                  </div>
                )}
                 <div className="absolute bottom-2 right-2 bg-secondary text-secondary-foreground rounded-full p-2">
                    <Camera className="h-4 w-4" />
                </div>
                {isUploading && uploadProgress !== null && (
                    <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center rounded-lg p-4">
                        <Progress value={uploadProgress} className="w-11/12 h-2" />
                        <p className="text-white text-sm mt-2">{Math.round(uploadProgress)}%</p>
                    </div>
                )}
                <Input
                  type="file"
                  ref={fileInputRef}
                  onChange={handlePhotoChange}
                  className="hidden"
                  accept="image/png, image/jpeg, image/webp"
                  disabled={isUploading || !supabase}
                />
              </div>
              <div>
                <Label htmlFor="productName">Nama Produk</Label>
                <Input id="productName" placeholder="Contoh: Kaos Polos 'Cuan Series'" {...form.register("productName")} />
                {form.formState.errors.productName && <p className="text-sm text-destructive mt-1">{form.formState.errors.productName.message}</p>}
              </div>
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
                  <CardTitle className="font-headline">2. Biaya Produksi</CardTitle>
                  <CardDescription>Biaya tambahan untuk keseluruhan proses produksi.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                  <div>
                      <Label>Biaya Tenaga Kerja</Label>
                      <Input type="number" placeholder="Rp" {...form.register("laborCost")} />
                      <p className="text-xs text-muted-foreground mt-1">Gaji perhari ÷ jumlah produk perhari. contoh Rp 100.000 ÷ 500</p>
                  </div>
                  <div>
                      <Label>Biaya Overhead</Label>
                      <Input type="number" placeholder="Rp" {...form.register("overhead")} />
                      <p className="text-xs text-muted-foreground mt-1">(listrik,sewa,dll) ÷ jumlah produksi. contoh Rp 2.000.000 ÷ 200 =</p>
                  </div>
              </CardContent>
          </Card>
          
          <Card>
              <CardHeader>
                  <CardTitle className="font-headline">3. Biaya per Produk</CardTitle>
                  <CardDescription>Biaya tambahan yang dihitung untuk setiap unit produk.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                 <div>
                      <Label>Biaya Kemasan & Distribusi (per produk)</Label>
                      <Input type="number" placeholder="Rp" {...form.register("packaging")} />
                  </div>
              </CardContent>
          </Card>

          <Card>
              <CardHeader>
                  <CardTitle className="font-headline">4. Kuantitas & Margin</CardTitle>
                  <CardDescription>Tentukan jumlah produksi dan target keuntunganmu.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="productQuantity">Jumlah Produk Dihasilkan</Label>
                  <Input id="productQuantity" type="number" placeholder="cth: 500" {...form.register("productQuantity")} />
                   {form.formState.errors.productQuantity && <p className="text-sm text-destructive mt-1">{form.formState.errors.productQuantity.message}</p>}
                   <p className="text-xs text-muted-foreground mt-1">Total produk yang dihasilkan dalam satu batch produksi.</p>
                </div>
                <div>
                  <Label>Margin Profit (%)</Label>
                  <Input type="number" placeholder="cth: 30" {...form.register("margin")} />
                </div>
              </CardContent>
          </Card>
          
          <Button type="button" onClick={handleCalculate} className="w-full font-bold bg-accent hover:bg-accent/90 text-accent-foreground text-lg py-6">
              <Wand2 className="mr-2 h-5 w-5" /> Hitung HPP
          </Button>
        </div>

        <div className="sticky top-6 space-y-6" id="print-area">
          <Card className="shadow-lg print-card">
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
                              <span className="text-muted-foreground">Total HPP per Produk</span>
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
                      <div className="space-y-4 pt-4 hide-on-print">
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
                           {watchSharePublicly && (
                            <div>
                              <Label htmlFor="productionTips">Tips Produksi (Opsional)</Label>
                              <Textarea
                                id="productionTips"
                                placeholder="Contoh: Gunakan perbandingan 1 teh celup untuk 4-5 gelas es teh..."
                                {...form.register("productionTips")}
                              />
                              <p className="text-xs text-muted-foreground mt-1">
                                Bagikan tips, resep, atau cara produksimu agar bisa jadi inspirasi user lain.
                              </p>
                            </div>
                          )}
                          <Button type="submit" className="w-full font-bold" disabled={isSubmitting || isUploading}>
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
                    productQuantity: Number(form.getValues("productQuantity")),
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
