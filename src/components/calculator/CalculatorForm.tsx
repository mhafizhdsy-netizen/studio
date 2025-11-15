
"use client";

import { useState, useEffect, ChangeEvent, useRef } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/supabase/auth-provider";
import { supabase, uploadFileToSupabase, deleteFileFromSupabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Trash2, PlusCircle, Loader2, Share2, Sparkles, Wand2, Download, Package, Camera, Link as LinkIcon, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { formatCurrency, sanitizeFileName } from "@/lib/utils";
import { CostPieChart } from "./CostPieChart";
import { Switch } from "@/components/ui/switch";
import { ProfitAIAnalyst } from "./ProfitAIAnalyst";
import { ExportDialog } from "./ExportDialog";
import { Textarea } from "../ui/textarea";
import Image from "next/image";
import { Progress } from "../ui/progress";
import { ProductDescriptionGenerator } from "./ProductDescriptionGenerator";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Calculation } from "../dashboard/CalculationHistory";
import { Button } from "../ui/button";
import { v4 as uuidv4 } from 'uuid';
import { moderateImage } from "@/ai/flows/image-moderation-flow";

const materialSchema = z.object({
  name: z.string().min(1, "Nama bahan tidak boleh kosong"),
  cost: z.coerce.number().min(0, "Biaya harus positif"),
  isTotalCost: z.boolean().optional(),
  qty: z.coerce.number().min(1, "Jumlah minimal 1"),
  unit: z.string().optional(),
  description: z.string().optional(),
  purchaseLink: z.string().url("URL tidak valid").optional().or(z.literal('')),
});

const formSchema = z.object({
  productName: z.string().min(1, "Nama produk tidak boleh kosong"),
  productImageUrl: z.string().optional(),
  productDescription: z.string().optional(),
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

const fileToDataUri = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};


export function CalculatorForm({ existingCalculation }: CalculatorFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);

  const [imageUrl, setImageUrl] = useState<string | null>(existingCalculation?.productImageUrl || null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      productName: "",
      productImageUrl: "",
      productDescription: "",
      materials: [{ name: "", cost: 0, qty: 1, unit: "", description: "", isTotalCost: false, purchaseLink: "" }],
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
  const watchProductName = form.watch("productName");

  useEffect(() => {
    if (existingCalculation) {
      const materials = (existingCalculation.materials || []).map(m => ({
        ...m,
        cost: Number(m.cost),
        qty: Number(m.qty),
        unit: m.unit || "",
        description: m.description || "",
        isTotalCost: m.isTotalCost || false,
        purchaseLink: m.purchaseLink || "",
      }));

      form.reset({
        productName: existingCalculation.productName,
        productImageUrl: existingCalculation.productImageUrl || "",
        productDescription: existingCalculation.productDescription || "",
        materials: materials.length > 0 ? materials : [{ name: "", cost: 0, qty: 1, unit: "", description: "", isTotalCost: false, purchaseLink: "" }],
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
    if (!user) {
      toast({ title: "Error", description: "Layanan penyimpanan tidak tersedia.", variant: "destructive" });
      return;
    }

    const file = e.target.files[0];
    const oldImageUrl = form.getValues('productImageUrl');

    const localUrl = URL.createObjectURL(file);
    setImageUrl(localUrl);
    setIsUploading(true);

    const imageDataUri = await fileToDataUri(file);
    const moderationResult = await moderateImage({ imageDataUri });

    if (!moderationResult.isSafe) {
        toast({
            title: "Gambar Tidak Sesuai",
            description: moderationResult.reason || "Gambar yang Anda pilih melanggar pedoman komunitas kami.",
            variant: "destructive",
        });
        setImageUrl(oldImageUrl || null); // Revert to old image
        setIsUploading(false);
        if (fileInputRef.current) {
            fileInputRef.current.value = ""; 
        }
        return;
    }
    
    const calculationId = existingCalculation?.id || uuidv4();
    const cleanFileName = sanitizeFileName(file.name);
    const filePath = `public/product-images/${user.id}/${calculationId}/${cleanFileName}`;

    try {
      const newPhotoURL = await uploadFileToSupabase(file, 'user-assets', filePath);

      if (oldImageUrl) {
          await deleteFileFromSupabase('user-assets', oldImageUrl);
      }

      setImageUrl(newPhotoURL);
      form.setValue('productImageUrl', newPhotoURL);
      toast({ title: "Sukses!", description: "Gambar produk berhasil diunggah." });
    } catch (error) {
      console.error(error);
      setImageUrl(oldImageUrl || null); // Revert to old image on failure
      toast({ title: "Gagal", description: "Gagal mengunggah gambar produk.", variant: "destructive" });
    } finally {
        setIsUploading(false);
    }
  };
  
  const calculate = (data: FormData) => {
    const totalMaterialCostForBatch = data.materials.reduce((acc, mat) => {
      const cost = mat.cost || 0;
      const qty = mat.qty || 1;
      const materialTotal = mat.isTotalCost ? cost : cost * qty;
      return acc + (isNaN(materialTotal) ? 0 : materialTotal);
    }, 0);
  
    const totalBatchCost = totalMaterialCostForBatch + data.laborCost + data.overhead;
  
    const costPerProductBeforePackaging = data.productQuantity > 0 ? totalBatchCost / data.productQuantity : 0;
  
    const totalHPP = costPerProductBeforePackaging + data.packaging;
  
    const profit = totalHPP * (data.margin / 100);
    const suggestedPrice = totalHPP + profit;
  
    const materialCostPerProduct = data.productQuantity > 0 ? totalMaterialCostForBatch / data.productQuantity : 0;
    const laborCostPerProduct = data.productQuantity > 0 ? data.laborCost / data.productQuantity : 0;
    const overheadPerProduct = data.productQuantity > 0 ? data.overhead / data.productQuantity : 0;
  
    const pieChartData = [
      { name: "Bahan Baku", value: materialCostPerProduct, fill: "hsl(var(--chart-1))" },
      { name: "Tenaga Kerja", value: laborCostPerProduct, fill: "hsl(var(--chart-2))" },
      { name: "Overhead", value: overheadPerProduct, fill: "hsl(var(--chart-3))" },
      { name: "Kemasan", value: data.packaging, fill: "hsl(var(--chart-4))" },
    ].filter(item => item.value > 0);
  
    setResult({ totalMaterialCost: materialCostPerProduct, totalHPP, profit, suggestedPrice, pieChartData });
  };
  
  const handleCalculate = form.handleSubmit(calculate);

  async function onSubmit(data: FormData) {
    if (!user) return;
    if (!result) {
        toast({ title: "Oops!", description: "Hitung dulu hasilnya sebelum menyimpan ya.", variant: "destructive" });
        return;
    }
    
    setIsSubmitting(true);
    
    const calculationId = existingCalculation?.id || uuidv4();

    const calculationData = {
        id: calculationId,
        productName: data.productName,
        productImageUrl: data.productImageUrl || "",
        productDescription: data.productDescription || "",
        materials: data.materials.map(m => ({ ...m, cost: Number(m.cost), qty: Number(m.qty), unit: m.unit || "", description: m.description || "", isTotalCost: m.isTotalCost || false, purchaseLink: m.purchaseLink || "" })),
        laborCost: Number(data.laborCost),
        overhead: Number(data.overhead),
        packaging: Number(data.packaging),
        margin: Number(data.margin),
        totalHPP: result.totalHPP,
        suggestedPrice: result.suggestedPrice,
        isPublic: data.sharePublicly || false,
        userId: user.id,
        productQuantity: data.productQuantity,
        productionTips: data.productionTips || "",
        updatedAt: new Date().toISOString(),
        ...(existingCalculation ? {} : { createdAt: new Date().toISOString() })
    };

    const { error: calcError } = await supabase.from('calculations').upsert(calculationData);

    if (calcError) {
      console.error('Supabase calculation upsert error:', calcError);
      toast({ title: "Gagal Menyimpan", description: "Gagal menyimpan perhitungan.", variant: "destructive" });
      setIsSubmitting(false);
      return;
    }
    
    if (data.sharePublicly) {
        const publicData = {
            id: calculationId, 
        };
    } else if (existingCalculation?.isPublic) {
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
                onClick={() => user && fileInputRef.current?.click()}
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
                {isUploading && (
                    <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center rounded-lg p-4">
                        <Progress value={null} className="w-11/12 h-2" />
                        <p className="text-white text-sm mt-2">Mengunggah...</p>
                    </div>
                )}
                <Input
                  type="file"
                  ref={fileInputRef}
                  onChange={handlePhotoChange}
                  className="hidden"
                  accept="image/png, image/jpeg, image/webp"
                  disabled={isUploading || !user}
                />
              </div>
              <div>
                <Label htmlFor="productName">Nama Produk</Label>
                <Input id="productName" placeholder="Contoh: Kaos Polos 'Cuan Series'" {...form.register("productName")} />
                {form.formState.errors.productName && <p className="text-sm text-destructive mt-1">{form.formState.errors.productName.message}</p>}
              </div>

               <div className="space-y-2">
                <ProductDescriptionGenerator
                    productName={watchProductName}
                    onDescriptionGenerated={(desc) => form.setValue("productDescription", desc.marketplace)}
                />
               </div>

                <div>
                    <Label htmlFor="productDescription">Deskripsi Produk (untuk Komunitas)</Label>
                    <Textarea
                        id="productDescription"
                        placeholder="Deskripsi produk akan muncul di sini setelah dibuat oleh AI, atau bisa diisi manual..."
                        {...form.register("productDescription")}
                        rows={5}
                    />
                     <p className="text-xs text-muted-foreground mt-1">
                       Deskripsi ini akan ditampilkan jika Anda membagikan perhitungan ke komunitas.
                    </p>
                </div>
            </CardContent>
          </Card>

          <Card>
              <CardHeader>
                  <CardTitle className="font-headline">1. Biaya Bahan Baku</CardTitle>
                  <CardDescription>Masukkan semua bahan baku yang dibutuhkan untuk satu batch produksi (sesuai jumlah produk di atas).</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
              {fields.map((field, index) => (
                  <div key={field.id} className="grid grid-cols-1 gap-2 p-3 rounded-md border">
                      <div className="flex justify-end">
                        <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} disabled={fields.length <= 1} className="h-7 w-7">
                            <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2 items-end">
                        <div className="flex-grow">
                            <Label>Nama Bahan</Label>
                            <Input placeholder="cth: Kain Katun" {...form.register(`materials.${index}.name`)} />
                        </div>
                        <div className="w-full sm:w-32">
                            <Label>Biaya</Label>
                            <Input type="number" placeholder="Rp" {...form.register(`materials.${index}.cost`)} />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-[auto_auto_1fr] gap-x-4 gap-y-2 items-center mt-2">
                        <div className="w-full sm:w-20">
                            <Label>Jumlah</Label>
                            <Input type="number" {...form.register(`materials.${index}.qty`)} />
                        </div>
                        <div className="w-full sm:w-24">
                            <Label>Satuan</Label>
                            <Input placeholder="meter, kg" {...form.register(`materials.${index}.unit`)} />
                        </div>
                         <Controller
                            control={form.control}
                            name={`materials.${index}.isTotalCost`}
                            render={({ field }) => (
                                <div className="flex items-center space-x-2 justify-self-start sm:justify-self-end pt-5">
                                    <Switch
                                        id={`isTotalCost-${index}`}
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                    />
                                    <Label htmlFor={`isTotalCost-${index}`} className="text-xs">
                                        Harga Total?
                                    </Label>
                                </div>
                            )}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Aktifkan 'Harga Total' jika biaya yang dimasukkan adalah untuk keseluruhan jumlah (Qty) bahan tersebut, bukan harga per satuan.</p>

                      {watchSharePublicly && (
                        <div className="mt-4 space-y-4">
                          <div>
                            <Label>Deskripsi Bahan (Opsional)</Label>
                            <Textarea placeholder="cth: Kain katun combed 30s dari supplier Bandung..." {...form.register(`materials.${index}.description`)} />
                          </div>
                          <div>
                            <Label>Tautan Beli Bahan (Opsional)</Label>
                            <div className="relative">
                                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
                                <Input
                                placeholder="https://tokopedia.com/..."
                                className="pl-9"
                                {...form.register(`materials.${index}.purchaseLink`)}
                                />
                            </div>
                            {form.formState.errors.materials?.[index]?.purchaseLink && <p className="text-sm text-destructive mt-1">{form.formState.errors.materials?.[index]?.purchaseLink?.message}</p>}
                          </div>
                        </div>
                      )}
                  </div>
              ))}
              <Button type="button" variant="outline" onClick={() => append({ name: "", cost: 0, qty: 1, unit: "", description: "", isTotalCost: false, purchaseLink: "" })}>
                  <PlusCircle className="mr-2 h-4 w-4" /> Tambah Bahan
              </Button>
              {form.formState.errors.materials && <p className="text-sm text-destructive mt-1">{form.formState.errors.materials.message}</p>}
              </CardContent>
          </Card>

          <Card>
              <CardHeader>
                  <CardTitle className="font-headline">2. Biaya Produksi</CardTitle>
                  <CardDescription>Total biaya tambahan untuk keseluruhan batch produksi.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                  <div>
                      <Label>Biaya Tenaga Kerja (Total)</Label>
                      <Input type="number" placeholder="Rp" {...form.register("laborCost")} />
                      <p className="text-xs text-muted-foreground mt-1">Contoh: Gaji semua karyawan untuk menyelesaikan satu batch.</p>
                  </div>
                  <div>
                      <Label>Biaya Overhead (Total)</Label>
                      <Input type="number" placeholder="Rp" {...form.register("overhead")} />
                      <p className="text-xs text-muted-foreground mt-1">Contoh: Total biaya listrik, sewa, dll untuk satu batch.</p>
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
                  <CardTitle className="font-headline">4. Kuantitas &amp; Margin</CardTitle>
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
          
          <Button type="button" onClick={handleCalculate} variant="accent" className="w-full font-bold text-lg py-6">
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
                              <span className="text-muted-foreground">Total Biaya Bahan (per produk)</span>
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
                            <div className="space-y-4">
                               <Alert>
                                <Info className="h-4 w-4" />
                                <AlertTitle className="font-semibold">Mantap!</AlertTitle>
                                <AlertDescription>
                                  Biar makin bermanfaat buat komunitas, yuk isi detail tambahan seperti deskripsi & link pembelian untuk setiap bahan baku.
                                </AlertDescription>
                              </Alert>
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
