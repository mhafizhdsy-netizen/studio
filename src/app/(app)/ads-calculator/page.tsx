
"use client";

import { useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
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
  FormMessage,
} from "@/components/ui/form";
import { Megaphone, PlusCircle, Trash2 } from "lucide-react";
import { AdsAnalysisResult, type CampaignResult } from "./AdsAnalysisResult";

const campaignSchema = z.object({
  name: z.string().min(1, "Nama kampanye wajib diisi."),
  platform: z.string({ required_error: "Platform wajib dipilih." }),
  cost: z.coerce.number().min(1, "Biaya iklan harus lebih dari 0."),
  sales: z.coerce.number().min(0, "Jumlah penjualan tidak boleh negatif."),
  avgPrice: z.coerce.number().min(1, "Harga jual harus lebih dari 0."),
});

const formSchema = z.object({
  campaigns: z.array(campaignSchema).min(1, "Minimal harus ada satu kampanye."),
});

type FormData = z.infer<typeof formSchema>;

export default function AdsCalculatorPage() {
  const [results, setResults] = useState<CampaignResult[] | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      campaigns: [
        {
          name: "",
          platform: "Instagram",
          cost: "" as any,
          sales: "" as any,
          avgPrice: "" as any,
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "campaigns",
  });

  const calculateResults = (data: FormData) => {
    const campaignResults = data.campaigns.map((campaign) => {
      const revenue = campaign.sales * campaign.avgPrice;
      const roas = campaign.cost > 0 ? revenue / campaign.cost : 0;
      const roi = campaign.cost > 0 ? ((revenue - campaign.cost) / campaign.cost) * 100 : 0;
      return { ...campaign, revenue, roas, roi };
    });
    setResults(campaignResults);
  };

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
      <div className="mx-auto w-full max-w-7xl">
        <div className="flex items-center gap-2">
          <Megaphone className="h-6 w-6" />
          <h1 className="text-lg font-semibold md:text-2xl font-headline">
            Kalkulator Analisis Iklan
          </h1>
        </div>
        <p className="text-muted-foreground">
          Analisis efektivitas kampanye iklan Anda untuk memaksimalkan keuntungan.
        </p>

        <div className="grid lg:grid-cols-2 gap-8 items-start mt-6">
          <Card className="border-dashed">
            <CardHeader>
              <CardTitle>Data Kampanye Iklan</CardTitle>
              <CardDescription>
                Masukkan detail untuk setiap kampanye iklan yang ingin Anda analisis.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(calculateResults)}
                  className="space-y-6"
                >
                  <div className="space-y-4">
                    {fields.map((field, index) => (
                      <Card key={field.id} className="p-4 bg-muted/30">
                          <div className="flex justify-between items-center mb-2">
                              <Label>Kampanye #{index + 1}</Label>
                              <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => remove(index)}
                                  disabled={fields.length <= 1}
                                  className="h-7 w-7"
                              >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                          </div>
                        <div className="space-y-4">
                          <FormField
                            control={form.control}
                            name={`campaigns.${index}.name`}
                            render={({ field }) => (
                              <FormItem>
                                <Input placeholder="Nama Kampanye" {...field} />
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <div className="grid sm:grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name={`campaigns.${index}.platform`}
                              render={({ field }) => (
                                  <FormItem>
                                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                                      <FormControl>
                                      <SelectTrigger>
                                          <SelectValue placeholder="Platform" />
                                      </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                          <SelectItem value="Instagram">Instagram Ads</SelectItem>
                                          <SelectItem value="TikTok">TikTok Ads</SelectItem>
                                          <SelectItem value="Google">Google Ads</SelectItem>
                                          <SelectItem value="Facebook">Facebook Ads</SelectItem>
                                          <SelectItem value="Shopee">Shopee Ads</SelectItem>
                                          <SelectItem value="Lainnya">Lainnya</SelectItem>
                                      </SelectContent>
                                  </Select>
                                  <FormMessage />
                                  </FormItem>
                              )}
                              />
                              <FormField
                              control={form.control}
                              name={`campaigns.${index}.cost`}
                              render={({ field }) => (
                                  <FormItem>
                                  <Input type="number" placeholder="Biaya Iklan (Rp)" {...field} />
                                  <FormMessage />
                                  </FormItem>
                              )}
                              />
                          </div>
                          <div className="grid sm:grid-cols-2 gap-4">
                              <FormField
                              control={form.control}
                              name={`campaigns.${index}.sales`}
                              render={({ field }) => (
                                  <FormItem>
                                  <Input type="number" placeholder="Jumlah Penjualan" {...field} />
                                  <FormMessage />
                                  </FormItem>
                              )}
                              />
                              <FormField
                              control={form.control}
                              name={`campaigns.${index}.avgPrice`}
                              render={({ field }) => (
                                  <FormItem>
                                  <Input type="number" placeholder="Harga Jual Rata-rata" {...field} />
                                  <FormMessage />
                                  </FormItem>
                              )}
                              />
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => append({ name: "", platform: "Instagram", cost: "" as any, sales: "" as any, avgPrice: "" as any })}
                  >
                    <PlusCircle className="mr-2 h-4 w-4" /> Tambah Kampanye
                  </Button>

                  <Button type="submit" className="w-full font-bold text-lg py-6">
                    Analisis Sekarang
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
          
          {results && <AdsAnalysisResult results={results} />}

        </div>
      </div>
    </main>
  );
}
