
"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Bot,
  Loader2,
  Lightbulb,
  TrendingUp,
  Settings,
  DollarSign,
  Info,
  BadgePercent,
} from 'lucide-react';
import { analyzeProfitMargin } from '@/ai/flows/profit-analysis-flow';
import type {
  ProfitAnalysisInput,
  ProfitAnalysisOutput,
} from '@/ai/flows/profit-analysis-schemas';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';

const formSchema = z.object({
  targetMargin: z.coerce
    .number()
    .min(1, 'Target margin harus lebih dari 0')
    .max(1000, 'Target margin tidak realistis'),
});

type FormData = z.infer<typeof formSchema>;

interface ProfitAIAnalystProps {
  calculationData: Omit<
    ProfitAnalysisInput,
    'currentMargin' | 'targetMargin' | 'totalHPP'
  > & { margin: number };
  totalHPP: number;
}

export function ProfitAIAnalyst({
  calculationData,
  totalHPP,
}: ProfitAIAnalystProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] =
    useState<ProfitAnalysisOutput | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      targetMargin: calculationData.margin + 10,
    },
  });

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    setError(null);
    setAnalysisResult(null);

    const input: ProfitAnalysisInput = {
      ...calculationData,
      targetMargin: data.targetMargin,
      currentMargin: calculationData.margin,
      totalHPP: totalHPP,
    };

    try {
      const result = await analyzeProfitMargin(input);
      setAnalysisResult(result);
    } catch (e: any) {
      console.error(e);
      setError(
        'Waduh, AI-nya lagi pusing. Coba beberapa saat lagi ya!'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-xl flex items-center gap-2">
          <Bot className="text-primary" />
          Profit Margin AI Analyst
        </CardTitle>
        <CardDescription>
          Dapatkan insight dari AI untuk mencapai target profitmu.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <Label htmlFor="target-margin">Set Target Margin (%)</Label>
            <div className="flex gap-2">
              <Input
                id="target-margin"
                type="number"
                {...form.register('targetMargin')}
              />
              <Button onClick={form.handleSubmit(onSubmit)} disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Lightbulb className="h-4 w-4" />
                )}
                <span className="ml-2">Analisis</span>
              </Button>
            </div>
            {form.formState.errors.targetMargin && (
              <p className="text-sm text-destructive mt-1">
                {form.formState.errors.targetMargin.message}
              </p>
            )}
          </div>
        </div>

        {error && (
            <Alert variant="destructive" className="mt-4">
                <Info className="h-4 w-4" />
                <AlertTitle>Analisis Gagal</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        )}

        {analysisResult && (
          <div className="mt-6 space-y-4">
            <Alert>
              <TrendingUp className="h-4 w-4" />
              <AlertTitle className="font-bold">Ringkasan AI</AlertTitle>
              <AlertDescription>
                {analysisResult.insights.summary}
              </AlertDescription>
            </Alert>
            <Accordion type="single" collapsible defaultValue="item-1" className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger>
                  <div className="flex items-center gap-2">
                    <BadgePercent className="h-4 w-4" />
                    Benchmark Harga Pasar
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <p className="text-muted-foreground">{analysisResult.insights.marketPriceBenchmark}</p>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2">
                <AccordionTrigger>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Saran Biaya Bahan
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
                    {analysisResult.insights.materialSuggestions.map(
                      (suggestion, i) => (
                        <li key={i}>{suggestion}</li>
                      )
                    )}
                  </ul>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-3">
                <AccordionTrigger>
                  <div className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Saran Efisiensi
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
                    {analysisResult.insights.efficiencySuggestions.map(
                      (suggestion, i) => (
                        <li key={i}>{suggestion}</li>
                      )
                    )}
                  </ul>
                </AccordionContent>
              </AccordionItem>
               <AccordionItem value="item-4">
                <AccordionTrigger>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Strategi Harga
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                    <p className="text-muted-foreground">{analysisResult.insights.pricingStrategy}</p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

    