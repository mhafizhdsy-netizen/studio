'use server';
/**
 * @fileOverview An AI flow for analyzing profit margins and providing suggestions.
 *
 * - analyzeProfitMargin - A function that handles the profit margin analysis.
 * - ProfitAnalysisInput - The input type for the analyzeProfitMargin function.
 * - ProfitAnalysisOutput - The return type for the analyzeProfitMargin function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const MaterialSchema = z.object({
  name: z.string(),
  cost: z.number(),
  qty: z.number(),
});

export const ProfitAnalysisInputSchema = z.object({
  productName: z.string(),
  materials: z.array(MaterialSchema),
  laborCost: z.number(),
  overhead: z.number(),
  packaging: z.number(),
  currentMargin: z.number(),
  targetMargin: z.number(),
  totalHPP: z.number(),
});
export type ProfitAnalysisInput = z.infer<typeof ProfitAnalysisInputSchema>;

export const ProfitAnalysisOutputSchema = z.object({
  insights: z.object({
    summary: z.string().describe('A brief, encouraging summary of the feasibility of reaching the target margin and the overall strategy.'),
    materialSuggestions: z.array(z.string()).describe('Actionable suggestions to reduce material costs. e.g., "Coba cari supplier kain katun alternatif yang lebih murah" or "Beli benang dalam jumlah besar untuk diskon."'),
    efficiencySuggestions: z.array(z.string()).describe('Actionable suggestions for efficiency gains to lower labor or overhead costs. e.g., "Optimalkan proses jahit untuk mengurangi waktu kerja per kaos."'),
    pricingStrategy: z.string().describe('A recommendation on adjusting the final selling price to help meet the margin goal, considering the other suggestions.'),
  }),
});
export type ProfitAnalysisOutput = z.infer<typeof ProfitAnalysisOutputSchema>;

export async function analyzeProfitMargin(
  input: ProfitAnalysisInput
): Promise<ProfitAnalysisOutput> {
  return profitAnalysisFlow(input);
}

const prompt = ai.definePrompt({
  name: 'profitAnalysisPrompt',
  input: { schema: ProfitAnalysisInputSchema },
  output: { schema: ProfitAnalysisOutputSchema },
  prompt: `You are an expert business consultant for Indonesian entrepreneurs. Your tone is encouraging, smart, and friendly, using a mix of formal Indonesian and modern slang (bahasa gaul anak muda).

A user wants to analyze their product, "{{productName}}", to reach a target profit margin of {{targetMargin}}%. Their current margin is {{currentMargin}}%.

Here is their current cost breakdown (HPP is {{totalHPP}}):
- Materials: {{#each materials}}- {{name}}: {{cost}} (qty: {{qty}}){{/each}}
- Labor Cost: {{laborCost}}
- Overhead: {{overhead}}
- Packaging: {{packaging}}

Your task is to provide actionable advice. The goal is to bridge the gap between {{currentMargin}}% and {{targetMargin}}%.

Generate a JSON object with the following structure:
- "insights.summary": Berikan ringkasan singkat dan memotivasi.
- "insights.materialSuggestions": Berikan 2-3 saran konkret untuk mengurangi biaya bahan baku. Jadilah spesifik.
- "insights.efficiencySuggestions": Berikan 1-2 saran untuk efisiensi produksi (tenaga kerja, overhead).
- "insights.pricingStrategy": Berikan saran tentang penyesuaian harga jual, dengan mempertimbangkan saran-saran lainnya.

IMPORTANT: Respond ONLY with the valid JSON object. Do not include any other text or markdown formatting.`,
});

const profitAnalysisFlow = ai.defineFlow(
  {
    name: 'profitAnalysisFlow',
    inputSchema: ProfitAnalysisInputSchema,
    outputSchema: ProfitAnalysisOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) {
      throw new Error('Failed to get analysis from AI');
    }
    return output;
  }
);
